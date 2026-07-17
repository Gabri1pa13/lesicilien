import { requireAccess } from "../../../../../lib/crmAuth";

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const ownerId = new URL(request.url).searchParams.get("owner_id");
  if (!ownerId) return Response.json({ ok: false, error: "owner_id mancante" }, { status: 400 });

  const { data, error: dbErr } = await auth.supabase
    .from("owner_activities")
    .select("*, profiles:created_by(full_name)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const body = await request.json();
  if (!body.owner_id || !body.content) {
    return Response.json({ ok: false, error: "owner_id e content sono obbligatori" }, { status: 400 });
  }
  const { data, error: dbErr } = await auth.supabase
    .from("owner_activities")
    .insert({
      owner_id: body.owner_id,
      type: body.type || "note",
      content: body.content,
      created_by: auth.profile.id,
    })
    .select("*, profiles:created_by(full_name)")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}
