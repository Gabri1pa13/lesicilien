import { requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "properties");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("properties")
    .select("*, owners:owner_id(id, name, commission_pct)")
    .order("created_at", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "properties");
  if (error) return error;
  const body = await request.json();
  if (!body.name) return Response.json({ ok: false, error: "Il nome è obbligatorio" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase
    .from("properties")
    .insert({
      owner_id: body.owner_id || null,
      name: body.name,
      address: body.address || null,
      city: body.city || "Palermo",
      type: body.type || "villa",
      bedrooms: body.bedrooms || null,
      bathrooms: body.bathrooms || null,
      max_guests: body.max_guests || null,
      base_price: body.base_price || null,
      cleaning_fee: body.cleaning_fee || null,
      commission_pct: body.commission_pct || null,
      status: body.status || "onboarding",
      photo_url: body.photo_url || null,
      notes: body.notes || null,
    })
    .select("*, owners:owner_id(id, name, commission_pct)")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "properties");
  if (error) return error;
  const { id, owners, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase
    .from("properties").update(rest).eq("id", id)
    .select("*, owners:owner_id(id, name, commission_pct)").single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "properties");
  if (error) return error;
  if (auth.profile.role === "accountant") {
    return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
  }
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("properties").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
