/**
 * API de la página de administración (/admin/recurso). Pide el header
 * X-Admin-Key igual al secret ADMIN_KEY. Sin el secret cargado, no responde.
 *
 *   GET admin/resumen     gasto y cantidades (hoy, mes, total)
 *   GET admin/usuarios    lista (q= busca por nombre, teléfono, email o ciudad)
 *   GET admin/usuario     detalle de uno (id=): datos, textos generados y log
 *   GET admin/csv         la lista en CSV, para abrir en Excel
 */
import { empty, json } from '../util.js';

/** Comparación en tiempo constante, para no filtrar la clave por timing. */
export function mismaClave(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const LISTA = `
SELECT u.id, u.creado, u.nombre, u.telefono, u.email, u.profesion, u.servicios, u.ciudades, u.pais,
       u.precio, u.utm, u.codigo,
       (SELECT COUNT(*) FROM generaciones g WHERE g.usuario_id = u.id AND g.estado = 'ok' AND g.tipo = 'oferta') AS ofertas,
       (SELECT COUNT(*) FROM generaciones g WHERE g.usuario_id = u.id AND g.estado = 'ok' AND g.tipo = 'avatar') AS avatares,
       (SELECT COUNT(*) FROM generaciones g WHERE g.usuario_id = u.id AND g.estado = 'ok' AND g.tipo = 'guion') AS guiones,
       (SELECT COALESCE(SUM(costo_usd), 0) FROM generaciones g WHERE g.usuario_id = u.id) AS costo,
       (SELECT COUNT(*) FROM eventos e WHERE e.usuario_id = u.id AND e.evento = 'whatsapp_click') AS whatsapp
FROM usuarios u`;

function fila(r) {
  const servicios = JSON.parse(r.servicios || '[]');
  return {
    ...r,
    estrella: servicios.filter((s) => s.estrella).map((s) => s.nombre).join(', '),
    servicios: servicios.map((s) => s.nombre).join(', '),
    ciudades: JSON.parse(r.ciudades || '[]').join(', '),
    fuente: JSON.parse(r.utm || '{}').source || '',
    costo: Math.round(r.costo * 1000) / 1000,
  };
}

export async function admin(request, env, url, ruta) {
  if (request.method !== 'GET') return empty(405);
  if (!env.ADMIN_KEY || !mismaClave(request.headers.get('X-Admin-Key') || '', env.ADMIN_KEY))
    return json({ error: 'Clave incorrecta.' }, 401);

  if (ruta === 'resumen') {
    const q = (where) =>
      env.DB.prepare(
        `SELECT COUNT(*) AS generaciones, COALESCE(SUM(costo_usd), 0) AS costo FROM generaciones WHERE estado = 'ok' ${where}`
      ).first();
    const usuarios = (where) => env.DB.prepare(`SELECT COUNT(*) AS n FROM usuarios ${where}`).first('n');
    return json({
      hoy: { ...(await q("AND creado >= date('now')")), usuarios: await usuarios("WHERE creado >= date('now')") },
      mes: {
        ...(await q("AND creado >= date('now', 'start of month')")),
        usuarios: await usuarios("WHERE creado >= date('now', 'start of month')"),
      },
      total: { ...(await q('')), usuarios: await usuarios('') },
    });
  }

  if (ruta === 'usuarios' || ruta === 'csv') {
    const busqueda = (url.searchParams.get('q') || '').trim().slice(0, 80);
    const stmt = busqueda
      ? env.DB.prepare(
          `${LISTA} WHERE u.nombre LIKE ?1 OR u.telefono LIKE ?1 OR u.email LIKE ?1 OR u.ciudades LIKE ?1 ORDER BY u.id DESC LIMIT 500`
        ).bind(`%${busqueda}%`)
      : env.DB.prepare(`${LISTA} ORDER BY u.id DESC LIMIT 500`);
    const filas = (await stmt.all()).results.map(fila);
    if (ruta === 'usuarios') return json(filas);

    const cols = [
      ['creado', 'Fecha (UTC)'],
      ['nombre', 'Nombre'],
      ['telefono', 'WhatsApp'],
      ['email', 'Email'],
      ['profesion', 'Profesión'],
      ['estrella', 'Servicio estrella'],
      ['servicios', 'Servicios'],
      ['ciudades', 'Ciudades'],
      ['pais', 'País'],
      ['precio', 'Precio'],
      ['fuente', 'Fuente'],
      ['ofertas', 'Ofertas'],
      ['avatares', 'Avatares'],
      ['guiones', 'Guiones'],
      ['whatsapp', 'Clics WhatsApp'],
      ['costo', 'Costo USD'],
    ];
    // Celdas que empiezan con = + - @ se escapan: Excel las tomaría como fórmulas.
    const celda = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [cols.map((c) => celda(c[1])).join(';')]
      .concat(filas.map((f) => cols.map((c) => celda(f[c[0]])).join(';')))
      .join('\r\n');
    return new Response('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="recurso-medicos.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (ruta === 'usuario') {
    const id = Number(url.searchParams.get('id'));
    if (!Number.isInteger(id)) return empty(400);
    const u = await env.DB.prepare(`${LISTA} WHERE u.id = ?`).bind(id).first();
    if (!u) return empty(404);
    const gen = await env.DB.prepare(
      'SELECT id, tipo, formato, servicio, texto, estado, tokens_entrada, tokens_cache, tokens_salida, costo_usd, creado FROM generaciones WHERE usuario_id = ? ORDER BY id'
    )
      .bind(id)
      .all();
    const ev = await env.DB.prepare('SELECT evento, dato, creado FROM eventos WHERE usuario_id = ? ORDER BY id')
      .bind(id)
      .all();
    const extra = await env.DB.prepare('SELECT diferencial, servicios, fbc, pais_ip FROM usuarios WHERE id = ?')
      .bind(id)
      .first();
    return json({
      usuario: { ...fila(u), diferencial: extra.diferencial, serviciosDetalle: JSON.parse(extra.servicios || '[]'), pais_ip: extra.pais_ip },
      generaciones: gen.results,
      eventos: ev.results,
    });
  }

  return empty(404);
}
