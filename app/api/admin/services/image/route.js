import { createClient } from "@supabase/supabase-js";

const BUCKET = "service-images";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ ok: false, error: "File mancante" }, { status: 400 });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, { contentType: file.type, upsert: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return Response.json({ ok: true, url: publicUrl });
}

export async function DELETE(req) {
  const { fileName } = await req.json();
  if (!fileName) return Response.json({ ok: false, error: "fileName mancante" }, { status: 400 });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  await supabase.storage.from(BUCKET).remove([fileName]);
  return Response.json({ ok: true });
}
