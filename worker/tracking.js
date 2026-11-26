/**
 * Registro propio de visitantes (panel /admin/panel).
 *
 * Cada navegador tiene un `vid` (Base.astro, localStorage + cookie g_vid) y
 * cada visita un `sid`. El navegador manda sus eventos en tandas a POST /api/t;
 * acá se suman los datos que el navegador no sabe o no conviene pedirle (país,
 * ciudad, proveedor de internet, IP, dispositivo) y se guarda todo en D1.
 *
 * Cuando alguien deja datos (quiz, recurso, Calendly) o llega desde Cleo, las
 * rutas que reciben esos datos llaman a `identificar()`: el visitante pasa a
 * ser una persona, y si el teléfono o el email ya existían se unifica con la
 * misma persona aunque haya entrado desde otro dispositivo.
 *
 * Es first-party (mismo dominio), así que los bloqueadores de anuncios no lo
 * cortan como a Analytics, Clarity o el pixel.
 */
import { empty, readJson, sameOrigin, text, PHONE_RE } from './util.js';

const ID_RE = /^[a-z0-9]{16}$/;
const EVENT_RE = /^[a-z0-9_]{1,40}$/;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|prerender|python|curl|wget/i;
const MAX_EVENTS = 50;
const MAX_DATO = 1000;

/** El vid del body o, si no vino, el de la cookie g_vid. */
export function vidDe(request, body) {
  const v = typeof body?.vid === 'string' ? body.vid : '';
  if (ID_RE.test(v)) return v;
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)g_vid=([a-z0-9]{16})/);
  return m ? m[1] : '';
}

/* --- Dispositivo, sistema y navegador desde el User-Agent ------------------ */

function parseUA(ua) {
  const dispositivo = /iPad|Tablet|Tab(?!le)/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'celular' : 'computadora';
  const so = /iPhone|iPad|iPod/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'otro';
  // Primero los navegadores dentro de apps: casi todo el tráfico de anuncios
  // de Meta entra por el navegador interno de Instagram o Facebook.
  const navegador = /Instagram/.test(ua)
    ? 'Instagram (app)'
    : /FBAN|FBAV|FB_IAB/.test(ua)
      ? 'Facebook (app)'
      : /WhatsApp/.test(ua)
        ? 'WhatsApp (app)'
        : /Edg\//.test(ua)
          ? 'Edge'
          : /SamsungBrowser/.test(ua)
            ? 'Samsung'
            : /OPR\/|Opera/.test(ua)
              ? 'Opera'
              : /Firefox|FxiOS/.test(ua)
                ? 'Firefox'
                : /Chrome|CriOS/.test(ua)
                  ? 'Chrome'
                  : /Safari/.test(ua)
                    ? 'Safari'
                    : 'otro';
  return { dispositivo, so, navegador };
}

/* --- POST /api/t ------------------------------------------------------------ */

export async function recibirEventos(request, env, url) {
  if (request.method !== 'POST') return empty(405);
  if (!sameOrigin(request, url)) return empty(403);
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_RE.test(ua)) return empty(204);
  if (!env.DB) return empty(204);

  const body = await readJson(request, 16000);
  if (!body) return empty(400);
  const vid = vidDe(request, body);
  const sid = typeof body.sid === 'string' && ID_RE.test(body.sid) ? body.sid : '';
  if (!vid || !sid) return empty(400);
  if (!Array.isArray(body.ev) || !body.ev.length || body.ev.length > MAX_EVENTS) return empty(400);

  const ahora = Date.now();
  const eventos = [];
  for (const e of body.ev) {
    if (!e || !EVENT_RE.test(e.e || '')) continue;
    // Sin barra final, así /plan y /plan/ son la misma página.
    const ruta = text(e.p, 200);
    if (!ruta.startsWith('/')) continue;
    const pagina = ruta.replace(/\/+$/, '') || '/';
    // La hora del navegador, salvo que sea absurda (reloj mal o reintento viejo).
    const t = Number(e.t);
    const ts = new Date(t > ahora - 2 * 864e5 && t < ahora + 6e4 ? t : ahora).toISOString().replace('T', ' ').slice(0, 19);
    let dato = null;
    if (e.d && typeof e.d === 'object') {
      const s = JSON.stringify(e.d);
      if (s.length <= MAX_DATO && s !== '{}') dato = s;
    }
    eventos.push({ e: e.e, pagina, ts, dato, d: e.d || {} });
  }
  if (!eventos.length) return empty(400);

  // Lo que manda el navegador sobre la visita (Base.astro).
  const v = body.v && typeof body.v === 'object' ? body.v : {};
  const t = (k, max = 150) => text(v[k], max) || null;
  const cf = request.cf || {};
  const { dispositivo, so, navegador } = parseUA(ua);
  const ip = request.headers.get('CF-Connecting-IP') || null;
  const vistas = eventos.filter((e) => e.e === 'page_view').length;
  const segundos = eventos
    .filter((e) => e.e === 'page_leave')
    .reduce((s, e) => s + Math.min(Math.max(Number(e.d.s) || 0, 0), 4 * 3600), 0);
  const entrada = eventos.find((e) => e.e === 'page_view')?.pagina || eventos[0].pagina;

  const db = env.DB;
  const stmts = [
    db
      .prepare(
        `INSERT INTO visitantes (vid, first_source, first_medium, first_campaign, first_content, first_term,
           first_fbclid, first_referrer, first_pagina, last_source, last_medium, last_campaign, last_content, last_term,
           pais, region, ciudad, isp, dispositivo, so, navegador, idioma, pantalla, zona_horaria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (vid) DO UPDATE SET
           ultima_vez = datetime('now'),
           last_source = COALESCE(excluded.last_source, last_source),
           last_medium = COALESCE(excluded.last_medium, last_medium),
           last_campaign = COALESCE(excluded.last_campaign, last_campaign),
           last_content = COALESCE(excluded.last_content, last_content),
           last_term = COALESCE(excluded.last_term, last_term),
           pais = excluded.pais, region = excluded.region, ciudad = excluded.ciudad, isp = excluded.isp,
           dispositivo = excluded.dispositivo, so = excluded.so, navegador = excluded.navegador,
           idioma = COALESCE(excluded.idioma, idioma), pantalla = COALESCE(excluded.pantalla, pantalla),
           zona_horaria = COALESCE(excluded.zona_horaria, zona_horaria)`
      )
      .bind(
        vid,
        t('first_source'), t('first_medium'), t('first_campaign'), t('first_content'), t('first_term'),
        t('first_fbclid', 500), t('first_referrer', 500), t('first_pagina', 200),
        t('utm_source'), t('utm_medium'), t('utm_campaign'), t('utm_content'), t('utm_term'),
        cf.country || null, cf.region || null, cf.city || null, cf.asOrganization || null,
        dispositivo, so, navegador, t('idioma', 20), t('pantalla', 20), t('tz', 60) || cf.timezone || null
      ),
    // Una visita nueva suma 1 (antes de crear la sesión, que es lo que la marca como vista).
    db
      .prepare('UPDATE visitantes SET visitas = visitas + 1 WHERE vid = ? AND NOT EXISTS (SELECT 1 FROM sesiones WHERE sid = ?)')
      .bind(vid, sid),
    db
      .prepare(
        `INSERT INTO sesiones (sid, vid, pagina_entrada, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
           referrer, ip, paginas, eventos, segundos_activos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (sid) DO UPDATE SET
           fin = datetime('now'),
           paginas = paginas + excluded.paginas,
           eventos = eventos + excluded.eventos,
           segundos_activos = segundos_activos + excluded.segundos_activos
         WHERE sesiones.vid = excluded.vid`
      )
      .bind(
        sid, vid, entrada,
        t('s_source'), t('s_medium'), t('s_campaign'), t('s_content'), t('s_term'),
        t('s_referrer', 500), ip, vistas, eventos.length, segundos
      ),
    ...eventos.map((e) =>
      db
        .prepare('INSERT INTO eventos_web (vid, sid, ts, pagina, evento, dato) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(vid, sid, e.ts, e.pagina, e.e, e.dato)
    ),
  ];
  await db.batch(stmts);

  // Llegó desde Cleo (código cw) o desde un link viejo de ManyChat (mc).
  const cw = /^[a-z0-9]{12}$/.test(v.cw || '') ? v.cw : '';
  const mc = /^\d{1,20}$/.test(v.mc || '') ? v.mc : '';
  if ((cw || mc) && vistas) await identificar(env, vid, { origen: 'cleo', cw, mc });

  return empty(204);
}

/* --- Identificar: visitante → persona --------------------------------------- */

/**
 * Une el visitante `vid` con una persona. Busca por teléfono, email, código de
 * Cleo o el recurso; si no existe la crea. Si el visitante ya era otra persona
 * (por ejemplo "cleo" sin datos y ahora deja el teléfono en el quiz), junta las
 * dos en una.
 *
 * @param {object} d
 * @param {string} d.origen   quiz | recurso | calendly | cleo
 * @param {string} [d.nombre]
 * @param {string} [d.telefono]  +<dígitos>
 * @param {string} [d.email]
 * @param {string} [d.instagram]
 * @param {string} [d.cw]
 * @param {string} [d.mc]
 * @param {number} [d.recursoUsuarioId]
 * @param {object} [d.datos]  se suma a lo que ya había (respuestas del quiz, reserva…)
 */
export async function identificar(env, vid, d) {
  if (!env.DB || !ID_RE.test(vid || '')) return;
  const db = env.DB;
  try {
    // Usuario del recurso que llega sin datos (retoma o completa la encuesta):
    // se toman de su registro.
    if (d.recursoUsuarioId && !d.telefono) {
      const u = await db
        .prepare('SELECT nombre, telefono, email FROM usuarios WHERE id = ?')
        .bind(d.recursoUsuarioId)
        .first();
      if (u) d = { ...d, nombre: d.nombre || u.nombre, telefono: u.telefono, email: d.email || u.email };
    }
    const telefono = PHONE_RE.test(d.telefono || '') ? d.telefono : null;
    const email = d.email ? String(d.email).trim().toLowerCase().slice(0, 254) : null;

    // El visitante puede no existir todavía (dejó datos antes de que llegara su primera tanda).
    await db.prepare('INSERT OR IGNORE INTO visitantes (vid) VALUES (?)').bind(vid).run();
    const actual = await db.prepare('SELECT persona_id FROM visitantes WHERE vid = ?').bind(vid).first('persona_id');

    const buscar = async (col, val) =>
      val ? db.prepare(`SELECT * FROM personas WHERE ${col} = ? ORDER BY id LIMIT 1`).bind(val).first() : null;
    let p =
      (await buscar('telefono', telefono)) ||
      (await buscar('email', email)) ||
      (await buscar('recurso_usuario_id', d.recursoUsuarioId)) ||
      (await buscar('cw', d.cw)) ||
      (await buscar('mc', d.mc)) ||
      (actual ? await buscar('id', actual) : null);

    if (!p) {
      const r = await db
        .prepare(
          `INSERT INTO personas (nombre, telefono, email, instagram, origen, cw, mc, recurso_usuario_id, datos)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          d.nombre || null, telefono, email, d.instagram || null, d.origen,
          d.cw || null, d.mc || null, d.recursoUsuarioId || null, JSON.stringify(d.datos || {})
        )
        .run();
      p = { id: r.meta.last_row_id };
    } else {
      const datos = { ...JSON.parse(p.datos || '{}'), ...(d.datos || {}) };
      await db
        .prepare(
          `UPDATE personas SET
             nombre = COALESCE(?, nombre), telefono = COALESCE(telefono, ?), email = COALESCE(?, email),
             instagram = COALESCE(?, instagram), cw = COALESCE(cw, ?), mc = COALESCE(mc, ?),
             recurso_usuario_id = COALESCE(recurso_usuario_id, ?), datos = ?, actualizado = datetime('now')
           WHERE id = ?`
        )
        .bind(
          d.nombre || null, telefono, email, d.instagram || null, d.cw || null, d.mc || null,
          d.recursoUsuarioId || null, JSON.stringify(datos), p.id
        )
        .run();
    }

    // Si este navegador era otra persona, se juntan las dos.
    if (actual && actual !== p.id) await unir(db, actual, p.id);
    await db.prepare('UPDATE visitantes SET persona_id = ? WHERE vid = ?').bind(p.id, vid).run();
  } catch (err) {
    // Que nunca rompa el quiz, el recurso ni Calendly por un problema del panel.
    console.log(`identificar error (${d.origen}): ${err}`);
  }
}

/** Mueve todo de la persona `desde` a `hacia` y la borra. */
async function unir(db, desde, hacia) {
  const vieja = await db.prepare('SELECT * FROM personas WHERE id = ?').bind(desde).first();
  if (!vieja) return;
  const nueva = await db.prepare('SELECT datos FROM personas WHERE id = ?').bind(hacia).first();
  const datos = { ...JSON.parse(vieja.datos || '{}'), ...JSON.parse(nueva?.datos || '{}') };
  await db.batch([
    db.prepare('UPDATE visitantes SET persona_id = ? WHERE persona_id = ?').bind(hacia, desde),
    // El teléfono es UNIQUE: se libera en la vieja antes de pasarlo.
    db.prepare('UPDATE personas SET telefono = NULL WHERE id = ?').bind(desde),
    db
      .prepare(
        `UPDATE personas SET
           nombre = COALESCE(nombre, ?), telefono = COALESCE(telefono, ?), email = COALESCE(email, ?),
           instagram = COALESCE(instagram, ?), cw = COALESCE(cw, ?), mc = COALESCE(mc, ?),
           recurso_usuario_id = COALESCE(recurso_usuario_id, ?), datos = ?,
           creado = MIN(creado, ?), actualizado = datetime('now')
         WHERE id = ?`
      )
      .bind(
        vieja.nombre, vieja.telefono, vieja.email, vieja.instagram, vieja.cw, vieja.mc,
        vieja.recurso_usuario_id, JSON.stringify(datos), vieja.creado, hacia
      ),
    db.prepare('DELETE FROM personas WHERE id = ?').bind(desde),
  ]);
}

/* --- Limpieza diaria (cron) -------------------------------------------------- */

/** Borra lo anónimo de más de 180 días. Lo de personas identificadas queda. */
export async function limpiar(env) {
  if (!env.DB) return;
  const viejo = "datetime('now', '-180 days')";
  const anonimos = `SELECT vid FROM visitantes WHERE persona_id IS NULL AND ultima_vez < ${viejo}`;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM eventos_web WHERE vid IN (${anonimos})`),
    env.DB.prepare(`DELETE FROM sesiones WHERE vid IN (${anonimos})`),
    env.DB.prepare(`DELETE FROM visitantes WHERE persona_id IS NULL AND ultima_vez < ${viejo}`),
  ]);
}
