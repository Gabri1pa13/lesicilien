import { Resend } from "resend";
import { requireAccess } from "../../../../../lib/crmAuth";

const GOLD = "#BFA05A", DARK = "#1A1814", CREAM = "#FAF8F3";

function buildEmail({ subject, bodyText, senderName }) {
  const paragraphs = bodyText.split("\n").filter(Boolean).map(p => `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 16px;">${p}</p>`).join("");
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE6;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${DARK};padding:36px 40px 28px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;color:${GOLD};text-transform:uppercase;margin:0 0 12px;">Le Sicilien</p>
        <div style="width:40px;height:1px;background:${GOLD};margin:0 auto;"></div>
      </td></tr>
      <tr><td style="background:${CREAM};padding:40px;">
        <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:${DARK};margin:0 0 20px;line-height:1.3;">${subject}</h1>
        ${paragraphs}
        <div style="height:1px;background:#E0D9CC;margin:24px 0;"></div>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A8278;margin:0;">${senderName || "Il team Le Sicilien"}</p>
      </td></tr>
      <tr><td style="background:${DARK};padding:24px 40px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:.22em;color:rgba(191,160,90,.6);text-transform:uppercase;margin:0;">Le Sicilien · Palermo, Sicilia</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "owners");
  if (error) return error;
  const { owner_id, subject, body: bodyText } = await request.json();
  if (!owner_id || !subject?.trim() || !bodyText?.trim()) {
    return Response.json({ ok: false, error: "owner_id, subject e body sono obbligatori" }, { status: 400 });
  }

  const { data: owner } = await auth.supabase.from("owners").select("name, email").eq("id", owner_id).single();
  if (!owner?.email) return Response.json({ ok: false, error: "Il proprietario non ha un'email registrata" }, { status: 400 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Le Sicilien <concierge@lesicilien.it>",
      to: owner.email,
      subject,
      html: buildEmail({ subject, bodyText, senderName: auth.profile.full_name }),
    });
  } catch (sendErr) {
    return Response.json({ ok: false, error: "Invio email fallito: " + sendErr.message }, { status: 500 });
  }

  const { data: activity, error: dbErr } = await auth.supabase
    .from("owner_activities")
    .insert({ owner_id, type: "email", content: `Oggetto: ${subject}\n\n${bodyText}`, created_by: auth.profile.id })
    .select("*, profiles:created_by(full_name)")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });

  return Response.json({ ok: true, data: activity });
}
