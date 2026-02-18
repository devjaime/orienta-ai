// Netlify Function: create-checkout-session
// Crea una orden de pago en Flow.cl para comprar un informe vocacional

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Genera la firma HMAC-SHA256 para Flow.cl
 * 1. Ordena parámetros alfabéticamente por key
 * 2. Concatena key+value sin separadores
 * 3. Firma con HMAC-SHA256 usando secretKey
 */
function signFlowParams(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(key => key + params[key]).join('');
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  const flowApiKey = process.env.FLOW_API_KEY;
  const flowSecretKey = process.env.FLOW_SECRET_KEY;

  if (!flowApiKey || !flowSecretKey) {
    console.error('FLOW_API_KEY o FLOW_SECRET_KEY no configuradas');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Pasarela de pago no configurada' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials no configuradas');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Base de datos no configurada' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'JSON inválido' })
    };
  }

  const { planId, userId, userEmail } = payload;

  if (!planId || !userId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'planId y userId son requeridos' })
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener plan de la base de datos
    const { data: plan, error: planError } = await supabase
      .from('report_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Plan no encontrado o inactivo' })
      };
    }

    // Obtener último resultado de test del usuario
    const { data: testResult } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Generar un ID de orden único
    const commerceOrder = `vocari-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // URL base del sitio
    const origin = process.env.URL || event.headers.origin || 'https://vocari.cl';

    // URL del API de Flow (sandbox o producción)
    const flowApiUrl = process.env.FLOW_API_URL || 'https://www.flow.cl/api';

    // Parámetros para Flow payment/create
    const flowParams = {
      apiKey: flowApiKey,
      commerceOrder: commerceOrder,
      subject: `Informe Vocacional ${plan.display_name} - Vocari`,
      currency: 'CLP',
      amount: plan.price_clp,
      email: userEmail || 'cliente@vocari.cl',
      paymentMethod: 9, // 9 = todos los medios de pago
      urlConfirmation: `${origin}/.netlify/functions/flow-webhook`,
      urlReturn: `${origin}/flow-return`
    };

    // Firmar parámetros
    flowParams.s = signFlowParams(flowParams, flowSecretKey);

    // Enviar petición a Flow
    const formBody = Object.entries(flowParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const flowResponse = await fetch(`${flowApiUrl}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow API error:', flowResponse.status, errorText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Error al conectar con Flow.cl' })
      };
    }

    const flowData = await flowResponse.json();

    // flowData contiene { url, token }
    if (!flowData.url || !flowData.token) {
      console.error('Flow response inesperada:', flowData);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: 'Respuesta inesperada de Flow.cl' })
      };
    }

    // Insertar registro en paid_reports
    const { error: insertError } = await supabase
      .from('paid_reports')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'pending_payment',
        flow_token: flowData.token,
        flow_order: commerceOrder,
        test_result_snapshot: testResult ? {
          codigo_holland: testResult.codigo_holland,
          certeza: testResult.certeza,
          puntajes: testResult.puntajes,
          carreras_recomendadas: testResult.carreras_recomendadas
        } : null
      });

    if (insertError) {
      console.error('Error inserting paid_report:', insertError);
    }

    // Retornar URL de redirección a Flow checkout
    const redirectUrl = `${flowData.url}?token=${flowData.token}`;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        url: redirectUrl,
        token: flowData.token,
        commerceOrder: commerceOrder
      })
    };

  } catch (err) {
    console.error('Error creating Flow payment order:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Error al crear orden de pago' })
    };
  }
};
