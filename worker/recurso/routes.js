/**
 * Rutas del recurso de /recurso ("tus primeras 10 ventas de tratamientos por
 * Instagram"). Todo queda en la base D1 `gravity-recurso` (binding DB).
 *
 *   POST /api/recurso/registro   nombre, WhatsApp y email → código para retomar
 *   POST /api/recurso/encuesta   profesión, servicios (con estrellas), ciudades, país
 *   POST /api/recurso/generar    oferta | avatar | guion, con el texto en vivo
 *   GET  /api/recurso/estado     todo lo que generó (para retomar)
 *   POST /api/recurso/evento     log de lo que hace (copiar, cartel, WhatsApp…)
 *   GET  /api/recurso/admin/*    página de administración (header X-Admin-Key)
 *
 * El código del usuario (16 caracteres al azar) es lo único que hace falta
 * para ver lo que generó: no devuelve teléfono ni email.
 */
import { empty, json, readJson, sameOrigin, text, PHONE_RE, N8N_LEADS } from '../util.js';
import { metaEvent, sitePageUrl } from '../meta.js';
import { generarEnVivo, costo, precio, MODELO_DEFAULT } from './openai.js';
import { usadas, restantes, topeDiarioAlcanzado, topeIpAlcanzado, gastoProyectado, topeUsd } from './limits.js';
import { PROFESIONES } from './prompts/comun.js';
import { promptOferta } from './prompts/oferta.js';
import { promptAvatar } from './prompts/avatar.js';
import { promptGuion, FORMATOS } from './prompts/guiones.js';
import { admin } from './admin.js';
import { identificar, vidDe } from '../tracking.js';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const CODIGO_RE = /^[a-z0-9]{16}$/;

/** Eventos que el navegador puede registrar. */
const EVENTOS = [
  'cartel_visto',
  'cartel_cerrado',
  'whatsapp_click',
  'copiar',
  'descargar',
  'retomo',
];

/**
 * Cuánto razona y cuánto puede escribir cada tipo. `entrada` es el tamaño
 * aproximado del pedido (instrucciones + datos), para calcular el costo máximo.
 * maxTokens incluye el razonamiento: es el techo de lo que se puede gastar.
 */
const CONFIG = {
  oferta: { effort: 'medium', maxTokens: 14000, entrada: 4000 },
  avatar: { effort: 'low', maxTokens: 10000, entrada: 7000 },
  guion: { effort: 'low', maxTokens: 4000, entrada: 7000 },
};

/** Lo máximo que puede costar una generación de este tipo, en USD. */
function costoMax(env, tipo) {
  const p = precio(env.OPENAI_MODEL || MODELO_DEFAULT);
  return (CONFIG[tipo].entrada * p.entrada + CONFIG[tipo].maxTokens * p.salida) / 1e6;
}

/** Restantes, en 0 los tipos que ya no entran en el tope de gasto. */
async function restantesReales(env, usuarioId) {
  const r = restantes(await usadas(env.DB, usuarioId));
  const { gastado, enCurso } = await gastoProyectado(env.DB, usuarioId, costoMax(env, 'oferta'));
  const tope = topeUsd(env);
  for (const tipo of Object.keys(r)) if (gastado + enCurso + costoMax(env, tipo) > tope) r[tipo] = 0;
  return r;
}

export async function handleRecurso(request, env, ctx, url) {
  if (!env.DB) return json({ error: 'El recurso no está configurado.' }, 503);
  const ruta = url.pathname.slice('/api/recurso/'.length);

  if (ruta.startsWith('admin/')) return admin(request, env, url, ruta.slice(6));
  if (ruta === 'estado' && request.method === 'GET') return estado(request, env, ctx, url);

  if (request.method !== 'POST') return empty(405);
  if (!sameOrigin(request, url)) return empty(403);

  if (ruta === 'registro') return registro(request, env, ctx, url);
  if (ruta === 'encuesta') return encuesta(request, env);
  if (ruta === 'generar') return generar(request, env, ctx);
  if (ruta === 'evento') return evento(request, env, ctx, url);
  return empty(404);
}

/* --- Helpers -------------------------------------------------------------- */

const log = (env, usuarioId, ev, dato) =>
  env.DB.prepare('INSERT INTO eventos (usuario_id, evento, dato) VALUES (?, ?, ?)')
    .bind(usuarioId, ev, dato == null ? null : String(dato).slice(0, 500))
    .run();

async function usuarioPorCodigo(env, codigo) {
  if (!CODIGO_RE.test(codigo || '')) return null;
  const u = await env.DB.prepare('SELECT * FROM usuarios WHERE codigo = ?').bind(codigo).first();
  if (!u) return null;
  u.servicios = JSON.parse(u.servicios || '[]');
  u.ciudades = JSON.parse(u.ciudades || '[]');
  return u;
}

function nuevoCodigo() {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => abc[b % abc.length]).join('');
}

const ultima = (env, usuarioId, tipo) =>
  env.DB.prepare(
    "SELECT texto FROM generaciones WHERE usuario_id = ? AND tipo = ? AND estado = 'ok' ORDER BY id DESC LIMIT 1"
  )
    .bind(usuarioId, tipo)
    .first('texto');

/* --- Registro ------------------------------------------------------------- */

async function registro(request, env, ctx, url) {
  const body = await readJson(request);
  if (!body) return empty(400);
  // Trampa para bots: responde como si hubiera salido bien.
  if (text(body.website, 200)) return json({ codigo: nuevoCodigo() });

  const nombre = text(body.nombre, 80);
  const telefono = text(body.telefono, 16);
  const email = text(body.email, 254).toLowerCase();
  if (nombre.length < 2) return json({ error: 'Escribí tu nombre.' }, 400);
  if (!PHONE_RE.test(telefono)) return json({ error: 'Revisá el número de WhatsApp.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'Revisá el email.' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await topeIpAlcanzado(env.DB, ip))
    return json({ error: 'Ya se registraron varias cuentas desde esta conexión hoy. Probá mañana o escribinos por WhatsApp.' }, 429);

  const utm = {};
  for (const k of ['source', 'medium', 'campaign', 'content', 'term']) {
    const v = text(body.utm?.[k], 150);
    if (v) utm[k] = v;
  }
  const fbc = text(body.fbc, 600);
  const codigo = nuevoCodigo();

  const r = await env.DB.prepare(
    'INSERT INTO usuarios (codigo, nombre, telefono, email, utm, fbc, ip, pais_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(codigo, nombre, telefono, email, JSON.stringify(utm), fbc || null, ip, request.cf?.country || null)
    .run();
  const usuarioId = r.meta.last_row_id;
  await log(env, usuarioId, 'registro', utm.source || null);
  // Panel de visitantes: este navegador pasa a ser esta persona.
  ctx.waitUntil(
    identificar(env, vidDe(request, body), { origen: 'recurso', nombre, telefono, email, recursoUsuarioId: usuarioId })
  );

  // Lead a n8n (misma hoja que el quiz) y a Meta.
  ctx.waitUntil(
    // N8N_LEADS_URL solo para pruebas locales.
    fetch(env.N8N_LEADS_URL || N8N_LEADS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'recurso',
        received_at: new Date().toISOString(),
        name: nombre,
        phone: telefono,
        email,
        utm,
        country: request.cf?.country,
        resume_url: `${url.origin}/recurso/?u=${codigo}`,
      }),
    })
      .then((res) => res.ok || console.log(`n8n ${res.status} (lead recurso ${usuarioId})`))
      .catch((err) => console.log(`n8n error (lead recurso ${usuarioId}): ${err}`))
  );
  await metaEvent(env, ctx, request, {
    eventName: 'Lead',
    eventId: `recurso-${codigo}`,
    pageUrl: sitePageUrl(body.url, url, '/recurso/'),
    name: nombre,
    phone: telefono,
    email,
    fbc,
    custom: { content_name: 'Recurso: primeras 10 ventas por Instagram' },
  });

  return json({ codigo });
}

/* --- Encuesta ------------------------------------------------------------- */

async function encuesta(request, env) {
  const body = await readJson(request, 6000);
  if (!body) return empty(400);
  const u = await usuarioPorCodigo(env, body.u);
  if (!u) return json({ error: 'No encontramos tu sesión. Recargá la página.' }, 404);

  const profesion = text(body.profesion, 30);
  if (!PROFESIONES[profesion]) return json({ error: 'Elegí tu especialidad.' }, 400);

  const servicios = (Array.isArray(body.servicios) ? body.servicios : [])
    .slice(0, 10)
    .map((s) => ({ nombre: text(s?.nombre, 80), estrella: s?.estrella === true }))
    .filter((s) => s.nombre.length >= 2);
  if (!servicios.length) return json({ error: 'Agregá al menos un servicio.' }, 400);
  const estrellas = servicios.filter((s) => s.estrella).length;
  if (estrellas < 1 || estrellas > 2) return json({ error: 'Marcá con ⭐ tu servicio estrella (uno o dos).' }, 400);

  const ciudades = (Array.isArray(body.ciudades) ? body.ciudades : [])
    .slice(0, 5)
    .map((c) => text(c, 60))
    .filter((c) => c.length >= 2);
  if (!ciudades.length) return json({ error: 'Escribí al menos una ciudad.' }, 400);
  const pais = text(body.pais, 40);
  if (pais.length < 2) return json({ error: 'Elegí tu país.' }, 400);

  await env.DB.prepare(
    'UPDATE usuarios SET profesion = ?, servicios = ?, ciudades = ?, pais = ?, precio = ?, diferencial = ? WHERE id = ?'
  )
    .bind(
      profesion,
      JSON.stringify(servicios),
      JSON.stringify(ciudades),
      pais,
      text(body.precio, 80) || null,
      text(body.diferencial, 400) || null,
      u.id
    )
    .run();
  await identificar(env, vidDe(request, body), { origen: 'recurso', recursoUsuarioId: u.id, datos: { profesion } });
  await log(env, u.id, 'encuesta', `${profesion} · ${servicios.filter((s) => s.estrella).map((s) => s.nombre).join(', ')}`);
  return json({ ok: true });
}

/* --- Generar -------------------------------------------------------------- */

async function generar(request, env, ctx) {
  const body = await readJson(request);
  if (!body) return empty(400);
  const u = await usuarioPorCodigo(env, body.u);
  if (!u) return json({ error: 'No encontramos tu sesión. Recargá la página.' }, 404);
  if (!u.profesion) return json({ error: 'Primero completá la encuesta.' }, 400);
  if (!env.OPENAI_API_KEY) return json({ error: 'El generador todavía no está activo. Escribinos por WhatsApp.' }, 503);

  const tipo = body.tipo;
  if (!CONFIG[tipo]) return empty(400);

  // Las que quedaron colgadas (la conexión se cortó) dejan de contar.
  await env.DB.prepare(
    "UPDATE generaciones SET estado = 'error' WHERE estado = 'pendiente' AND creado < datetime('now', '-10 minutes')"
  ).run();

  const disponibles = await restantesReales(env, u.id);
  if (disponibles[tipo] <= 0) return json({ error: 'limite', restantes: disponibles }, 429);
  if (await topeDiarioAlcanzado(env))
    return json({ error: 'Hoy el generador recibió muchísimos pedidos. Volvé mañana o escribinos por WhatsApp y te ayudamos.' }, 503);

  let prompt;
  let formato = null;
  let servicio = null;
  if (tipo === 'oferta') {
    prompt = promptOferta(u);
  } else {
    const oferta = await ultima(env, u.id, 'oferta');
    if (!oferta) return json({ error: 'Primero generá tu oferta.' }, 400);
    if (tipo === 'avatar') {
      prompt = promptAvatar(u, oferta);
    } else {
      const avatar = await ultima(env, u.id, 'avatar');
      if (!avatar) return json({ error: 'Primero generá tu paciente ideal.' }, 400);
      formato = FORMATOS[body.formato] ? body.formato : null;
      servicio = text(body.servicio, 80);
      if (!formato) return json({ error: 'Elegí el formato del video.' }, 400);
      if (!u.servicios.some((s) => s.nombre === servicio)) return json({ error: 'Elegí uno de tus servicios.' }, 400);
      const { results } = await env.DB.prepare(
        "SELECT texto FROM generaciones WHERE usuario_id = ? AND tipo = 'guion' AND estado = 'ok'"
      )
        .bind(u.id)
        .all();
      const previos = results.map((r) => (r.texto.match(/^#\s*(.+)$/m) || [])[1]).filter(Boolean);
      prompt = promptGuion(u, { oferta, avatar, formato, servicio, previos });
    }
  }

  // Reserva el lugar antes de llamar a OpenAI (cuenta para el tope).
  const fila = await env.DB.prepare(
    "INSERT INTO generaciones (usuario_id, tipo, formato, servicio, estado) VALUES (?, ?, ?, ?, 'pendiente')"
  )
    .bind(u.id, tipo, formato, servicio)
    .run();
  const genId = fila.meta.last_row_id;

  const alTerminar = async ({ ok, texto, uso: tokens }) => {
    await env.DB.prepare(
      'UPDATE generaciones SET texto = ?, tokens_entrada = ?, tokens_cache = ?, tokens_salida = ?, costo_usd = ?, estado = ? WHERE id = ?'
    )
      .bind(
        texto || null,
        tokens?.entrada ?? null,
        tokens?.cache ?? null,
        tokens?.salida ?? null,
        tokens ? Math.round(costo(tokens, env.OPENAI_MODEL || MODELO_DEFAULT) * 1e5) / 1e5 : null,
        ok ? 'ok' : 'error',
        genId
      )
      .run();
    await log(env, u.id, ok ? `generar_${tipo}` : `error_${tipo}`, formato ? `${formato} · ${servicio}` : null);
    if (!ok) return {};
    return { id: genId, restantes: await restantesReales(env, u.id) };
  };

  const { effort, maxTokens } = CONFIG[tipo];
  const res = await generarEnVivo(env, ctx, { ...prompt, effort, maxTokens }, alTerminar);
  if (!res) return json({ error: 'No pudimos conectarnos con la IA. Probá de nuevo en un minuto.' }, 502);
  return res;
}

/* --- Estado (retomar) ----------------------------------------------------- */

async function estado(request, env, ctx, url) {
  const u = await usuarioPorCodigo(env, url.searchParams.get('u'));
  if (!u) return json({ error: 'No encontramos tu sesión.' }, 404);
  // Retomó (quizás desde otro dispositivo): se une ese navegador a la persona.
  ctx.waitUntil(identificar(env, vidDe(request, null), { origen: 'recurso', recursoUsuarioId: u.id }));
  const { results } = await env.DB.prepare(
    "SELECT id, tipo, formato, servicio, texto, creado FROM generaciones WHERE usuario_id = ? AND estado = 'ok' ORDER BY id"
  )
    .bind(u.id)
    .all();
  return json({
    nombre: u.nombre,
    encuesta: u.profesion
      ? {
          profesion: u.profesion,
          servicios: u.servicios,
          ciudades: u.ciudades,
          pais: u.pais,
          precio: u.precio,
          diferencial: u.diferencial,
        }
      : null,
    generaciones: results,
    restantes: await restantesReales(env, u.id),
  });
}

/* --- Eventos -------------------------------------------------------------- */

async function evento(request, env, ctx, url) {
  const body = await readJson(request);
  if (!body) return empty(400);
  const u = await usuarioPorCodigo(env, body.u);
  if (!u || !EVENTOS.includes(body.evento)) return empty(400);
  await log(env, u.id, body.evento, text(body.dato, 200) || null);

  if (body.evento === 'whatsapp_click') {
    await metaEvent(env, ctx, request, {
      eventName: 'Contact',
      eventId: `recurso-wa-${u.codigo}-${Date.now()}`,
      pageUrl: sitePageUrl(body.url, url, '/recurso/'),
      name: u.nombre,
      phone: u.telefono,
      email: u.email,
      fbc: u.fbc,
      custom: { content_name: 'Recurso: WhatsApp a Gravity', origen: text(body.dato, 40) },
    });
  }
  return empty(204);
}
