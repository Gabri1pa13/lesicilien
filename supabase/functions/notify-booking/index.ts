const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { service_name, service_price, nome, email, telefono, data, orario, persone, note } = await req.json();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1814">
        <div style="background:#1A1814;padding:24px;text-align:center;margin-bottom:24px">
          <p style="color:#BFA05A;font-size:11px;letter-spacing:.2em;margin:0;text-transform:uppercase">LE SICILIEN · CONCIERGE</p>
          <h1 style="color:#fff;font-size:22px;margin:8px 0 0;font-weight:400">Nuova Prenotazione</h1>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278;width:140px">Servizio</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;font-weight:500">${service_name}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#8A8278">Prezzo</td><td style="padding:10px 0;border-bottom:1px solid #E0D9CC;font-size:13px;color:#BFA05A;font-weight:500">${service_price}</td></tr>
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
    if (!res.ok) throw new Error(data2.message || JSON.stringify(data2));

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Email error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
