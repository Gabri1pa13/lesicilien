import { requireAccess } from "../../../../lib/crmAuth";

function generatePassword() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(36))
    .join("")
    .slice(0, 14) + "!A1";
}

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "team");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase.from("profiles").select("*").order("created_at", { ascending: true });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

// Crea un nuovo membro del team: account Supabase + profilo con ruolo.
// Ritorna una password temporanea generata, da comunicare manualmente al collaboratore.
export async function POST(request) {
  const { auth, error } = await requireAccess(request, "team");
  if (error) return error;
  const body = await request.json();
  if (!body.email || !body.full_name || !body.role) {
    return Response.json({ ok: false, error: "Email, nome e ruolo sono obbligatori" }, { status: 400 });
  }
  const password = generatePassword();
  const { data: created, error: createErr } = await auth.supabase.auth.admin.createUser({
    email: body.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name, role: body.role },
  });
  if (createErr) return Response.json({ ok: false, error: createErr.message }, { status: 500 });

  // Il trigger on_auth_user_created crea già il profilo; aggiorniamo comunque per sicurezza.
  const { data: profile, error: profErr } = await auth.supabase
    .from("profiles")
    .upsert({ id: created.user.id, email: body.email, full_name: body.full_name, role: body.role, active: true })
    .select().single();
  if (profErr) return Response.json({ ok: false, error: profErr.message }, { status: 500 });

  return Response.json({ ok: true, data: { ...profile, temp_password: password } });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "team");
  if (error) return error;
  const { id, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  const { data, error: dbErr } = await auth.supabase.from("profiles").update(rest).eq("id", id).select().single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}
