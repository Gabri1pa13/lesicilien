import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// Risorse visibili/gestibili per ciascun ruolo del team.
export const ROLE_ACCESS = {
  admin:      ["dashboard", "owners", "properties", "bookings", "guests", "tasks", "expenses", "payouts", "team"],
  manager:    ["dashboard", "owners", "properties", "bookings", "guests", "tasks", "expenses"],
  sales:      ["dashboard", "owners", "guests"],
  accountant: ["dashboard", "properties", "bookings", "expenses", "payouts"],
  cleaning:   ["tasks"],
};

export function canAccess(profile, resource) {
  if (!profile || !profile.active) return false;
  return (ROLE_ACCESS[profile.role] || []).includes(resource);
}

// Estrae l'utente + profilo dal token Bearer inviato dal client.
export async function getAuthedProfile(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.active === false) return null;

  return { user, profile, supabase };
}

// Da usare all'inizio di ogni handler API del CRM.
// `resource` può essere una stringa o un array: basta l'accesso a una delle risorse elencate.
// Ritorna { auth } se autorizzato, altrimenti { error: Response } da restituire subito.
export async function requireAccess(request, resource) {
  const auth = await getAuthedProfile(request);
  if (!auth) {
    return { error: Response.json({ ok: false, error: "Non autenticato" }, { status: 401 }) };
  }
  const resources = Array.isArray(resource) ? resource : [resource];
  if (!resources.some(r => canAccess(auth.profile, r))) {
    return { error: Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 }) };
  }
  return { auth };
}
