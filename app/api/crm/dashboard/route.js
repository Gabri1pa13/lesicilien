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
    const STAGES = ["lead", "contattato", "in_trattativa", "contratto_inviato", "attivo", "in_pausa", "perso"];
    out.owners = {
      total: data?.length || 0,
      inPipeline: data?.filter(o => !["attivo", "perso"].includes(o.stage)).length || 0,
      active: data?.filter(o => o.stage === "attivo").length || 0,
      byStage: STAGES.map(stage => ({ stage, count: data?.filter(o => o.stage === stage).length || 0 })),
    };
  }

  if (canAccess(profile, "bookings")) {
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
    const { data: monthBookings } = await supabase
      .from("bookings").select("total_amount, status")
      .neq("status", "cancellata").gte("check_in", monthStart).lte("check_in", monthEnd);
    const { data: upcoming } = await supabase
      .from("bookings").select("id, check_in, guest_name, properties:property_id(name)")
      .eq("status", "confermata").gte("check_in", today).lte("check_in", in7)
      .order("check_in", { ascending: true });
    const { data: trendRows } = await supabase
      .from("bookings").select("total_amount, check_in, channel, status, properties:property_id(name)")
      .neq("status", "cancellata").gte("check_in", sixMonthsAgo).lte("check_in", monthEnd);

    const monthKeys = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("it-IT", { month: "short" }) };
    });
    const revenueTrend = monthKeys.map(({ key, label }) => ({
      month: label,
      revenue: (trendRows || []).filter(b => b.check_in?.slice(0, 7) === key).reduce((s, b) => s + Number(b.total_amount || 0), 0),
    }));

    const channelOrder = ["diretta", "airbnb", "booking", "vrbo", "altro"];
    const channelMix = channelOrder
      .map(channel => ({ channel, count: (trendRows || []).filter(b => b.channel === channel).length }))
      .filter(c => c.count > 0);

    const byProperty = {};
    (trendRows || []).forEach(b => {
      const name = b.properties?.name || "Altro";
      byProperty[name] = (byProperty[name] || 0) + Number(b.total_amount || 0);
    });
    const topProperties = Object.entries(byProperty).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    out.bookings = {
      countThisMonth: monthBookings?.length || 0,
      revenueThisMonth: (monthBookings || []).reduce((s, b) => s + Number(b.total_amount || 0), 0),
      upcomingCheckins: upcoming || [],
      revenueTrend, channelMix, topProperties,
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
