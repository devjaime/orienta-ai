// Netlify Function: flow-webhook
// Recibe la confirmación de pago de Flow.cl y actualiza el estado del informe
// Flow envía un POST con el parámetro "token" cuando el pago se confirma

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Genera la firma HMAC-SHA256 para Flow.cl
 */
function signFlowParams(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(key => key + params[key]).join('');
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const flowApiKey = process.env.FLOW_API_KEY;
  const flowSecretKey = process.env.FLOW_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!flowApiKey || !flowSecretKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('Variables de entorno faltantes para flow-webhook');
    return { statusCode: 500, body: 'Server configuration error' };
  }

  // Flow envía el token como form-urlencoded
  let token;
  try {
    const params = new URLSearchParams(event.body);
    token = params.get('token');
  } catch (err) {
    console.error('Error parseando body del webhook:', err);
    return { statusCode: 400, body: 'Bad request' };
  }

  if (!token) {
    console.error('Token no recibido en webhook');
    return { statusCode: 400, body: 'Token required' };
  }

  try {
    const flowApiUrl = process.env.FLOW_API_URL || 'https://www.flow.cl/api';

    // Consultar el estado del pago en Flow usando payment/getStatus
    const statusParams = {
      apiKey: flowApiKey,
      token: token
    };
    statusParams.s = signFlowParams(statusParams, flowSecretKey);

    const formBody = Object.entries(statusParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const flowResponse = await fetch(`${flowApiUrl}/payment/getStatus`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Flow getStatus usa GET con query params
    const statusUrl = `${flowApiUrl}/payment/getStatus?${formBody}`;
    const statusResponse = await fetch(statusUrl);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Error consultando estado en Flow:', statusResponse.status, errorText);
      return { statusCode: 502, body: 'Error consulting Flow status' };
    }

    const paymentData = await statusResponse.json();

    // Estados de Flow: 1=pendiente, 2=pagada, 3=rechazada, 4=anulada
    const flowStatus = paymentData.status;
    const commerceOrder = paymentData.commerceOrder;
    const flowOrderNumber = paymentData.flowOrder;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (flowStatus === 2) {
      // Pago exitoso
      const { data: report, error: updateError } = await supabase
        .from('paid_reports')
        .update({
          status: 'paid',
          flow_payment_data: paymentData
        })
        .eq('flow_token', token)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando paid_report:', updateError);
        return { statusCode: 500, body: 'Error updating report' };
      }

      if (report) {
        // Cambiar a 'generating' y disparar generación del informe
        await supabase
          .from('paid_reports')
          .update({ status: 'generating' })
          .eq('id', report.id);

        // Invocar la función de generación
        const origin = process.env.URL || 'https://vocari.cl';
        try {
          await fetch(`${origin}/.netlify/functions/generate-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId: report.id })
          });
        } catch (fetchErr) {
          console.error('Error invocando generate-report:', fetchErr);
        }
      }
    } else if (flowStatus === 3 || flowStatus === 4) {
      // Pago rechazado o anulado
      await supabase
        .from('paid_reports')
        .update({
          status: 'rejected',
          flow_payment_data: paymentData,
          reviewer_notes: flowStatus === 3 ? 'Pago rechazado por Flow' : 'Pago anulado'
        })
        .eq('flow_token', token);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error('Error procesando webhook de Flow:', err);
    return { statusCode: 500, body: 'Error processing webhook' };
  }
};
