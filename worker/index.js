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
 *
 * Y POST /api/lead: el formulario del quiz de /plan. Valida los datos y los
 * reenvía al workflow "Gravity · Leads quiz" de n8n (ver docs/quiz-plan-cleo.md).
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
const N8N_LEADS = 'https://n8n.gravity-studios.com/webhook/quiz-lead-36a69739';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/mc') return trackEvent(request, env, ctx, url);
    if (url.pathname === '/api/lead') return saveLead(request, ctx, url);
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

/* ---------------------------------------------------------------------------
 * Lead del quiz (/plan)
 * ------------------------------------------------------------------------- */

/** Las preguntas del quiz y las respuestas posibles (src/data/quiz.ts). */
const QUIZ = {
  clinica: ['estetica', 'odontologia', 'cirugia', 'dermatologia', 'otra'],
  consultas: ['0-5', '5-15', '15-30', '30+'],
  origen: ['boca', 'instagram', 'anuncios', 'nose'],
  cuello: ['consultas', 'curiosos', 'respuesta', 'contenido', 'ausencias'],
  responde: ['yo', 'asistente', 'nadie', 'bot'],
  momento: ['1', '2'],
};

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function saveLead(request, ctx, url) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== url.host) return new Response(null, { status: 403 });

  const raw = await request.text();
  if (raw.length > 4000) return new Response(null, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  // Trampa para bots: el campo "website" está oculto. Se responde como si
  // hubiera salido bien para que el bot no aprenda nada.
  if (text(body?.website, 200)) return new Response(null, { status: 204 });

  const name = text(body?.name, 80);
  const phone = text(body?.phone, 16);
  const instagram = text(body?.instagram, 31);
  const answers = {};
  for (const [k, ok] of Object.entries(QUIZ)) {
    const v = body?.answers?.[k];
    if (!ok.includes(v)) return new Response(null, { status: 400 });
    answers[k] = v;
  }
  if (name.length < 2 || !/^\+\d{8,15}$/.test(phone) || !/^@[A-Za-z0-9._]{1,30}$/.test(instagram))
    return new Response(null, { status: 400 });

  const utm = {};
  for (const k of ['source', 'medium', 'campaign', 'content', 'term']) {
    const v = text(body?.utm?.[k], 150);
    if (v) utm[k] = v;
  }

  const lead = {
    received_at: new Date().toISOString(),
    name,
    phone,
    instagram,
    answers,
    // 1 = quiere llenar la agenda en 90 días; 2 = solo curioseando.
    temperature: answers.momento === '1' ? 'caliente' : 'frio',
    // La referencia que va al final del mensaje de WhatsApp.
    ref: `PG-${answers.cuello}-${answers.momento}`,
    utm,
    fbclid: text(body?.fbclid, 500) || undefined,
    country: request.cf?.country,
  };

  ctx.waitUntil(sendLead(lead));
  return new Response(null, { status: 204 });
}

async function sendLead(lead) {
  try {
    const res = await fetch(N8N_LEADS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (res.ok) return;
    // Si n8n falla, el lead queda en los logs del Worker (Cloudflare →
    // Workers → web-gravity → Logs) para cargarlo a mano.
    console.log(`LEAD NO GUARDADO (n8n ${res.status}): ${JSON.stringify(lead)}`);
  } catch (err) {
    console.log(`LEAD NO GUARDADO (${err}): ${JSON.stringify(lead)}`);
  }
}
