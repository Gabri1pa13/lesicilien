import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
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
