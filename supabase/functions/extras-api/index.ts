// extras-api — backend unico della pagina /extras/ e del dashboard admin.
//
// Azioni (POST JSON, campo "action"):
//   create   → l'ospite invia una richiesta o una prenotazione diretta.
//              Diretta: crea il pagamento SumUp con il prezzo letto dal DB
//              (mai dal browser) e restituisce il link di pagamento.
//              Su richiesta: salva come "pending" e avvisa l'admin via email.
//   status   → la pagina extras, al ritorno da SumUp, chiede se il pagamento
//              è andato a buon fine; se sì restituisce il buono sconto.
//   accept   → (solo admin) accetta una richiesta: crea il link SumUp per
//              l'importo indicato e lo invia all'ospite via email.
//   reject   → (solo admin) rifiuta una richiesta e avvisa l'ospite via email.
// Webhook SumUp: POST ?action=webhook — SumUp notifica il cambio di stato del
// pagamento; lo stato viene sempre riverificato interrogando SumUp.
//
// Deploy con verify_jwt = false: SumUp non invia JWT. Le azioni admin
// verificano da sole il token di sessione dell'utente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://www.lesicilien.it";
const FN_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/extras-api`;
const VOUCHER_CODE = "LESICILIEN10OFF";
const WA_NUMBER = "393273751480";
const ADMIN_NOTIFY_EMAIL = Deno.env.get("ADMIN_NOTIFY_EMAIL") || "gabrielecostanzo2002@gmail.com";
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") || "info@costanzoacquisizioni.it,lesicilienhouses@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "Le Sicilien Concierge <concierge@lesicilien.it>";
// Mittente di riserva: funziona senza dominio verificato su Resend, ma solo
// verso l'indirizzo del proprietario dell'account Resend (cioè l'admin).
const MAIL_FROM_FALLBACK = "Le Sicilien Concierge <onboarding@resend.dev>";

// Servizi prenotabili e pagabili subito online. Tutti gli altri passano
// dall'approvazione dell'admin, anche se il browser dice il contrario.
// (Protezioni, frigo, romantico, pulizie, animali e kit bebè si vendono da
// Krossbooking: i loro record in `services` sono disattivati.)
const GIFT_IDS = ["gift_100", "gift_250", "gift_500", "gift_750", "gift_1000"];
const DIRECT_IDS = new Set([
  "transfer_one", "transfer_ar", "bagagli", "early_checkin", "late_checkin",
  "kit_base", "kit_premium", "biancheria_extra", "ristorante",
  ...GIFT_IDS,
]);
// Servizi senza date di soggiorno né data del servizio.
const NO_DATES_IDS = new Set(GIFT_IDS);
// Servizi il cui prezzo è per notte di soggiorno.
const PER_NIGHT_IDS = new Set<string>();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LEN: Record<string, number> = { nome: 120, email: 180, telefono: 40, note: 2000, orario: 10 };

const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// "€1.200", "da 2.700€", "9€/notte", "€45/persona" → 1200, 2700, 9, 45
function parseEuro(price: string | null | undefined): number | null {
  if (!price) return null;
  const m = String(price).match(/\d[\d.,]*/);
  if (!m) return null;
  let s = m[0];
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function nightsBetween(checkin: string, checkout: string) {
  return Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86400000);
}

function fmtDate(d: string | null | undefined, lang = "it") {
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00Z");
  return dt.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function euro(n: number) {
  return `${n.toFixed(2).replace(/\.00$/, "")}€`;
}

// ── SUMUP ───────────────────────────────────────────────────────────────────
async function sumupCreateCheckout(requestId: string, amount: number, description: string) {
  const res = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("SUMUP_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      checkout_reference: `LS-${requestId}-${Date.now()}`,
      amount: Math.round(amount * 100) / 100,
      currency: "EUR",
      description: description.slice(0, 250),
      merchant_code: Deno.env.get("SUMUP_MERCHANT_CODE"),
      // return_url = webhook server-to-server; redirect_url = dove torna l'ospite
      return_url: `${FN_URL}?action=webhook`,
      redirect_url: `${SITE}/extras/?paid=${requestId}`,
      hosted_checkout: { enabled: true },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error_message || JSON.stringify(data));
  return { id: data.id as string, url: (data.hosted_checkout_url || `https://checkout.sumup.com/pay/${data.id}`) as string };
}

async function sumupStatus(checkoutId: string): Promise<string | null> {
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("SUMUP_API_KEY")}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.status || null; // PENDING | PAID | FAILED | EXPIRED
}

// ── EMAIL ───────────────────────────────────────────────────────────────────
async function sendMail(to: string, subject: string, html: string, allowFallback = false) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, error: "RESEND_API_KEY mancante" };
  const send = async (from: string) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (res.ok) return { ok: true as const };
    const err = await res.json().catch(() => ({}));
    return { ok: false as const, error: err?.message || `HTTP ${res.status}` };
  };
  const first = await send(MAIL_FROM);
  if (first.ok || !allowFallback) return first;
  return await send(MAIL_FROM_FALLBACK);
}

function layout(tag: string, title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE6;padding:32px 12px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#1A1814;padding:30px 36px 24px;text-align:center;">
  <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;color:#BFA05A;text-transform:uppercase;margin:0 0 10px;">Le Sicilien · Concierge</p>
  <div style="width:40px;height:1px;background:#BFA05A;margin:0 auto;"></div>
</td></tr>
<tr><td style="background:#FAF8F3;padding:34px 36px 30px;">
  <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#BFA05A;text-transform:uppercase;margin:0 0 14px;">${tag}</p>
  <h1 style="font-family:Georgia,serif;font-size:25px;font-weight:400;color:#1A1814;margin:0 0 18px;line-height:1.25;">${title}</h1>
  ${body}
</td></tr>
<tr><td style="background:#1A1814;padding:22px 36px;text-align:center;">
  <a href="https://wa.me/${WA_NUMBER}" style="font-family:Arial,sans-serif;font-size:11px;color:#BFA05A;text-decoration:none;letter-spacing:.1em;">WhatsApp Concierge · +39 327 375 1480</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function rowsTable(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0D9CC;margin:0 0 24px;">
  ${rows.map(([k, v]) => `<tr>
    <td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:.1em;color:#8A8278;text-transform:uppercase;width:38%;border-bottom:1px solid #E0D9CC;vertical-align:top;">${k}</td>
    <td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:14px;color:#1A1814;border-bottom:1px solid #E0D9CC;">${v}</td>
  </tr>`).join("")}</table>`;
}

function btn(href: string, label: string) {
  return `<div style="text-align:center;margin:26px 0;"><a href="${esc(href)}" style="display:inline-block;background:#1A1814;color:#BFA05A;padding:15px 36px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.16em;text-decoration:none;text-transform:uppercase;">${label}</a></div>`;
}

const p = (txt: string) => `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.8;margin:0 0 18px;">${txt}</p>`;

// Testi email ospite: italiano per gli ospiti italiani, inglese per tutti gli altri.
const GUEST_TXT = {
  it: {
    stay: "Soggiorno", service: "Servizio", date: "Data servizio", amount: "Importo", guests: "Persone",
    acc_tag: "Richiesta accettata", acc_title: (n: string) => `Gentile ${n},<br/><em>la sua richiesta è confermata.</em>`,
    acc_body: "Abbiamo verificato la disponibilità. Completi il pagamento sicuro con carta tramite SumUp per confermare definitivamente il servizio.",
    acc_btn: "Paga ora", acc_subj: (s: string) => `Richiesta accettata — ${s}`,
    note: "Nota del nostro team",
    rej_tag: "Aggiornamento richiesta", rej_title: (n: string) => `Gentile ${n},`,
    rej_body: (s: string) => `la ringraziamo per la richiesta. Purtroppo per <strong>${s}</strong> non riusciamo a garantire la disponibilità nella data indicata. Ci scriva su WhatsApp: troveremo insieme un'alternativa.`,
    rej_subj: "Le Sicilien — aggiornamento sulla sua richiesta",
    paid_tag: "Pagamento ricevuto", paid_title: (n: string) => `Grazie ${n},<br/><em>è tutto confermato.</em>`,
    paid_body: "Abbiamo ricevuto il pagamento. Il nostro team la contatterà per gli ultimi dettagli.",
    paid_subj: (s: string) => `Pagamento confermato — ${s}`,
    voucher_tag: "Il suo regalo", voucher_txt: `Per ringraziarla, ecco uno sconto del <strong>10%</strong> sul suo prossimo soggiorno prenotando su <a href="${SITE}" style="color:#BFA05A">lesicilien.it</a>:`,
  },
  en: {
    stay: "Stay", service: "Service", date: "Service date", amount: "Amount", guests: "Guests",
    acc_tag: "Request accepted", acc_title: (n: string) => `Dear ${n},<br/><em>your request is confirmed.</em>`,
    acc_body: "We have checked availability. Please complete the secure card payment via SumUp to finalise your booking.",
    acc_btn: "Pay now", acc_subj: (s: string) => `Request accepted — ${s}`,
    note: "A note from our team",
    rej_tag: "Request update", rej_title: (n: string) => `Dear ${n},`,
    rej_body: (s: string) => `thank you for your request. Unfortunately we cannot guarantee availability for <strong>${s}</strong> on the requested date. Message us on WhatsApp and we will find an alternative together.`,
    rej_subj: "Le Sicilien — update on your request",
    paid_tag: "Payment received", paid_title: (n: string) => `Thank you ${n},<br/><em>everything is confirmed.</em>`,
    paid_body: "We have received your payment. Our team will contact you with the final details.",
    paid_subj: (s: string) => `Payment confirmed — ${s}`,
    voucher_tag: "Your gift", voucher_txt: `As a thank you, enjoy <strong>10% off</strong> your next stay when you book on <a href="${SITE}" style="color:#BFA05A">lesicilien.it</a>:`,
  },
};
const gt = (lang: string | null) => (lang === "it" ? GUEST_TXT.it : GUEST_TXT.en);
const firstName = (nome: string) => esc(String(nome || "").trim().split(/\s+/)[0] || "");

// deno-lint-ignore no-explicit-any
function guestRows(r: any, L: typeof GUEST_TXT.it, withAmount = true): [string, string][] {
  const rows: [string, string][] = [[L.service, esc(r.service_name)]];
  if (r.checkin) rows.push([L.stay, `${fmtDate(r.checkin, r.lang)} → ${fmtDate(r.checkout, r.lang)}`]);
  if (r.data_desiderata) rows.push([L.date, `${fmtDate(r.data_desiderata, r.lang)}${r.orario ? " · " + esc(r.orario) : ""}`]);
  if (r.persone) rows.push([L.guests, String(r.persone)]);
  if (withAmount && r.amount != null) rows.push([L.amount, `<strong style="color:#BFA05A">${euro(Number(r.amount))}</strong>`]);
  return rows;
}

function voucherBlock(L: typeof GUEST_TXT.it) {
  return `<div style="border:1px dashed #BFA05A;background:#fff;padding:20px;text-align:center;margin:0 0 20px;">
    <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.2em;color:#BFA05A;text-transform:uppercase;margin:0 0 10px;">${L.voucher_tag}</p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#5A5550;line-height:1.7;margin:0 0 12px;">${L.voucher_txt}</p>
    <p style="font-family:'Courier New',monospace;font-size:22px;letter-spacing:.12em;color:#1A1814;margin:0;font-weight:700;">${VOUCHER_CODE}</p>
  </div>`;
}

// deno-lint-ignore no-explicit-any
function adminRequestEmail(r: any, heading: string) {
  const rows: [string, string][] = [
    ["Servizio", esc(r.service_name)],
    ["Prezzo listino", esc(r.service_price || "—")],
    ...(r.amount != null ? [["Importo", `<strong>${euro(Number(r.amount))}</strong>`] as [string, string]] : []),
    ["Ospite", esc(r.nome)],
    ["Email", `<a href="mailto:${esc(r.email)}" style="color:#BFA05A">${esc(r.email)}</a>`],
    ["Telefono", esc(r.telefono || "—")],
    ["Soggiorno", r.checkin ? `${fmtDate(r.checkin)} → ${fmtDate(r.checkout)}` : "—"],
    ["Data servizio", `${fmtDate(r.data_desiderata)}${r.orario ? " · " + esc(r.orario) : ""}`],
    ["Persone", String(r.persone || 1)],
    ["Note", esc(r.note || "—")],
    ["Lingua", esc(r.lang || "it")],
  ];
  return layout("Concierge · Admin", heading, rowsTable(rows) + btn(`${SITE}/admin/dashboard.html`, "Apri il dashboard"));
}

// ── PAGAMENTO CONFERMATO (idempotente) ─────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function markPaid(supabase: any, requestId: string) {
  const { data: rows } = await supabase
    .from("requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", requestId)
    .neq("status", "paid")
    .select();
  const r = rows?.[0];
  if (!r) return; // già segnato come pagato: email già inviate
  const L = gt(r.lang);
  await sendMail(r.email, L.paid_subj(r.service_name),
    layout(L.paid_tag, L.paid_title(firstName(r.nome)), p(L.paid_body) + rowsTable(guestRows(r, L)) + voucherBlock(L)));
  await sendMail(ADMIN_NOTIFY_EMAIL, `💳 Pagato: ${r.service_name} — ${r.nome} (${euro(Number(r.amount || 0))})`,
    adminRequestEmail(r, NO_DATES_IDS.has(r.service_id)
      ? "Gift card pagata — invia la gift card al cliente"
      : "Pagamento ricevuto"), true);
}

// ── AZIONI ──────────────────────────────────────────────────────────────────
// deno-lint-ignore no-explicit-any
async function handleCreate(body: any) {
  if (body.website) return json({ ok: true, kind: "request" }); // honeypot anti-bot

  const f = {
    service_id: String(body.service_id || ""),
    nome: String(body.nome || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    telefono: String(body.telefono || "").trim(),
    checkin: String(body.checkin || ""),
    checkout: String(body.checkout || ""),
    data_servizio: String(body.data_servizio || ""),
    orario: String(body.orario || "").trim(),
    note: String(body.note || "").trim(),
    persone: parseInt(body.persone, 10) || 1,
    lang: ["it", "en", "fr", "de", "pl", "zh"].includes(body.lang) ? body.lang : "it",
  };

  if (!f.service_id || f.nome.length < 3 || !f.nome.includes(" ")) return json({ ok: false, error: "nome" }, 400);
  if (!EMAIL_RE.test(f.email)) return json({ ok: false, error: "email" }, 400);
  // Le gift card si regalano per un soggiorno futuro: niente date.
  const isGift = NO_DATES_IDS.has(f.service_id);
  let nights = 0;
  if (!isGift) {
    if (![f.checkin, f.checkout, f.data_servizio].every((d) => DATE_RE.test(d))) return json({ ok: false, error: "date" }, 400);
    nights = nightsBetween(f.checkin, f.checkout);
    if (nights < 1 || nights > 90) return json({ ok: false, error: "date" }, 400);
  }
  if (f.persone < 1 || f.persone > 50) return json({ ok: false, error: "persone" }, 400);
  for (const [k, max] of Object.entries(MAX_LEN)) {
    // deno-lint-ignore no-explicit-any
    if (String((f as any)[k] || "").length > max) return json({ ok: false, error: k }, 400);
  }

  const supabase = db();

  // Anti-spam: massimo 5 invii in 10 minuti dalla stessa email
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase.from("requests").select("id", { count: "exact", head: true })
    .eq("email", f.email).gte("created_at", since);
  if ((count || 0) >= 5) return json({ ok: false, error: "rate" }, 429);

  const { data: svc } = await supabase.from("services")
    .select("service_id, name, price, deposit_amount, active")
    .eq("service_id", f.service_id).eq("active", true).maybeSingle();
  if (!svc) return json({ ok: false, error: "service" }, 404);

  const direct = DIRECT_IDS.has(f.service_id);
  let amount: number | null = null;
  if (direct) {
    const unit = svc.deposit_amount != null ? Number(svc.deposit_amount) : parseEuro(svc.price);
    if (!unit) return json({ ok: false, error: "price" }, 500);
    amount = PER_NIGHT_IDS.has(f.service_id) ? unit * nights : unit;
  }

  const { data: r, error } = await supabase.from("requests").insert([{
    service_id: f.service_id,
    service_name: svc.name,
    service_price: svc.price,
    nome: f.nome,
    email: f.email,
    telefono: f.telefono || null,
    checkin: isGift ? null : f.checkin,
    checkout: isGift ? null : f.checkout,
    data_desiderata: isGift ? null : f.data_servizio,
    orario: f.orario || null,
    persone: f.persone,
    note: f.note || null,
    lang: f.lang,
    kind: direct ? "direct" : "request",
    amount,
    // diretta = già "confermata", in attesa di pagamento
    status: direct ? "confirmed" : "pending",
  }]).select().single();
  if (error) return json({ ok: false, error: error.message }, 500);

  if (!direct) {
    await sendMail(ADMIN_NOTIFY_EMAIL, `🛎 Nuova richiesta: ${svc.name} — ${f.nome}`,
      adminRequestEmail(r, "Nuova richiesta da approvare"), true);
    return json({ ok: true, kind: "request" });
  }

  try {
    const desc = PER_NIGHT_IDS.has(f.service_id) ? `${svc.name} — ${nights} notti` : svc.name;
    const co = await sumupCreateCheckout(r.id, amount!, `${desc} — ${f.nome}`);
    await supabase.from("requests").update({ sumup_checkout_id: co.id, payment_link: co.url }).eq("id", r.id);
    return json({ ok: true, kind: "direct", checkout_url: co.url, amount, nights });
  } catch (e) {
    console.error("SumUp error:", (e as Error).message);
    // Il pagamento online non è disponibile: la trasformiamo in richiesta
    // manuale, così l'admin la vede e può mandare il link dal dashboard.
    await supabase.from("requests").update({ status: "pending", kind: "request" }).eq("id", r.id);
    await sendMail(ADMIN_NOTIFY_EMAIL, `⚠️ Pagamento online non riuscito: ${svc.name} — ${f.nome}`,
      adminRequestEmail({ ...r, note: `[SumUp non disponibile: ${(e as Error).message}] ${r.note || ""}` }, "Prenotazione da completare a mano"), true);
    return json({ ok: true, kind: "request", fallback: true });
  }
}

// deno-lint-ignore no-explicit-any
async function handleStatus(body: any) {
  const id = String(body.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: "id" }, 400);
  const supabase = db();
  const { data: r } = await supabase.from("requests").select("id, status, sumup_checkout_id, service_name").eq("id", id).maybeSingle();
  if (!r) return json({ ok: false, error: "not_found" }, 404);
  let status = r.status;
  if (status !== "paid" && r.sumup_checkout_id) {
    const s = await sumupStatus(r.sumup_checkout_id);
    if (s === "PAID") { await markPaid(supabase, r.id); status = "paid"; }
  }
  return json({ ok: true, status, service_name: r.service_name, ...(status === "paid" ? { voucher: VOUCHER_CODE } : {}) });
}

async function requireAdmin(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await db().auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  return email && ADMIN_EMAILS.includes(email) ? email : null;
}

// deno-lint-ignore no-explicit-any
async function handleAccept(req: Request, body: any) {
  if (!(await requireAdmin(req))) return json({ ok: false, error: "Non autorizzato" }, 401);
  const amount = Math.round(parseFloat(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return json({ ok: false, error: "Importo non valido" }, 400);
  const note = String(body.note || "").trim().slice(0, 2000);

  const supabase = db();
  const { data: r } = await supabase.from("requests").select("*").eq("id", body.id).maybeSingle();
  if (!r) return json({ ok: false, error: "Richiesta non trovata" }, 404);
  if (r.status === "paid") return json({ ok: false, error: "Richiesta già pagata" }, 400);

  let co;
  try {
    co = await sumupCreateCheckout(r.id, amount, `${r.service_name} — ${r.nome}`);
  } catch (e) {
    return json({ ok: false, error: `SumUp: ${(e as Error).message}` }, 502);
  }
  const { data: upd } = await supabase.from("requests").update({
    status: "confirmed", amount, sumup_checkout_id: co.id, payment_link: co.url, revolut_link: co.url,
  }).eq("id", r.id).select().single();

  const L = gt(r.lang);
  const noteHtml = note ? `<div style="border-left:2px solid #BFA05A;padding:12px 16px;background:#fff;margin:0 0 22px;">
      <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.12em;color:#BFA05A;text-transform:uppercase;margin:0 0 6px;">${L.note}</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.7;margin:0;">${esc(note).replace(/\n/g, "<br/>")}</p></div>` : "";
  const mail = await sendMail(r.email, L.acc_subj(r.service_name),
    layout(L.acc_tag, L.acc_title(firstName(r.nome)), p(L.acc_body) + rowsTable(guestRows(upd, L)) + noteHtml + btn(co.url, L.acc_btn)));

  return json({ ok: true, payment_link: co.url, email_sent: mail.ok, email_error: mail.ok ? null : mail.error });
}

// deno-lint-ignore no-explicit-any
async function handleReject(req: Request, body: any) {
  if (!(await requireAdmin(req))) return json({ ok: false, error: "Non autorizzato" }, 401);
  const supabase = db();
  const { data: r } = await supabase.from("requests").update({ status: "rejected" }).eq("id", body.id).select().single();
  if (!r) return json({ ok: false, error: "Richiesta non trovata" }, 404);
  if (body.notify === false) return json({ ok: true, email_sent: false });
  const L = gt(r.lang);
  const note = String(body.note || "").trim().slice(0, 2000);
  const mail = await sendMail(r.email, L.rej_subj,
    layout(L.rej_tag, L.rej_title(firstName(r.nome)),
      p(L.rej_body(esc(r.service_name))) + (note ? p(esc(note).replace(/\n/g, "<br/>")) : "") +
      btn(`https://wa.me/${WA_NUMBER}`, "WhatsApp")));
  return json({ ok: true, email_sent: mail.ok, email_error: mail.ok ? null : mail.error });
}

async function handleWebhook(req: Request) {
  // Corpo SumUp: { event_type: "CHECKOUT_STATUS_CHANGED", id: "<checkout id>" }.
  // Non ci fidiamo del corpo: rileggiamo lo stato direttamente da SumUp.
  const body = await req.json().catch(() => ({}));
  const checkoutId = String(body?.id || "");
  if (!checkoutId) return json({ ok: true });
  const supabase = db();
  const { data: r } = await supabase.from("requests").select("id").eq("sumup_checkout_id", checkoutId).maybeSingle();
  if (r && (await sumupStatus(checkoutId)) === "PAID") await markPaid(supabase, r.id);
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "webhook") return await handleWebhook(req);
    const body = await req.json();
    switch (body?.action) {
      case "create": return await handleCreate(body);
      case "status": return await handleStatus(body);
      case "accept": return await handleAccept(req, body);
      case "reject": return await handleReject(req, body);
      default: return json({ ok: false, error: "action" }, 400);
    }
  } catch (e) {
    console.error("extras-api error:", (e as Error).message);
    return json({ ok: false, error: "server" }, 500);
  }
});
