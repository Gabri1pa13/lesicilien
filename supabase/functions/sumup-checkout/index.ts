const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));

    const { amount, description, reference } = body;
    const apiKey = Deno.env.get('SUMUP_API_KEY');
    const merchantCode = Deno.env.get('SUMUP_MERCHANT_CODE');

    console.log('API key present:', !!apiKey, '| Merchant code:', merchantCode);

    const payload = {
      checkout_reference: reference || `LS-${Date.now()}`,
      amount: parseFloat(amount),
      currency: 'EUR',
      description: description || 'Le Sicilien Concierge',
      merchant_code: merchantCode,
      return_url: 'https://www.lesicilien.it/extras/?payment=ok',
    };
    console.log('SumUp payload:', JSON.stringify(payload));

    const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('SumUp status:', res.status, '| Response:', JSON.stringify(data));

    if (!res.ok) throw new Error(data.message || JSON.stringify(data));

    return new Response(
      JSON.stringify({ checkout_url: `https://checkout.sumup.com/pay/${data.id}` }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
