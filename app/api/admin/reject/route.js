// /app/api/admin/reject/route.js
// Chiamata dal pannello admin quando si rifiuta una richiesta:
// 1. Aggiorna status su Supabase → "rejected"
// 2. Invia email cortese al cliente

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const GOLD  = "#BFA05A";
const DARK  = "#1A1814";
const CREAM = "#FAF8F3";

export async function POST(req) {
  const resend   = new Resend(process.env.RESEND_API_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  try {
    const { requestId, email, nome, serviceName, dataDesiderata, messageExtra } = await req.json();

    await supabase.from("requests").update({ status: "rejected" }).eq("id", requestId);

    await resend.emails.send({
      from: "Le Sicilien Concierge <concierge@lesicilien.it>",
      to: email,
      subject: `Le Sicilien — Aggiornamento sulla sua richiesta`,
      html: buildRejectEmail({ nome, serviceName, dataDesiderata, messageExtra }),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Errore reject:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

function buildRejectEmail({ nome, serviceName, dataDesiderata, messageExtra }) {
  const firstName = nome.split(" ")[0];
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE6;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${DARK};padding:36px 40px 28px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;color:${GOLD};text-transform:uppercase;margin:0 0 12px;">Le Sicilien · Concierge</p>
        <div style="width:40px;height:1px;background:${GOLD};margin:0 auto;"></div>
      </td></tr>
      <tr><td style="background:${CREAM};padding:40px 40px 32px;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#8A8278;text-transform:uppercase;margin:0 0 16px;">AGGIORNAMENTO RICHIESTA</p>
        <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:${DARK};margin:0 0 20px;line-height:1.3;">Gentile ${firstName},</h1>
        <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 20px;">
          La ringraziamo per aver contattato il nostro concierge.
          Siamo spiacenti di informarla che per il servizio
          <strong style="color:${DARK};">${serviceName}</strong>${dataDesiderata ? ` nella data del ${dataDesiderata}` : ""}
          non siamo in grado di garantire la disponibilità richiesta.
        </p>
        ${messageExtra ? `
        <div style="border-left:2px solid #E0D9CC;padding:14px 18px;background:#fff;margin-bottom:24px;">
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.8;margin:0;">${messageExtra}</p>
        </div>` : ""}
        <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 28px;">
          Vi invitiamo a contattarci direttamente su WhatsApp — saremo felici di trovare insieme una soluzione alternativa.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://wa.me/393273751480"
             style="display:inline-block;background:${DARK};color:${GOLD};padding:14px 36px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-decoration:none;text-transform:uppercase;">
            💬 Scrivici su WhatsApp
          </a>
        </div>
        <div style="height:1px;background:#E0D9CC;margin:28px 0;"></div>
        <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:300;color:#8A8278;line-height:1.8;margin:0;">
          Ci scusiamo per l'inconveniente e speriamo di poterla accogliere presto tra i nostri ospiti.
        </p>
      </td></tr>
      <tr><td style="background:${DARK};padding:28px 40px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:.22em;color:rgba(191,160,90,.6);text-transform:uppercase;margin:0 0 10px;">Le Sicilien · Luxury Real Estate · Palermo, Sicilia</p>
        <p style="font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,.2);margin:8px 0 0;">© 2025 Le Sicilien</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
