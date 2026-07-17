import { requireAccess } from "../../../../lib/crmAuth";

async function upsertGuest(supabase, { guest_name, guest_email, guest_phone }) {
  if (!guest_email) return null;
  const { data: existing } = await supabase.from("guests").select("id").eq("email", guest_email).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("guests")
    .insert({ name: guest_name || guest_email, email: guest_email, phone: guest_phone || null })
    .select("id").single();
  return created?.id || null;
}

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("bookings")
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))")
    .order("check_in", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const body = await request.json();
  if (!body.property_id || !body.check_in || !body.check_out) {
    return Response.json({ ok: false, error: "Immobile, check-in e check-out sono obbligatori" }, { status: 400 });
  }
  const guest_id = await upsertGuest(auth.supabase, body);
  const { data, error: dbErr } = await auth.supabase
    .from("bookings")
    .insert({
      property_id: body.property_id,
      guest_id,
      guest_name: body.guest_name || null,
      guest_email: body.guest_email || null,
      guest_phone: body.guest_phone || null,
      channel: body.channel || "diretta",
      check_in: body.check_in,
      check_out: body.check_out,
      guests_count: body.guests_count || 1,
      total_amount: body.total_amount || 0,
      commission_pct: body.commission_pct || null,
      status: body.status || "confermata",
      notes: body.notes || null,
      created_by: auth.profile.id,
    })
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { id, properties, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  if (rest.guest_email !== undefined) {
    rest.guest_id = await upsertGuest(auth.supabase, rest);
  }
  const { data, error: dbErr } = await auth.supabase
    .from("bookings").update(rest).eq("id", id)
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))").single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("bookings").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
