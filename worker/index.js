/**
 * Worker del sitio. Sirve los archivos estáticos de dist/ y agrega una sola
 * ruta: POST /api/mc, que etiqueta en ManyChat lo que hizo en la web un
 * contacto que llegó desde un link de ManyChat (?mc=<id de contacto>).
 *
 * La clave de la API vive como secret del Worker (MANYCHAT_API_KEY), nunca
 * en el repo. Sin la clave, la ruta responde 204 y no hace nada.
 *
 * Solo acepta los eventos de la lista: desde la web nadie puede poner una
 * etiqueta arbitraria, solo estas.
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/mc') return trackToManyChat(request, env, ctx, url);
    return env.ASSETS.fetch(request);
  },
};

async function trackToManyChat(request, env, ctx, url) {
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
  const tag = TAGS[body?.e];
  const mc = String(body?.mc ?? '');
  if (!tag || !/^\d{1,20}$/.test(mc)) return new Response(null, { status: 400 });

  if (env.MANYCHAT_API_KEY) ctx.waitUntil(addTag(env.MANYCHAT_API_KEY, mc, tag));
  return new Response(null, { status: 204 });
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
