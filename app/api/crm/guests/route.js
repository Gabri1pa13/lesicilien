import { requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "guests");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("guests")
    .select("*, bookings(id, property_id, check_in, check_out, total_amount, status, properties:property_id(name))")
    .order("created_at", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "guests");
  if (error) return error;
  const body = await request.json();
  if (!body.name) return Response.json({ ok: false, error: "Il nome è obbligatorio" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase
    .from("guests")
    .insert({
      name: body.name, email: body.email || null, phone: body.phone || null,
      nationality: body.nationality || null, tags: body.tags || null,
      notes: body.notes || null, marketing_opt_in: !!body.marketing_opt_in,
    })
    .select().single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "guests");
  if (error) return error;
  const { id, bookings, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase.from("guests").update(rest).eq("id", id).select().single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "guests");
  if (error) return error;
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("guests").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
