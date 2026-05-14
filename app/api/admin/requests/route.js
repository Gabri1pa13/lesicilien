import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  try {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("Errore fetch requests:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
