import { requireAccess } from "../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("owners")
    .select("*")
    .order("created_at", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const body = await request.json();
  const { data, error: dbErr } = await auth.supabase
    .from("owners")
    .insert({
      name: body.name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source || null,
      stage: body.stage || "lead",
      commission_pct: body.commission_pct ?? 20,
      notes: body.notes || null,
      assigned_to: body.assigned_to || auth.profile.id,
      created_by: auth.profile.id,
    })
    .select()
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });

  if (rest.stage) {
    await auth.supabase.from("owner_activities").insert({
      owner_id: id, type: "stage_change",
      content: `Fase aggiornata a "${rest.stage}"`,
      created_by: auth.profile.id,
    });
  }

  const { data, error: dbErr } = await auth.supabase
    .from("owners").update(rest).eq("id", id).select().single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  if (auth.profile.role === "sales") {
    return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
  }
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("owners").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
