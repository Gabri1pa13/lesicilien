import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TRANSLATE_TARGETS = { en: "en", fr: "fr", de: "de", pl: "pl", zh: "zh-CN" };

async function translateTo(text, lang) {
  if (!text?.trim()) return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    return j?.[0]?.map(c => c?.[0] ?? "").join("") || null;
  } catch { return null; }
}

async function autoTranslate(supabase, id, text) {
  const results = await Promise.allSettled(
    Object.entries(TRANSLATE_TARGETS).map(async ([col, lang]) => ({
      col, text: await translateTo(text, lang),
    }))
  );
  const updates = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.text) updates[`description_${r.value.col}`] = r.value.text;
  }
  if (Object.keys(updates).length) await supabase.from("services").update(updates).eq("id", id);
}

export async function GET() {
  const { data, error } = await getSupabase()
    .from("services")
    .select("*")
    .order("category")
    .order("sort_order");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(req) {
  const body = await req.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from("services").insert([body]).select().single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (body.description) await autoTranslate(supabase, data.id, body.description);
  return Response.json({ ok: true, data });
}

export async function PUT(req) {
  const { id, ...updates } = await req.json();
  const supabase = getSupabase();
  const { data, error } = await supabase.from("services").update(updates).eq("id", id).select().single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (updates.description) await autoTranslate(supabase, id, updates.description);
  return Response.json({ ok: true, data });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await getSupabase().from("services").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
