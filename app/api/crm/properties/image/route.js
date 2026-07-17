import { requireAccess } from "../../../../../lib/crmAuth";

const BUCKET = "property-images";

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "properties");
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ ok: false, error: "File mancante" }, { status: 400 });

  const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: upErr } = await auth.supabase.storage.from(BUCKET).upload(fileName, bytes, { contentType: file.type, upsert: true });
  if (upErr) return Response.json({ ok: false, error: upErr.message }, { status: 500 });

  const { data: { publicUrl } } = auth.supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return Response.json({ ok: true, url: publicUrl });
}
