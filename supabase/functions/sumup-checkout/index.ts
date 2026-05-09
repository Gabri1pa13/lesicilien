const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { amount, description, reference } = await req.json();

    const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUMUP_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: reference || `LS-${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'EUR',
        description: description || 'Le Sicilien Concierge',
        merchant_code: Deno.env.get('SUMUP_MERCHANT_CODE'),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `SumUp error ${res.status}`);

    return new Response(
      JSON.stringify({ checkout_url: `https://checkout.sumup.com/pay/${data.id}` }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
