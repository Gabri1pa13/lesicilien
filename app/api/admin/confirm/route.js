// /app/api/admin/confirm/route.js
// Chiamata dal pannello admin quando si conferma una richiesta:
// 1. Aggiorna status su Supabase → "confirmed" + salva revolut_link
// 2. Invia email branded al cliente con link Revolut per il pagamento

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend  = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const GOLD  = "#BFA05A";
const DARK  = "#1A1814";
const CREAM = "#FAF8F3";

export async function POST(req) {
  try {
    const { requestId, email, nome, serviceName, servicePrice, dataDesiderata, persone, revolutLink, messageExtra } = await req.json();

    // 1. Aggiorna Supabase
    await supabase
      .from("requests")
      .update({ status: "confirmed", revolut_link: revolutLink })
      .eq("id", requestId);

    // 2. Email al cliente
    await resend.emails.send({
      from: "Le Sicilien Concierge <concierge@lesicilien.it>",
      to: email,
      subject: `✓ Disponibilità confermata — ${serviceName}`,
      html: buildConfirmEmail({ nome, serviceName, servicePrice, dataDesiderata, persone, revolutLink, messageExtra }),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Errore confirm:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

function buildConfirmEmail({ nome, serviceName, servicePrice, dataDesiderata, persone, revolutLink, messageExtra }) {
  const firstName = nome.split(" ")[0];
  const rows = [
    ["Servizio", serviceName],
    ["Importo", servicePrice],
    ...(dataDesiderata ? [["Data", dataDesiderata]] : []),
    ...(persone        ? [["Persone", `${persone}`]] : []),
  ];

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE6;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:${DARK};padding:36px 40px 28px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;color:${GOLD};text-transform:uppercase;margin:0 0 12px;">Le Sicilien · Concierge</p>
        <div style="width:40px;height:1px;background:${GOLD};margin:0 auto;"></div>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:${CREAM};padding:40px 40px 32px;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:${GOLD};text-transform:uppercase;margin:0 0 16px;">DISPONIBILITÀ CONFERMATA</p>
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:${DARK};margin:0 0 20px;line-height:1.2;">
          Gentile ${firstName},<br/><em style="font-style:italic;">la sua richiesta è confermata.</em>
        </h1>
        <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 28px;">
          Siamo lieti di confermare la disponibilità per il servizio richiesto. Di seguito il riepilogo e il link per completare il pagamento.
        </p>

        <!-- DETTAGLI -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0D9CC;margin-bottom:28px;">
          <tr><td colspan="2" style="background:${DARK};padding:10px 16px;">
            <p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:.22em;color:${GOLD};text-transform:uppercase;margin:0;">Dettagli del servizio</p>
          </td></tr>
          ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:11px 16px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:.1em;color:#8A8278;text-transform:uppercase;width:38%;border-bottom:1px solid #E0D9CC;">${k}</td>
            <td style="padding:11px 16px;font-family:Georgia,serif;font-size:15px;color:${DARK};border-bottom:1px solid #E0D9CC;">${v}</td>
          </tr>`).join("")}
        </table>

        ${messageExtra ? `
        <!-- MESSAGGIO PERSONALIZZATO -->
        <div style="border-left:2px solid ${GOLD};padding:14px 18px;background:#fff;margin-bottom:28px;">
          <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.12em;color:${GOLD};text-transform:uppercase;margin:0 0 8px;">Nota del nostro team</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.8;margin:0;">${messageExtra}</p>
        </div>` : ""}

        <!-- CTA PAGAMENTO -->
        <div style="text-align:center;margin:32px 0;">
          <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:300;color:#8A8278;margin:0 0 20px;">
            Per completare la prenotazione, effettui il pagamento tramite il link sicuro qui sotto.<br/>
            Il servizio sarà definitivamente confermato al ricevimento del pagamento.
          </p>
          <a href="${revolutLink}"
             style="display:inline-block;background:${DARK};color:${GOLD};padding:16px 40px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.18em;text-decoration:none;text-transform:uppercase;">
            → Completa il pagamento
          </a>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#B0A898;margin:12px 0 0;">
            Pagamento sicuro tramite Revolut
          </p>
        </div>

        <div style="height:1px;background:#E0D9CC;margin:28px 0;"></div>
        <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:300;color:#8A8278;line-height:1.8;margin:0;">
          Per qualsiasi domanda, il nostro team è disponibile 24/7 su WhatsApp o via email.
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:${DARK};padding:28px 40px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:.22em;color:rgba(191,160,90,.6);text-transform:uppercase;margin:0 0 10px;">Le Sicilien · Luxury Real Estate · Palermo, Sicilia</p>
        <a href="https://wa.me/393888005083" style="font-family:Arial,sans-serif;font-size:11px;color:${GOLD};text-decoration:none;letter-spacing:.1em;">💬 WhatsApp Concierge</a>
        <p style="font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,.2);margin:12px 0 0;">© 2025 Le Sicilien</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
