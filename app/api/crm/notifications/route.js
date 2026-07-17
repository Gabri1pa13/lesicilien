import { canAccess, requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "dashboard");
  if (error) return error;
  const { supabase, profile } = auth;
  const items = [];

  const today = new Date().toISOString().slice(0, 10);
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  if (canAccess(profile, "tasks")) {
    let query = supabase.from("tasks").select("id, title, due_date").neq("status", "fatto").lt("due_date", today).not("due_date", "is", null);
    if (profile.role === "cleaning") query = query.eq("assigned_to", profile.id);
    const { data } = await query.limit(5);
    (data || []).forEach(t => items.push({
      id: `task-${t.id}`, type: "task", urgency: "critical",
      title: `Task in ritardo: ${t.title}`, subtitle: `Scadeva il ${new Date(t.due_date).toLocaleDateString("it-IT")}`,
      href: "/admin/crm/task",
    }));
  }

  if (canAccess(profile, "owners")) {
    const { data } = await supabase
      .from("owners").select("id, name, next_follow_up")
      .not("stage", "in", "(attivo,perso)").not("next_follow_up", "is", null).lte("next_follow_up", today)
      .order("next_follow_up", { ascending: true }).limit(5);
    (data || []).forEach(o => items.push({
      id: `owner-${o.id}`, type: "owner", urgency: o.next_follow_up < today ? "critical" : "warning",
      title: `Da ricontattare: ${o.name}`,
      subtitle: o.next_follow_up < today ? `Follow-up previsto il ${new Date(o.next_follow_up).toLocaleDateString("it-IT")}` : "Follow-up previsto oggi",
      href: "/admin/crm/proprietari",
    }));
  }

  if (canAccess(profile, "bookings")) {
    const { data } = await supabase
      .from("bookings").select("id, guest_name, check_in, properties:property_id(name)")
      .eq("status", "confermata").gte("check_in", today).lte("check_in", in3)
      .order("check_in", { ascending: true }).limit(5);
    (data || []).forEach(b => items.push({
      id: `booking-${b.id}`, type: "booking", urgency: "info",
      title: `Check-in in arrivo: ${b.properties?.name || ""}`,
      subtitle: `${b.guest_name || "Ospite"} · ${new Date(b.check_in).toLocaleDateString("it-IT")}`,
      href: "/admin/crm/prenotazioni",
    }));
  }

  if (canAccess(profile, "payouts")) {
    const { data } = await supabase.from("payouts").select("id, owner_id, net_payout, owners:owner_id(name)").eq("status", "inviato").limit(5);
    (data || []).forEach(p => items.push({
      id: `payout-${p.id}`, type: "payout", urgency: "warning",
      title: `Payout in attesa: ${p.owners?.name || ""}`,
      subtitle: `${Number(p.net_payout).toLocaleString("it-IT", { style: "currency", currency: "EUR" })} da confermare`,
      href: "/admin/crm/contabilita",
    }));
  }

  return Response.json({ ok: true, data: items });
}
