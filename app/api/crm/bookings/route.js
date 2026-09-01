import { Resend } from "resend";
import { requireAccess } from "../../../../lib/crmAuth";

const GOLD = "#BFA05A", DARK = "#1A1814", CREAM = "#FAF8F3";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lesicilien.it";

function buildUpsellEmail({ nome, propertyName, checkIn, checkOut }) {
  const firstName = (nome || "").split(" ")[0] || "Ospite";
  const fmt = (d) => d ? new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "";
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE6;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="background:${DARK};padding:36px 40px 28px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.28em;color:${GOLD};text-transform:uppercase;margin:0 0 12px;">Le Sicilien · Concierge</p>
        <div style="width:40px;height:1px;background:${GOLD};margin:0 auto;"></div>
      </td></tr>
      <tr><td style="background:${CREAM};padding:40px 40px 32px;">
        <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:${GOLD};text-transform:uppercase;margin:0 0 16px;">PRENOTAZIONE CONFERMATA</p>
        <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:${DARK};margin:0 0 20px;line-height:1.25;">
          Gentile ${firstName},<br/><em style="font-style:italic;">la sua vacanza${propertyName ? ` a ${propertyName}` : ""} è confermata.</em>
        </h1>
        <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 12px;">
          ${checkIn ? `Check-in: <strong>${fmt(checkIn)}</strong>` : ""}${checkIn && checkOut ? " · " : ""}${checkOut ? `Check-out: <strong>${fmt(checkOut)}</strong>` : ""}
        </p>
        <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:300;color:#5A5550;line-height:1.85;margin:0 0 28px;">
          Per rendere il suo soggiorno indimenticabile, il nostro concierge mette a disposizione transfer privati, chef a domicilio, escursioni su misura e — per occasioni speciali — pacchetti esclusivi in barca al tramonto, con cena e pernotto a bordo.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${SITE_URL}/extras"
             style="display:inline-block;background:${DARK};color:${GOLD};padding:16px 40px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.18em;text-decoration:none;text-transform:uppercase;">
            → Scopri i servizi esclusivi
          </a>
        </div>
        <div style="height:1px;background:#E0D9CC;margin:28px 0;"></div>
        <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:300;color:#8A8278;line-height:1.8;margin:0;">
          Per qualsiasi richiesta, il nostro team è disponibile 24/7 su
          <a href="https://wa.me/393273751480" style="color:${GOLD};text-decoration:none;">WhatsApp</a>.
        </p>
      </td></tr>
      <tr><td style="background:${DARK};padding:28px 40px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:.22em;color:rgba(191,160,90,.6);text-transform:uppercase;margin:0;">Le Sicilien · Luxury Real Estate · Palermo, Sicilia</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendUpsellEmail(booking) {
  if (!booking?.guest_email) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Le Sicilien Concierge <concierge@lesicilien.it>",
      to: booking.guest_email,
      subject: "La sua vacanza in Sicilia è confermata — servizi esclusivi per lei",
      html: buildUpsellEmail({
        nome: booking.guest_name,
        propertyName: booking.properties?.name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
      }),
    });
  } catch (sendErr) {
    console.error("Errore invio upsell email:", sendErr);
  }
}

async function upsertGuest(supabase, { guest_name, guest_email, guest_phone }) {
  if (!guest_email) return null;
  const { data: existing } = await supabase.from("guests").select("id").eq("email", guest_email).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("guests")
    .insert({ name: guest_name || guest_email, email: guest_email, phone: guest_phone || null })
    .select("id").single();
  return created?.id || null;
}

export async function GET(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { data, error: dbErr } = await auth.supabase
    .from("bookings")
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))")
    .order("check_in", { ascending: false });
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function POST(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const body = await request.json();
  if (!body.property_id || !body.check_in || !body.check_out) {
    return Response.json({ ok: false, error: "Immobile, check-in e check-out sono obbligatori" }, { status: 400 });
  }
  const guest_id = await upsertGuest(auth.supabase, body);
  const { data, error: dbErr } = await auth.supabase
    .from("bookings")
    .insert({
      property_id: body.property_id,
      guest_id,
      guest_name: body.guest_name || null,
      guest_email: body.guest_email || null,
      guest_phone: body.guest_phone || null,
      channel: body.channel || "diretta",
      check_in: body.check_in,
      check_out: body.check_out,
      guests_count: body.guests_count || 1,
      total_amount: body.total_amount || 0,
      commission_pct: body.commission_pct || null,
      status: body.status || "confermata",
      notes: body.notes || null,
      created_by: auth.profile.id,
    })
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))")
    .single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  if (data.status === "confermata") await sendUpsellEmail(data);
  return Response.json({ ok: true, data });
}

export async function PUT(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { id, properties, ...rest } = await request.json();
  if (!id) return Response.json({ ok: false, error: "id mancante" }, { status: 400 });
  if (rest.guest_email !== undefined) {
    rest.guest_id = await upsertGuest(auth.supabase, rest);
  }
  const { data: before } = await auth.supabase.from("bookings").select("status").eq("id", id).maybeSingle();
  const { data, error: dbErr } = await auth.supabase
    .from("bookings").update(rest).eq("id", id)
    .select("*, properties:property_id(id, name, owner_id, commission_pct, owners:owner_id(commission_pct))").single();
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  if (data.status === "confermata" && before?.status !== "confermata") await sendUpsellEmail(data);
  return Response.json({ ok: true, data });
}

export async function DELETE(request) {
  const { auth, error } = await requireAccess(request, "bookings");
  if (error) return error;
  const { id } = await request.json();
  const { error: dbErr } = await auth.supabase.from("bookings").delete().eq("id", id);
  if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
