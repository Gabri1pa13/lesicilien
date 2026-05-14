export async function GET() {
  const vars = {
    SUPABASE_URL:              !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY:      !!process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_ANON_KEY:         !!process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    RESEND_API_KEY:            !!process.env.RESEND_API_KEY,
    supabase_url_value_start:  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").slice(0, 20) || "MISSING",
  };
  return Response.json(vars);
}
