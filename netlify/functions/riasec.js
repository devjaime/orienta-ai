// Netlify Function: riasec
// - POST /.netlify/functions/riasec
// - Body JSON: { scores, ordered, top3, ts?, ua? }
// - CORS: * (POST, OPTIONS)
// - Si existen AIRTABLE_TOKEN, AIRTABLE_BASE, AIRTABLE_TABLE -> crea un record

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function handler(event) {
  // Preflight CORS
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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON' })
    };
  }

  const userAgent = event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '';
  const nowIso = new Date().toISOString();

  const safe = {
    scores: payload.scores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    ordered: Array.isArray(payload.ordered) ? payload.ordered : [],
    top3: typeof payload.top3 === 'string' ? payload.top3 : '',
    ts: payload.ts || nowIso,
    ua: payload.ua || userAgent
  };

  const hasAirtable =
    !!process.env.AIRTABLE_TOKEN && !!process.env.AIRTABLE_BASE && !!process.env.AIRTABLE_TABLE;

  try {
    if (hasAirtable) {
      const url = `https://api.airtable.com/v0/${encodeURIComponent(
        process.env.AIRTABLE_BASE
      )}/${encodeURIComponent(process.env.AIRTABLE_TABLE)}`;

      const fields = {
        top3: safe.top3,
        ordered: Array.isArray(safe.ordered) ? safe.ordered.join('') : String(safe.ordered || ''),
        scores_R: Number(safe.scores.R || 0),
        scores_I: Number(safe.scores.I || 0),
        scores_A: Number(safe.scores.A || 0),
        scores_S: Number(safe.scores.S || 0),
        scores_E: Number(safe.scores.E || 0),
        scores_C: Number(safe.scores.C || 0),
        ts: safe.ts,
        ua: safe.ua
      };

      // Use fetch (Node 18+ on Netlify) to create record
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Airtable error:', res.status, text);
        return {
          statusCode: 502,
          headers: CORS_HEADERS,
          body: JSON.stringify({ ok: false, error: 'Airtable request failed' })
        };
      }
    } else {
      // Sin Airtable: log mínimo
      console.log('[RIASEC]', JSON.stringify(safe));
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
  } catch {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: 'Internal Server Error' })
    };
  }
};


