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
 *
 * Y POST /api/capi: cuando alguien del quiz abre WhatsApp, manda el evento Lead
 * a la API de conversiones de Meta (worker/meta.js).
 *
 * Y POST /api/capi-web: los eventos de Meta de la landing (VideoCompleto,
 * EligioHorario y Schedule al agendar en Calendly). El navegador manda el mismo
 * evento por el pixel con el mismo event_id, y Meta lo cuenta una vez.
 *
 * Y /api/recurso/*: el recurso con IA de /recurso (worker/recurso/).
 *
 * Y POST /api/t + GET /api/panel/*: el registro propio de visitantes y el panel
 * /admin/panel (worker/tracking.js y worker/panel.js). El quiz, el recurso y
 * Calendly además identifican al visitante (identificar) cuando deja datos.
 */
import { empty, readJson, sameOrigin, text, PHONE_RE, N8N_LEADS } from './util.js';
import { metaEvent, sitePageUrl } from './meta.js';
import { readInvitee } from './calendly.js';
import { handleRecurso } from './recurso/routes.js';
import { recibirEventos, identificar, vidDe, limpiar } from './tracking.js';
import { panel } from './panel.js';

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
    if (url.pathname === '/api/lead') return saveLead(request, env, ctx, url);
    if (url.pathname === '/api/capi') return sendConversion(request, env, ctx, url);
    if (url.pathname === '/api/capi-web') return sendWebConversion(request, env, ctx, url);
    if (url.pathname.startsWith('/api/recurso/')) return handleRecurso(request, env, ctx, url);
    if (url.pathname === '/api/t') return recibirEventos(request, env, url);
    if (url.pathname.startsWith('/api/panel/')) return panel(request, env, url);
    return env.ASSETS.fetch(request);
  },

  // Cron diario (wrangler.jsonc): borra lo anónimo de más de 180 días.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(limpiar(env));
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


async function saveLead(request, env, ctx, url) {
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

  ctx.waitUntil(sendLead(env, lead));
  // Panel: este visitante ahora tiene nombre (y sus visitas anteriores también).
  ctx.waitUntil(
    identificar(env, vidDe(request, body), {
      origen: 'quiz',
      nombre: name,
      telefono: phone,
      instagram,
      datos: { quiz: answers, temperatura: lead.temperature, ref: lead.ref, quiz_at: lead.received_at },
    })
  );
  return new Response(null, { status: 204 });
}

async function sendLead(env, lead) {
  try {
    const res = await fetch(env.N8N_LEADS_URL || N8N_LEADS, { // N8N_LEADS_URL solo para pruebas locales
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

/* ---------------------------------------------------------------------------
 * API de conversiones de Meta (desde el quiz de /plan)
 *
 * La conversión es abrir WhatsApp desde el quiz (botón "Recibir mi plan por
 * WhatsApp" o la cuenta regresiva). Se manda como Lead. El envío vive en
 * worker/meta.js.
 * ------------------------------------------------------------------------- */

async function sendConversion(request, env, ctx, url) {
  if (request.method !== 'POST') return empty(405);
  if (!sameOrigin(request, url)) return empty(403);
  const body = await readJson(request);
  if (!body) return empty(400);

  const name = text(body.name, 80);
  const phone = text(body.phone, 16);
  const eventId = text(body.event_id, 80);
  if (name.length < 2 || !PHONE_RE.test(phone) || !/^[\w-]{1,80}$/.test(eventId)) return empty(400);

  const custom = { content_name: 'Plan de Captación (quiz)' };
  for (const k of ['cuello', 'momento']) {
    if (QUIZ[k].includes(body[k])) custom[k] = body[k];
  }

  const evento = { eventId, pageUrl: sitePageUrl(body.url, url, '/plan/'), name, phone, fbc: body.fbc, custom };
  await metaEvent(env, ctx, request, { ...evento, eventName: 'Lead' });
  // Lead calificado del quiz: respondió que quiere llenar la agenda en 90 días.
  // Va aparte para poder optimizar una campaña solo por estos.
  if (custom.momento === '1')
    await metaEvent(env, ctx, request, { ...evento, eventName: 'LeadCaliente', eventId: `${eventId}-caliente` });
  return empty(204);
}

/* ---------------------------------------------------------------------------
 * API de conversiones de Meta (desde la landing)
 *
 *   vsl_90           → VideoCompleto  (vio el 90% del video)
 *   calendly_time    → EligioHorario  (eligió día y hora en Calendly)
 *   calendly_booked  → Schedule       (confirmó la auditoría), con nombre, email
 *                                      y teléfono leídos de la reserva
 *
 * La landing no usa Lead: ese evento es del quiz (/plan) y del recurso, así
 * cada campaña se optimiza por lo suyo.
 * ------------------------------------------------------------------------- */

const WEB_EVENTS = {
  vsl_90: { eventName: 'VideoCompleto', content: 'Video de la landing' },
  calendly_time: { eventName: 'EligioHorario', content: 'Auditoría Gravity (Calendly)' },
  calendly_booked: { eventName: 'Schedule', content: 'Auditoría Gravity (Calendly)' },
};

async function sendWebConversion(request, env, ctx, url) {
  if (request.method !== 'POST') return empty(405);
  if (!sameOrigin(request, url)) return empty(403);
  const body = await readJson(request);
  if (!body) return empty(400);

  const def = WEB_EVENTS[body.e];
  const eventId = text(body.event_id, 80);
  if (!def || !/^[\w-]{1,80}$/.test(eventId)) return empty(400);

  const cw = /^[a-z0-9]{12}$/.test(body.cw || '') ? body.cw : '';
  const evento = {
    eventName: def.eventName,
    eventId,
    pageUrl: sitePageUrl(body.url, url, '/'),
    externalId: cw ? `cw-${cw}` : undefined,
    custom: { content_name: def.content },
  };

  if (body.e === 'calendly_booked') {
    // Sin una reserva real y reciente no se manda Schedule (ver worker/calendly.js).
    const inv = await readInvitee(env, body.invitee);
    if (!inv) {
      if (!env.CALENDLY_TOKEN) console.log('Schedule sin mandar: falta el secret CALENDLY_TOKEN');
      return empty(204);
    }
    Object.assign(evento, { name: inv.name, lastName: inv.lastName, email: inv.email, phone: inv.phone || undefined });
    ctx.waitUntil(
      identificar(env, vidDe(request, body), {
        origen: 'calendly',
        nombre: [inv.name, inv.lastName].filter(Boolean).join(' '),
        telefono: inv.phone || undefined,
        email: inv.email,
        datos: { reserva: new Date().toISOString() },
      })
    );
  }

  await metaEvent(env, ctx, request, evento);
  return empty(204);
}
