// /app/api/send-request/route.js
// Riceve la richiesta dell'ospite → salva su Supabase → notifica admin via email

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "info@costanzoacquisizioni.it";
const GOLD = "#BFA05A";
const DARK = "#1A1814";
const CREAM = "#FAF8F3";

export async function POST(req) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { service, form } = body;

  // 1. Salva su Supabase — priorità massima, errore bloccante
  const { error: dbError } = await supabase.from("requests").insert([{
    service_id:       service.id,
    service_name:     service.name,
    service_price:    service.price,
    nome:             form.nome,
    email:            form.email,
    telefono:         form.telefono || null,
    data_desiderata:  form.data || null,
    persone:          parseInt(form.persone) || 1,
    note:             form.note || null,
    status:           "pending",
  }]);

  if (dbError) {
    console.error("Errore insert Supabase:", dbError);
    return Response.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  // 2. Email notifica all'admin — errore non bloccante, il record è già salvato
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `Le Sicilien System <noreply@lesicilien.it>`,
      to: ADMIN_EMAIL,
      subject: `🛎 Nuova richiesta — ${service.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:${CREAM};border:1px solid #E0D9CC;">
          <div style="background:${DARK};padding:24px 28px;">
            <p style="font-size:9px;letter-spacing:.25em;color:${GOLD};text-transform:uppercase;margin:0 0 4px;">Nuova richiesta concierge</p>
            <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#fff;margin:0;">${service.name}</h2>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%;border-collapse:collapse;">
              ${[
                ["Prezzo", service.price],
                ["Nome", form.nome],
                ["Email", `<a href="mailto:${form.email}" style="color:${GOLD}">${form.email}</a>`],
                ["Telefono", form.telefono || "—"],
                ["Data", form.data || "—"],
                ["Persone", form.persone],
                ["Note", form.note || "—"],
              ].map(([k, v]) => `
                <tr>
                  <td style="padding:9px 0;font-size:9px;letter-spacing:.1em;color:#8A8278;text-transform:uppercase;width:100px;border-bottom:1px solid #E0D9CC;">${k}</td>
                  <td style="padding:9px 0;font-size:13px;color:${DARK};border-bottom:1px solid #E0D9CC;">${v}</td>
                </tr>`).join("")}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lesicilien.it"}/admin/richieste"
                 style="display:inline-block;background:${DARK};color:${GOLD};padding:12px 28px;font-size:11px;letter-spacing:.15em;text-decoration:none;text-transform:uppercase;font-weight:600;">
                → Pannello admin
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Errore email admin (record già salvato):", emailError);
  }

  return Response.json({ ok: true });
}
