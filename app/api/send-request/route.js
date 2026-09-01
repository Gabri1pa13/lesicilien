// /app/api/send-request/route.js
// Riceve la richiesta dell'ospite → salva su Supabase → notifica admin via email

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "info@costanzoacquisizioni.it";
const GOLD = "#BFA05A";
const DARK = "#1A1814";
const CREAM = "#FAF8F3";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { nome: 120, email: 180, telefono: 40, data: 20, note: 2000 };
const RATE_LIMIT_WINDOW_MINUTES = 5;

// Escapes HTML-significant characters so guest input can't inject markup
// into the admin notification email.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

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

  const { service, form } = body || {};

  // Honeypot: a hidden field real visitors never fill in. Bots that fill
  // every field trip it — accept silently so they don't learn to skip it.
  if (form?.website) {
    return Response.json({ ok: true });
  }

  if (!service?.name || !form?.nome || !form?.email) {
    return Response.json({ ok: false, error: "Campi obbligatori mancanti." }, { status: 400 });
  }
  if (!EMAIL_RE.test(form.email)) {
    return Response.json({ ok: false, error: "Email non valida." }, { status: 400 });
  }
  for (const [field, max] of Object.entries(MAX_LEN)) {
    if (form[field] && String(form[field]).length > max) {
      return Response.json({ ok: false, error: `Campo "${field}" troppo lungo.` }, { status: 400 });
    }
  }
  const persone = parseInt(form.persone, 10) || 1;
  if (persone < 1 || persone > 50) {
    return Response.json({ ok: false, error: "Numero di persone non valido." }, { status: 400 });
  }

  // Basic anti-spam throttle: block rapid repeat submissions from the same email.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("email", form.email)
    .gte("created_at", since);
  if (recentCount && recentCount >= 3) {
    return Response.json({ ok: false, error: "Troppe richieste. Riprova tra qualche minuto." }, { status: 429 });
  }

  // 1. Salva su Supabase — priorità massima, errore bloccante
  const { error: dbError } = await supabase.from("requests").insert([{
    service_id:       service.id,
    service_name:     service.name,
    service_price:    service.price,
    nome:             form.nome,
    email:            form.email,
    telefono:         form.telefono || null,
    data_desiderata:  form.data || null,
    persone,
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
      subject: `🛎 Nuova richiesta — ${esc(service.name)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:${CREAM};border:1px solid #E0D9CC;">
          <div style="background:${DARK};padding:24px 28px;">
            <p style="font-size:9px;letter-spacing:.25em;color:${GOLD};text-transform:uppercase;margin:0 0 4px;">Nuova richiesta concierge</p>
            <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#fff;margin:0;">${esc(service.name)}</h2>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%;border-collapse:collapse;">
              ${[
                ["Prezzo", esc(service.price)],
                ["Nome", esc(form.nome)],
                ["Email", `<a href="mailto:${esc(form.email)}" style="color:${GOLD}">${esc(form.email)}</a>`],
                ["Telefono", esc(form.telefono) || "—"],
                ["Data", esc(form.data) || "—"],
                ["Persone", esc(persone)],
                ["Note", esc(form.note) || "—"],
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
