import { NextResponse } from "next/server";

// La sessione Supabase di questa app vive nel localStorage del browser, non nei cookie:
// un client creato qui (lato server) non ha mai accesso a quella sessione, quindi un
// controllo con supabase.auth.getSession() fallirebbe sempre e rimanderebbe ogni
// richiesta a /admin/login, incluse quelle di utenti già autenticati. La verifica della
// sessione va fatta lato client, in ogni pagina protetta (vedi CrmAuthGuard per /admin/crm
// e il controllo equivalente in /admin/richieste).
export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
