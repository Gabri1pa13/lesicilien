import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Lascia passare la pagina di login
  if (pathname === "/admin/login") return NextResponse.next();

  // Per tutte le altre rotte /admin/* controlla la sessione
  if (pathname.startsWith("/admin")) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { cookie: request.headers.get("cookie") || "" },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
