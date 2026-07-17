import { getAuthedProfile, ROLE_ACCESS } from "../../../../lib/crmAuth";

export async function GET(request) {
  const auth = await getAuthedProfile(request);
  if (!auth) return Response.json({ ok: false, error: "Non autenticato" }, { status: 401 });
  const allowed = ROLE_ACCESS[auth.profile.role] || [];
  return Response.json({ ok: true, profile: auth.profile, allowed });
}
