const GOAL = 300000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const TOTAL_KEY = 'total';
const RECEIPT_PREFIX = 'receipt:';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store'
    }
  });
}

function thanksPage(amount) {
  const formatted = Number(amount).toLocaleString('es-DO', { maximumFractionDigits: 2 });
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gracias por tu donación</title><style>body{margin:0;font-family:Arial,sans-serif;background:#fff4f8;color:#102a56;display:grid;place-items:center;min-height:100vh}.box{background:#fff;border-radius:24px;padding:42px 28px;max-width:560px;margin:20px;text-align:center;box-shadow:0 15px 45px #102a5620}.heart{font-size:58px}h1{margin:12px 0;font-size:32px}p{color:#596b80;line-height:1.6}.btn{display:inline-block;margin-top:18px;background:#f04f91;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:800}</style></head><body><main class="box"><div class="heart">❤️</div><h1>¡Gracias por tu donación!</h1><p>Recibimos correctamente tu comprobante y registramos tu aporte de <b>RD$${formatted}</b>.</p><a class="btn" href="/">VOLVER A MOCHILITAS</a></main></body></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } });
}

function errorPage(message) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No se pudo enviar</title><style>body{margin:0;font-family:Arial,sans-serif;background:#fff4f8;color:#102a56;display:grid;place-items:center;min-height:100vh}.box{background:#fff;border-radius:24px;padding:42px 28px;max-width:560px;margin:20px;text-align:center;box-shadow:0 15px 45px #102a5620}h1{margin:12px 0;font-size:30px}p{color:#596b80;line-height:1.6}.btn{display:inline-block;margin-top:18px;background:#f04f91;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:800}</style></head><body><main class="box"><div style="font-size:48px">⚠️</div><h1>No se pudo enviar</h1><p>${escapeHtml(message)}</p><a class="btn" href="/#verificar">VOLVER AL FORMULARIO</a></main></body></html>`, { status: 400, headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store' } });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function getTotal(env) {
  if (!env.MOCHILITAS_KV) throw new Error('MOCHILITAS_KV no está configurado.');
  const raw = await env.MOCHILITAS_KV.get(TOTAL_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function submitDonation(env, form) {
  if (!env.MOCHILITAS_KV) throw new Error('Falta configurar el almacenamiento MOCHILITAS_KV.');
  const nombre = String(form.get('nombre') || '').trim();
  const correo = String(form.get('correo') || '').trim();
  const metodo = String(form.get('metodo') || '').trim();
  const amount = Number(String(form.get('monto') || '').replace(/,/g, '').trim());
  const file = form.get('comprobante');

  if (!nombre || !correo || !metodo || !Number.isFinite(amount) || amount <= 0) throw new Error('Completa todos los campos y coloca un monto válido.');
  if (!(file instanceof File) || !file.size) throw new Error('Debes adjuntar el comprobante.');
  if (file.size > MAX_FILE_BYTES) throw new Error('El comprobante supera el límite de 20 MB.');

  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const metadata = { id, nombre, correo, metodo, monto: amount, filename: file.name || 'comprobante', contentType: file.type || 'application/octet-stream', submittedAt: new Date().toISOString() };
  await env.MOCHILITAS_KV.put(RECEIPT_PREFIX + id, await file.arrayBuffer(), { metadata });

  const current = await getTotal(env);
  const next = current + amount;
  await env.MOCHILITAS_KV.put(TOTAL_KEY, String(next));
  return { total: next, amount };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/counter' && request.method === 'GET') {
      try { return json({ total: await getTotal(env), goal: GOAL }); }
      catch (e) { console.error(e); return json({ total: 0, goal: GOAL }, 200); }
    }

    if (url.pathname === '/api/submit' && request.method === 'POST') {
      try {
        const result = await submitDonation(env, await request.formData());
        return thanksPage(result.amount);
      } catch (e) {
        console.error(e);
        return errorPage(e?.message || 'Intenta nuevamente.');
      }
    }

    return env.ASSETS.fetch(request);
  }
};
