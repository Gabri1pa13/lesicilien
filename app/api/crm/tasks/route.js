import { requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "tasks");
  if (error) return error;
  let query = auth.supabase
    .from("tasks")
    .select("*, properties:property_id(name), assignee:assigned_to(full_name)")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (auth.profile.role === "cleaning") query = query.eq("assigned_to", auth.profile.id);
  const { data, error: dbErr } = await query;
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "tasks");
  if (error) return error;
  if (auth.profile.role === "cleaning") {
    return Response.json({ ok: false, error: "Non autorizzato a creare task" }, { status: 403 });
  }
  const body = await request.json();
  if (!body.title) return Response.json({ ok: false, error: "Il titolo è obbligatorio" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase
    .from("tasks")
    .insert({
      property_id: body.property_id || null,
      booking_id: body.booking_id || null,
      type: body.type || "pulizia",
      title: body.title,
      description: body.description || null,
      due_date: body.due_date || null,
      assigned_to: body.assigned_to || null,
      status: body.status || "da_fare",
      created_by: auth.profile.id,
    })
    .select("*, properties:property_id(name), assignee:assigned_to(full_name)")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "tasks");
  if (error) return error;
  const { id, properties, assignee, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });

  let updates = rest;
  if (auth.profile.role === "cleaning") {
    const { data: existing } = await auth.supabase.from("tasks").select("assigned_to").eq("id", id).single();
    if (!existing || existing.assigned_to !== auth.profile.id) {
      return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
    }
    updates = { status: rest.status }; // il personale pulizie può solo aggiornare lo stato
  }

  const { data, error: dbErr } = await auth.supabase
    .from("tasks").update(updates).eq("id", id)
    .select("*, properties:property_id(name), assignee:assigned_to(full_name)").single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "tasks");
  if (error) return error;
  if (auth.profile.role === "cleaning") {
    return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
  }
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("tasks").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
