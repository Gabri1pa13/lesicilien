import { requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "payouts");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("payouts")
    .select("*, owners:owner_id(name, commission_pct)")
    .order("period_end", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

// Calcola e crea un rendiconto per un proprietario in un dato periodo,
// sommando le prenotazioni (ricavi/commissioni) e le spese degli immobili collegati.
export async function POST(request) {
  const { auth, error } = await requireAccess(request, "payouts");
  if (error) return error;
  const body = await request.json();
  const { owner_id, period_start, period_end } = body;
  if (!owner_id || !period_start || !period_end) {
    return Response.json({ ok: false, error: "owner_id, period_start e period_end sono obbligatori" }, { status: 400 });
  }

  const { data: owner } = await auth.supabase.from("owners").select("commission_pct").eq("id", owner_id).single();
  const { data: properties } = await auth.supabase.from("properties").select("id, commission_pct").eq("owner_id", owner_id);
  const propertyIds = (properties || []).map(p => p.id);
  const commissionByProperty = Object.fromEntries((properties || []).map(p => [p.id, p.commission_pct]));

  let grossRevenue = 0;
  let commissionAmount = 0;
  if (propertyIds.length > 0) {
    const { data: bookings } = await auth.supabase
      .from("bookings")
      .select("property_id, total_amount, commission_pct, status")
      .in("property_id", propertyIds)
      .neq("status", "cancellata")
      .gte("check_in", period_start)
      .lte("check_in", period_end);
    for (const b of bookings || []) {
      const amount = Number(b.total_amount) || 0;
      const pct = b.commission_pct ?? commissionByProperty[b.property_id] ?? owner?.commission_pct ?? 20;
      grossRevenue += amount;
      commissionAmount += (amount * pct) / 100;
    }
  }

  let expensesAmount = 0;
  if (propertyIds.length > 0) {
    const { data: expenses } = await auth.supabase
      .from("expenses").select("amount")
      .in("property_id", propertyIds)
      .gte("expense_date", period_start)
      .lte("expense_date", period_end);
    expensesAmount = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
  }

  const netPayout = grossRevenue - commissionAmount - expensesAmount;

  const { data, error: dbErr } = await auth.supabase
    .from("payouts")
    .insert({
      owner_id, period_start, period_end,
      gross_revenue: grossRevenue, commission_amount: commissionAmount,
      expenses_amount: expensesAmount, net_payout: netPayout,
      status: "bozza", notes: body.notes || null, created_by: auth.profile.id,
    })
    .select("*, owners:owner_id(name, commission_pct)")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "payouts");
  if (error) return error;
  const { id, owners, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase
    .from("payouts").update(rest).eq("id", id)
    .select("*, owners:owner_id(name, commission_pct)").single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "payouts");
  if (error) return error;
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("payouts").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
