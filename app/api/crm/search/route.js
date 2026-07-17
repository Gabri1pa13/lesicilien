import { canAccess, requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "dashboard");
  if (error) return error;
  const { supabase, profile } = auth;
  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return Response.json({ ok: true, data: [] });

  const results = [];
  const like = `%${q}%`;

  if (canAccess(profile, "owners")) {
    const { data } = await supabase.from("owners").select("id, name, company, stage").or(`name.ilike.${like},company.ilike.${like}`).limit(6);
    (data || []).forEach(o => results.push({ type: "owner", id: o.id, label: o.name, sublabel: o.company || "Proprietario", href: "/admin/crm/proprietari" }));
  }
  if (canAccess(profile, "properties")) {
    const { data } = await supabase.from("properties").select("id, name, city").ilike("name", like).limit(6);
    (data || []).forEach(p => results.push({ type: "property", id: p.id, label: p.name, sublabel: p.city || "Immobile", href: "/admin/crm/immobili" }));
  }
  if (canAccess(profile, "guests")) {
    const { data } = await supabase.from("guests").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(6);
    (data || []).forEach(g => results.push({ type: "guest", id: g.id, label: g.name, sublabel: g.email || "Ospite", href: "/admin/crm/ospiti" }));
  }
  if (canAccess(profile, "bookings")) {
    const { data } = await supabase.from("bookings").select("id, guest_name, check_in, properties:property_id(name)").ilike("guest_name", like).limit(6);
    (data || []).forEach(b => results.push({ type: "booking", id: b.id, label: b.guest_name || "Prenotazione", sublabel: b.properties?.name || "", href: "/admin/crm/prenotazioni" }));
  }

  return Response.json({ ok: true, data: results });
}
