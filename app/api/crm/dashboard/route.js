import { canAccess, requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "dashboard");
  if (error) return error;
  const { supabase, profile } = auth;
  const out = {};

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  if (canAccess(profile, "properties")) {
    const { data } = await supabase.from("properties").select("status");
    out.properties = {
      total: data?.length || 0,
      active: data?.filter(p => p.status === "active").length || 0,
      onboarding: data?.filter(p => p.status === "onboarding").length || 0,
    };
  }

  if (canAccess(profile, "owners")) {
    const { data } = await supabase.from("owners").select("stage");
    out.owners = {
      total: data?.length || 0,
      inPipeline: data?.filter(o => !["attivo", "perso"].includes(o.stage)).length || 0,
      active: data?.filter(o => o.stage === "attivo").length || 0,
    };
  }

  if (canAccess(profile, "bookings")) {
    const { data: monthBookings } = await supabase
      .from("bookings").select("total_amount, status")
      .neq("status", "cancellata").gte("check_in", monthStart).lte("check_in", monthEnd);
    const { data: upcoming } = await supabase
      .from("bookings").select("id, check_in, guest_name, properties:property_id(name)")
      .eq("status", "confermata").gte("check_in", today).lte("check_in", in7)
      .order("check_in", { ascending: true });
    out.bookings = {
      countThisMonth: monthBookings?.length || 0,
      revenueThisMonth: (monthBookings || []).reduce((s, b) => s + Number(b.total_amount || 0), 0),
      upcomingCheckins: upcoming || [],
    };
  }

  if (canAccess(profile, "tasks")) {
    let query = supabase.from("tasks").select("status").neq("status", "fatto");
    if (profile.role === "cleaning") query = query.eq("assigned_to", profile.id);
    const { data } = await query;
    out.tasks = { open: data?.length || 0 };
  }

  if (canAccess(profile, "payouts")) {
    const { data } = await supabase.from("payouts").select("net_payout, status").neq("status", "pagato");
    out.payouts = { pendingAmount: (data || []).reduce((s, p) => s + Number(p.net_payout || 0), 0), pendingCount: data?.length || 0 };
  }

  return Response.json({ ok: true, data: out });
}
