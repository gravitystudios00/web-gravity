/**
 * API del panel de visitantes (/admin/panel). Solo lectura (GET) y pide el
 * header X-Admin-Key igual al secret ADMIN_KEY (el mismo del admin del recurso).
 *
 *   GET /api/panel/resumen     números del período, páginas, fuentes, lugares, dispositivos, video
 *   GET /api/panel/embudo      funnel=landing|quiz|recurso: cuántos llegan a cada paso
 *   GET /api/panel/personas    identificados (q= busca, filtro= listas para recontactar)
 *   GET /api/panel/persona     id=: datos, dispositivos, sesiones y línea de tiempo completa
 *   GET /api/panel/visitas     últimas visitas con su recorrido (también anónimas)
 *   GET /api/panel/csv         personas en CSV
 *
 * Todos aceptan desde= y hasta= ("YYYY-MM-DD HH:MM:SS", UTC; el panel convierte
 * desde la hora de Argentina) y fuente= (fuente, campaña, anuncio o conjunto
 * del primer contacto).
 */
import { empty, json } from './util.js';
import { mismaClave } from './recurso/admin.js';

const FECHA_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/** Rango y filtro de fuente comunes a todas las consultas. */
function filtros(url) {
  const p = url.searchParams;
  const hasta = FECHA_RE.test(p.get('hasta') || '') ? p.get('hasta') : new Date().toISOString().replace('T', ' ').slice(0, 19);
  const desde = FECHA_RE.test(p.get('desde') || '')
    ? p.get('desde')
    : new Date(Date.now() - 7 * 864e5).toISOString().replace('T', ' ').slice(0, 19);
  const fuente = (p.get('fuente') || '').slice(0, 150);
  return { desde, hasta, fuente };
}

/** Condición SQL "este vid vino por esta fuente" (sobre la columna `col`). */
const porFuente = (fuente, col = 'vid') =>
  fuente
    ? {
        sql: ` AND ${col} IN (SELECT vid FROM visitantes WHERE ? IN (first_source, first_campaign, first_content, first_term))`,
        args: [fuente],
      }
    : { sql: '', args: [] };

const LANDING = "(pagina = '/' OR pagina LIKE '/hl%')";

/* --- Embudos ----------------------------------------------------------------
 * Cada paso es una condición sobre eventos_web. Se cuentan visitantes
 * distintos que hicieron el paso, entre los que hicieron el primero en el
 * período. */
const EMBUDOS = {
  landing: [
    ['Entró a la landing', `evento = 'page_view' AND ${LANDING}`],
    ['Vio los casos', `evento = 'section_view' AND json_extract(dato, '$.id') = 'casos-de-exito' AND ${LANDING}`],
    ['Le dio play al video', `evento = 'vsl_play' AND ${LANDING}`],
    ['Vio la mitad', `evento = 'vsl_50' AND ${LANDING}`],
    ['Vio el 90 %', `evento = 'vsl_90' AND ${LANDING}`],
    ['Llegó a la agenda', `((evento = 'section_view' AND json_extract(dato, '$.id') = 'agenda') OR evento = 'calendar_click') AND ${LANDING}`],
    ['Eligió horario', `evento = 'calendly_time'`],
    ['Agendó', `evento = 'calendly_booked'`],
  ],
  quiz: [
    ['Entró al quiz', `evento = 'page_view' AND pagina = '/plan'`],
    ['Empezó', `evento = 'quiz_start'`],
    ...[1, 2, 3, 4, 5, 6].map((n) => [`Respondió la ${n}`, `evento = 'quiz_step' AND json_extract(dato, '$.step') = ${n}`]),
    ['Dejó sus datos', `evento = 'quiz_lead'`],
    ['Abrió WhatsApp', `evento = 'whatsapp_click' AND pagina = '/plan'`],
  ],
  recurso: [
    ['Entró al recurso', `evento = 'page_view' AND pagina = '/recurso'`],
    ['Se registró', `evento = 'recurso_registro'`],
    ['Completó la encuesta', `evento = 'recurso_encuesta'`],
    ['Generó algo', `evento = 'recurso_generar'`],
    ['Tocó WhatsApp', `evento = 'whatsapp_click' AND pagina = '/recurso'`],
  ],
};

/* --- Personas ---------------------------------------------------------------- */

const PERSONAS = `
WITH hitos AS (
  SELECT p.id,
    MAX(e.evento = 'vsl_90') AS video,
    MAX(e.evento = 'calendly_time') AS horario,
    MAX(e.evento = 'calendly_booked') AS agendo_web,
    MAX(e.evento = 'quiz_lead') AS quiz,
    MAX(e.evento = 'whatsapp_click' AND e.pagina = '/plan') AS quiz_wa,
    MAX(e.evento = 'whatsapp_click') AS whatsapp,
    MAX(e.evento = 'recurso_generar') AS genero_web,
    SUM(e.evento = 'page_view') AS paginas,
    MAX(e.ts) AS ultima
  FROM personas p
  LEFT JOIN visitantes v ON v.persona_id = p.id
  LEFT JOIN eventos_web e ON e.vid = v.vid
  GROUP BY p.id
)
SELECT p.id, p.nombre, p.telefono, p.email, p.instagram, p.origen, p.cw, p.mc, p.recurso_usuario_id,
  p.datos, p.creado, p.actualizado,
  COALESCE(h.video, 0) AS video, COALESCE(h.horario, 0) AS horario,
  (COALESCE(h.agendo_web, 0) OR json_extract(p.datos, '$.reserva') IS NOT NULL) AS agendo,
  COALESCE(h.quiz, 0) AS quiz, COALESCE(h.quiz_wa, 0) AS quiz_wa, COALESCE(h.whatsapp, 0) AS whatsapp,
  (COALESCE(h.genero_web, 0) OR EXISTS (SELECT 1 FROM generaciones g WHERE g.usuario_id = p.recurso_usuario_id AND g.estado = 'ok')) AS genero,
  COALESCE(h.paginas, 0) AS paginas, COALESCE(h.ultima, p.actualizado) AS ultima,
  (SELECT COUNT(*) FROM visitantes v WHERE v.persona_id = p.id) AS dispositivos,
  (SELECT first_source FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS fuente,
  (SELECT first_medium FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS medio,
  (SELECT first_campaign FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS campana,
  (SELECT first_content FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS anuncio,
  (SELECT first_term FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS conjunto,
  (SELECT first_pagina FROM visitantes v WHERE v.persona_id = p.id ORDER BY primera_vez LIMIT 1) AS entrada,
  (SELECT ciudad || ', ' || pais FROM visitantes v WHERE v.persona_id = p.id ORDER BY ultima_vez DESC LIMIT 1) AS lugar,
  (SELECT dispositivo || ' · ' || navegador FROM visitantes v WHERE v.persona_id = p.id ORDER BY ultima_vez DESC LIMIT 1) AS equipo,
  (SELECT vid FROM visitantes v WHERE v.persona_id = p.id ORDER BY ultima_vez DESC LIMIT 1) AS vid
FROM personas p JOIN hitos h ON h.id = p.id`;

const FILTROS = {
  horario_sin_agendar: 'horario = 1 AND agendo = 0',
  quiz_sin_whatsapp: 'quiz = 1 AND quiz_wa = 0',
  video_sin_agendar: 'video = 1 AND agendo = 0',
  recurso_sin_generar: 'recurso_usuario_id IS NOT NULL AND genero = 0',
  agendaron: 'agendo = 1',
  quiz: 'quiz = 1',
  recurso: 'recurso_usuario_id IS NOT NULL',
  cleo: "origen = 'cleo' OR cw IS NOT NULL",
};

async function listaPersonas(env, url) {
  const p = url.searchParams;
  const { desde, hasta, fuente } = filtros(url);
  const where = ['ultima BETWEEN ? AND ?'];
  const args = [desde, hasta];
  const q = (p.get('q') || '').trim().slice(0, 80);
  if (q) {
    where.push("(nombre LIKE ? OR telefono LIKE ? OR email LIKE ? OR instagram LIKE ? OR cw = ?)");
    args.push(`%${q}%`, `%${q.replace(/\D/g, '') || q}%`, `%${q}%`, `%${q}%`, q);
  }
  if (FILTROS[p.get('filtro')]) where.push(`(${FILTROS[p.get('filtro')]})`);
  if (fuente) {
    where.push('? IN (fuente, campana, anuncio, conjunto)');
    args.push(fuente);
  }
  const { results } = await env.DB.prepare(
    `SELECT * FROM (${PERSONAS}) WHERE ${where.join(' AND ')} ORDER BY ultima DESC LIMIT 500`
  )
    .bind(...args)
    .all();
  return results.map((r) => ({ ...r, datos: JSON.parse(r.datos || '{}') }));
}

/* --- Rutas ------------------------------------------------------------------- */

export async function panel(request, env, url) {
  if (request.method !== 'GET') return empty(405);
  if (!env.ADMIN_KEY || !mismaClave(request.headers.get('X-Admin-Key') || '', env.ADMIN_KEY))
    return json({ error: 'Clave incorrecta.' }, 401);
  if (!env.DB) return json({ error: 'Sin base de datos.' }, 500);

  const ruta = url.pathname.slice('/api/panel/'.length);
  const db = env.DB;
  const { desde, hasta, fuente } = filtros(url);
  const f = porFuente(fuente);
  const enRango = `ts BETWEEN ? AND ?${f.sql}`;
  const rango = [desde, hasta, ...f.args];
  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;

  if (ruta === 'resumen') {
    const distintos = (cond) => `COUNT(DISTINCT CASE WHEN ${cond} THEN vid END)`;
    const [totales] = await all(
      `SELECT COUNT(DISTINCT vid) AS visitantes,
         ${distintos("evento = 'calendly_booked'")} AS reservas,
         ${distintos("evento = 'calendly_time'")} AS horarios,
         ${distintos("evento = 'quiz_lead'")} AS leads_quiz,
         ${distintos("evento = 'recurso_registro'")} AS registros_recurso,
         ${distintos("evento = 'whatsapp_click'")} AS whatsapp,
         ${distintos("evento = 'vsl_play'")} AS video
       FROM eventos_web WHERE ${enRango}`,
      ...rango
    );
    const extra = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM sesiones WHERE inicio BETWEEN ? AND ?${porFuente(fuente).sql}) AS sesiones,
           (SELECT COUNT(*) FROM visitantes WHERE primera_vez BETWEEN ? AND ?${porFuente(fuente).sql}) AS nuevos,
           (SELECT COUNT(DISTINCT v.persona_id) FROM visitantes v WHERE v.persona_id IS NOT NULL
              AND v.vid IN (SELECT vid FROM eventos_web WHERE ${enRango})) AS identificados,
           (SELECT ROUND(AVG(segundos_activos)) FROM sesiones WHERE inicio BETWEEN ? AND ?${porFuente(fuente).sql}) AS segundos_por_visita`
      )
      .bind(...rango, ...rango, ...rango, ...rango)
      .first();

    // Tiempo y scroll por visita: cada salida de la página manda lo acumulado
    // desde la anterior, así que se suman por visita (sid) y después se promedia.
    const paginas = await all(
      `SELECT pv.pagina, pv.vistas, pv.visitantes, ROUND(AVG(l.seg)) AS segundos, ROUND(AVG(l.scr)) AS scroll
       FROM (SELECT pagina, COUNT(*) AS vistas, COUNT(DISTINCT vid) AS visitantes
             FROM eventos_web WHERE ${enRango} AND evento = 'page_view' GROUP BY pagina) pv
       LEFT JOIN (SELECT pagina, sid, SUM(json_extract(dato, '$.s')) AS seg, MAX(json_extract(dato, '$.scroll')) AS scr
                  FROM eventos_web WHERE ${enRango} AND evento = 'page_leave' GROUP BY pagina, sid) l
         ON l.pagina = pv.pagina
       GROUP BY pv.pagina ORDER BY pv.visitantes DESC LIMIT 30`,
      ...rango,
      ...rango
    );

    // Qué trajo a cada visitante (primer contacto) y qué hicieron después.
    const hizo = (ev) => `SUM(EXISTS (SELECT 1 FROM eventos_web e WHERE e.vid = v.vid AND e.evento = '${ev}'))`;
    const fuentes = await all(
      `SELECT COALESCE(first_source, '(directo)') AS fuente, COALESCE(first_medium, '') AS medio,
         COALESCE(first_campaign, '') AS campana, COALESCE(first_content, '') AS anuncio,
         COUNT(*) AS visitantes, ${hizo('vsl_90')} AS video, ${hizo('calendly_booked')} AS reservas,
         ${hizo('quiz_lead')} AS leads_quiz, ${hizo('recurso_registro')} AS registros_recurso,
         SUM(persona_id IS NOT NULL) AS identificados
       FROM visitantes v WHERE v.vid IN (SELECT vid FROM eventos_web WHERE ${enRango})
       GROUP BY 1, 2, 3, 4 ORDER BY visitantes DESC LIMIT 50`,
      ...rango
    );
    const activos = `vid IN (SELECT vid FROM eventos_web WHERE ${enRango})`;
    const lugares = await all(
      `SELECT COALESCE(pais, '?') AS pais, COALESCE(ciudad, '?') AS ciudad, COUNT(*) AS visitantes
       FROM visitantes WHERE ${activos} GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20`,
      ...rango
    );
    const equipos = await all(
      `SELECT dispositivo, navegador, COUNT(*) AS visitantes FROM visitantes WHERE ${activos}
       GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15`,
      ...rango
    );
    const [video] = await all(
      `SELECT ${['vsl_play', 'vsl_25', 'vsl_50', 'vsl_75', 'vsl_90', 'vsl_100']
        .map((e) => `${distintos(`evento = '${e}'`)} AS ${e}`)
        .join(', ')}
       FROM eventos_web WHERE ${enRango} AND ${LANDING}`,
      ...rango
    );
    const secciones = await all(
      `SELECT json_extract(dato, '$.id') AS seccion, COUNT(DISTINCT vid) AS visitantes
       FROM eventos_web WHERE ${enRango} AND evento = 'section_view' AND ${LANDING}
       GROUP BY 1 ORDER BY 2 DESC`,
      ...rango
    );
    return json({ desde, hasta, totales: { ...totales, ...extra }, paginas, fuentes, lugares, equipos, video, secciones });
  }

  if (ruta === 'embudo') {
    const pasos = EMBUDOS[url.searchParams.get('funnel')] || EMBUDOS.landing;
    const cols = pasos.map(([, c], i) => `COUNT(DISTINCT CASE WHEN ${c} THEN vid END) AS p${i}`).join(', ');
    const fila = await db
      .prepare(
        `SELECT ${cols} FROM eventos_web WHERE ${enRango}
         AND vid IN (SELECT vid FROM eventos_web WHERE ${enRango} AND ${pasos[0][1]})`
      )
      .bind(...rango, ...rango)
      .first();
    return json({ pasos: pasos.map(([nombre], i) => ({ nombre, visitantes: fila[`p${i}`] || 0 })) });
  }

  if (ruta === 'personas') return json({ personas: await listaPersonas(env, url) });

  if (ruta === 'persona') {
    const id = Number(url.searchParams.get('id'));
    if (!Number.isInteger(id) || id < 1) return empty(400);
    const persona = await db.prepare('SELECT * FROM personas WHERE id = ?').bind(id).first();
    if (!persona) return json({ error: 'No existe.' }, 404);
    const visitantes = await all('SELECT * FROM visitantes WHERE persona_id = ? ORDER BY primera_vez', id);
    const vids = visitantes.map((v) => v.vid);
    const marcas = vids.map(() => '?').join(', ') || "''";
    const sesiones = await all(`SELECT * FROM sesiones WHERE vid IN (${marcas}) ORDER BY inicio`, ...vids);
    const eventos = await all(
      `SELECT vid, sid, ts, pagina, evento, dato FROM eventos_web WHERE vid IN (${marcas}) ORDER BY ts LIMIT 3000`,
      ...vids
    );
    let recurso = null;
    if (persona.recurso_usuario_id) {
      recurso = {
        usuario: await db
          .prepare('SELECT id, codigo, profesion, servicios, ciudades, pais, precio, diferencial, creado FROM usuarios WHERE id = ?')
          .bind(persona.recurso_usuario_id)
          .first(),
        generaciones: await all(
          'SELECT tipo, formato, servicio, estado, costo_usd, creado FROM generaciones WHERE usuario_id = ? ORDER BY id',
          persona.recurso_usuario_id
        ),
      };
    }
    return json({
      persona: { ...persona, datos: JSON.parse(persona.datos || '{}') },
      visitantes,
      sesiones,
      eventos: eventos.map((e) => ({ ...e, dato: e.dato ? JSON.parse(e.dato) : null })),
      recurso,
    });
  }

  if (ruta === 'visitas') {
    const sesiones = await all(
      `SELECT s.*, v.pais, v.ciudad, v.dispositivo, v.so, v.navegador, v.isp, v.persona_id, v.visitas,
         v.first_source, v.first_campaign, v.first_content, p.nombre
       FROM sesiones s JOIN visitantes v ON v.vid = s.vid LEFT JOIN personas p ON p.id = v.persona_id
       WHERE s.inicio BETWEEN ? AND ?${porFuente(fuente, 's.vid').sql}
       ORDER BY s.inicio DESC LIMIT 100`,
      ...rango
    );
    const sids = sesiones.map((s) => s.sid);
    const eventos = sids.length
      ? await all(
          `SELECT sid, ts, pagina, evento, dato FROM eventos_web WHERE sid IN (${sids.map(() => '?').join(', ')})
           ORDER BY ts LIMIT 5000`,
          ...sids
        )
      : [];
    const porSesion = {};
    for (const e of eventos) (porSesion[e.sid] ??= []).push({ ...e, dato: e.dato ? JSON.parse(e.dato) : null });
    return json({ visitas: sesiones.map((s) => ({ ...s, eventos: porSesion[s.sid] || [] })) });
  }

  if (ruta === 'csv') {
    const filas = await listaPersonas(env, url);
    const cols = [
      ['id', 'ID'], ['nombre', 'Nombre'], ['telefono', 'Teléfono'], ['email', 'Email'], ['instagram', 'Instagram'],
      ['origen', 'Origen'], ['fuente', 'Fuente'], ['medio', 'Medio'], ['campana', 'Campaña'], ['conjunto', 'Conjunto'],
      ['anuncio', 'Anuncio'], ['entrada', 'Página de entrada'], ['lugar', 'Lugar'], ['equipo', 'Dispositivo'],
      ['video', 'Vio el video'], ['horario', 'Eligió horario'], ['agendo', 'Agendó'], ['quiz', 'Quiz'],
      ['quiz_wa', 'Abrió WhatsApp (quiz)'], ['genero', 'Generó en el recurso'], ['paginas', 'Páginas vistas'],
      ['temperatura', 'Temperatura'], ['cw', 'Código Cleo'], ['creado', 'Creado (UTC)'], ['ultima', 'Última actividad (UTC)'],
    ];
    // Celdas seguras para Excel: comillas y sin fórmulas.
    const celda = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lineas = [cols.map(([, t]) => celda(t)).join(';')];
    for (const r of filas) lineas.push(cols.map(([k]) => celda(k === 'temperatura' ? r.datos.temperatura : r[k])).join(';'));
    return new Response('﻿' + lineas.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="personas-gravity.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return empty(404);
}
