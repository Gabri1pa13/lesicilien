import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { service_name, service_price, deposit_amount, total_amount, nome, email, telefono, data, orario, persone, note } = await req.json();

    const saldo = (deposit_amount != null && total_amount != null)
      ? (total_amount - deposit_amount)
      : null;

    // 1. Salva nel DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: dbError } = await supabase.from('requests').insert([{
      service_id:      service_name || 'direct',
      service_name:    service_name,
      service_price:   service_price,
      nome:            nome,
      email:           email,
      telefono:        (telefono && telefono !== '—') ? telefono : null,
      data_desiderata: (data && data !== '—') ? data : null,
      orario:          (orario && orario !== '—') ? orario : null,
      persone:         parseInt(persone) || 1,
      note:            (note && note !== '—') ? note : null,
      status:          'pending',
    }]);

    if (dbError) console.error('Errore DB:', dbError.message);

    // 2. Riga pagamento per l'email
    const paymentRows = deposit_amount != null && total_amount != null ? `
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278;width:140px">Acconto</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#BFA05A;font-weight:600">${deposit_amount}€</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Totale</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;font-weight:500">${total_amount}€</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Saldo rimanente</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;font-weight:500">${saldo}€ — da saldare all'erogazione</td></tr>` : `
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Prezzo</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#BFA05A;font-weight:500">${service_price}</td></tr>`;

    // 3. Manda email admin
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1814">
        <div style="background:#1A1814;padding:24px;text-align:center;margin-bottom:24px">
          <p style="color:#BFA05A;font-size:11px;letter-spacing:.2em;margin:0;text-transform:uppercase">LE SICILIEN · CONCIERGE</p>
          <h1 style="color:#fff;font-size:22px;margin:8px 0 0;font-weight:400">Nuova Prenotazione</h1>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278;width:140px">Servizio</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;font-weight:500">${service_name}</td></tr>
          ${paymentRows}
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Nome</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px">${nome}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Email</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px">${email}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Telefono</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px">${telefono}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Data</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px">${data} ore ${orario}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Persone</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px">${persone}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8A8278">Note</td><td style="padding:10px 0;font-size:13px">${note}</td></tr>
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="https://www.lesicilien.it/admin/dashboard.html" style="background:#1A1814;color:#BFA05A;padding:12px 28px;text-decoration:none;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Vai al dashboard →</a>
        </div>
      </div>`;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Le Sicilien Concierge <onboarding@resend.dev>',
          to: ['gabrielecostanzo2002@gmail.com'],
          subject: `🛒 Nuova prenotazione: ${service_name} — ${nome}`,
          html,
        }),
      });
      const data2 = await res.json();
      if (!res.ok) console.error('Email error:', data2.message || JSON.stringify(data2));
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
