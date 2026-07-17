import { requireAccess } from "../../../../../lib/crmAuth";

// Elenco leggero dei proprietari (id, nome, stage, commissione), usato per i menu a tendina
// nelle pagine Immobili/Contabilità anche da ruoli che non hanno accesso pieno a "owners".
export async function GET(request) {
  const { auth, error } = await requireAccess(request, ["owners", "properties", "payouts"]);
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("owners")
    .select("id, name, stage, commission_pct")
    .order("name", { ascending: true });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}
