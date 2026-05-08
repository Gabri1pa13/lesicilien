import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
  const { data, error } = await getSupabase()
    .from("services")
    .insert([body])
    .select()
    .single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(req) {
  const { id, ...updates } = await req.json();
  const { data, error } = await getSupabase()
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const { error } = await getSupabase().from("services").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
