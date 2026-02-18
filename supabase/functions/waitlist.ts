// Humanloop Waitlist - Edge Function
// Guarda emails en Supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, type, interests } = await req.json();

    // Validar email
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email inválido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Aquí iría la conexión a Supabase para guardar
    // Por ahora retornamos éxito simulado
    // En producción: await supabase.from('waitlist').insert({ email, name, type, interests })

    console.log('Waitlist signup:', { email, name, type, interests, timestamp: new Date().toISOString() });

    return new Response(JSON.stringify({
      success: true,
      message: 'Te has unido a la waitlist',
      position: Math.floor(Math.random() * 100) + 50, // Simulado
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
