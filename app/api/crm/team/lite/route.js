import { requireAccess } from "../../../../../lib/crmAuth";

// Elenco leggero del team (id, nome, ruolo), usato per assegnare task senza dare accesso
// completo alla gestione del team (che resta riservata al ruolo admin).
export async function GET(request) {
  const { auth, error } = await requireAccess(request, ["team", "tasks"]);
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("active", true)
    .order("full_name", { ascending: true });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}
