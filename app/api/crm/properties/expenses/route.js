import { requireAccess } from "../../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "expenses");
  if (error) return error;
  const propertyId = new URL(request.url).searchParams.get("property_id");
  let query = auth.supabase.from("expenses").select("*").order("expense_date", { ascending: false });
  if (propertyId) query = query.eq("property_id", propertyId);
  const { data, error: dbErr } = await query;
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "expenses");
  if (error) return error;
  const body = await request.json();
  if (!body.property_id || !body.amount) {
    return Response.json({ ok: false, error: "property_id e amount sono obbligatori" }, { status: 400 });
  }
  const { data, error: dbErr } = await auth.supabase
    .from("expenses")
    .insert({
      property_id: body.property_id,
      category: body.category || "altro",
      amount: body.amount,
      expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
      description: body.description || null,
      created_by: auth.profile.id,
    })
    .select().single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "expenses");
  if (error) return error;
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("expenses").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
