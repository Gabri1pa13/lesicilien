import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const { id } = await req.json();
    const { error } = await supabase
      .from("requests")
      .update({ status: "paid" })
      .eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Errore mark-paid:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
