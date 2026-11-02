/**
 * Worker del sitio. Sirve los archivos estáticos de dist/ y agrega una sola
 * ruta: POST /api/mc, que avisa lo que hizo en la web un contacto que llegó
 * desde un link del bot de WhatsApp. Según con qué código llegó:
 *
 *   ?cw=<código>  → Cleo en Chatwoot (desde el 02/11/2026). Se reenvía al
 *                   workflow "Bot Gravity · Eventos web" de n8n, que pone la
 *                   etiqueta web_* en la charla de Chatwoot.
 *   ?mc=<id>      → ManyChat (links viejos). Etiqueta Web_* en ManyChat con
 *                   la clave del secret MANYCHAT_API_KEY; sin la clave, no
 *                   hace nada.
 *
 * Solo acepta los eventos de la lista: desde la web nadie puede poner una
 * etiqueta arbitraria, solo estas. El nombre de cada etiqueta en Chatwoot lo
 * define n8n (nodo "Validar evento").
 */
const TAGS = {
  vsl_play: 'Web_vio_video',
  vsl_50: 'Web_vio_video_50',
  vsl_90: 'Web_vio_video_completo',
  calendar_click: 'Web_click_agendar',
  calendly_time: 'Web_eligio_horario',
  calendly_booked: 'Web_agendo',
  whatsapp_click: 'Web_click_whatsapp',
  case_click: 'Web_vio_caso',
};

const API = 'https://api.manychat.com/fb';
const N8N_EVENTOS = 'https://n8n.gravity-studios.com/webhook/web-evento-4f9c2a';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/mc') return trackEvent(request, env, ctx, url);
    return env.ASSETS.fetch(request);
  },
};

async function trackEvent(request, env, ctx, url) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  // Solo desde el propio sitio.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== url.host) return new Response(null, { status: 403 });

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = body?.e;
  if (!TAGS[event]) return new Response(null, { status: 400 });

  const cw = String(body?.cw ?? '');
  const mc = String(body?.mc ?? '');
  const okCw = /^[a-z0-9]{12}$/.test(cw);
  const okMc = /^\d{1,20}$/.test(mc);
  if (!okCw && !okMc) return new Response(null, { status: 400 });

  if (okCw) ctx.waitUntil(sendToN8n(cw, event));
  if (okMc && env.MANYCHAT_API_KEY) ctx.waitUntil(addTag(env.MANYCHAT_API_KEY, mc, TAGS[event]));
  return new Response(null, { status: 204 });
}

async function sendToN8n(cw, event) {
  const res = await fetch(N8N_EVENTOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cw, e: event }),
  });
  if (!res.ok) console.log(`n8n ${res.status} (${event}, ${cw}): ${await res.text()}`);
}

async function addTag(key, mc, tag) {
  const call = (path, payload) =>
    fetch(`${API}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  const payload = { subscriber_id: Number(mc), tag_name: tag };
  let res = await call('subscriber/addTagByName', payload);

  // La primera vez la etiqueta puede no existir en ManyChat: se crea y se
  // reintenta, así no hay que darlas de alta a mano.
  if (!res.ok) {
    await call('page/createTag', { name: tag });
    res = await call('subscriber/addTagByName', payload);
  }
  if (!res.ok) console.log(`ManyChat ${res.status} (${tag}, ${mc}): ${await res.text()}`);
}
