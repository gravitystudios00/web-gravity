/**
 * Topes del recurso: lo que protege el gasto en OpenAI.
 *
 * Una generación "pendiente" ya cuenta: así nadie puede saltarse el tope
 * abriendo varias pestañas a la vez. Las que fallan no cuentan.
 */

/** Generaciones gratis por médico. */
export const TOPE_USUARIO = { oferta: 2, avatar: 2, guion: 6 };

/** Registros nuevos por IP por día. */
export const TOPE_IP = 3;

/** Gasto máximo en OpenAI por médico, en USD (env.RECURSO_TOPE_USD_USUARIO). */
export const TOPE_USD_USUARIO = 0.3;

/** Tope general por día (env.RECURSO_TOPE_DIARIO, con este valor por defecto). */
export const TOPE_DIARIO = 400;

/** Cuántas usó (ok + pendientes) por tipo. */
export async function usadas(db, usuarioId) {
  const { results } = await db
    .prepare(
      "SELECT tipo, COUNT(*) AS n FROM generaciones WHERE usuario_id = ? AND estado IN ('ok', 'pendiente') GROUP BY tipo"
    )
    .bind(usuarioId)
    .all();
  const out = { oferta: 0, avatar: 0, guion: 0 };
  for (const r of results) out[r.tipo] = r.n;
  return out;
}

export function restantes(u) {
  return {
    oferta: Math.max(0, TOPE_USUARIO.oferta - u.oferta),
    avatar: Math.max(0, TOPE_USUARIO.avatar - u.avatar),
    guion: Math.max(0, TOPE_USUARIO.guion - u.guion),
  };
}

/** ¿Se llegó al tope general del día? (en horario UTC) */
export async function topeDiarioAlcanzado(env) {
  const tope = Number(env.RECURSO_TOPE_DIARIO) || TOPE_DIARIO;
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM generaciones WHERE creado >= date('now') AND estado IN ('ok', 'pendiente')"
  ).first();
  return r.n >= tope;
}

/** ¿Esta IP ya registró demasiados usuarios hoy? */
export async function topeIpAlcanzado(db, ip) {
  if (!ip) return false;
  const r = await db
    .prepare("SELECT COUNT(*) AS n FROM usuarios WHERE ip = ? AND creado >= date('now')")
    .bind(ip)
    .first();
  return r.n >= TOPE_IP;
}

/**
 * Gasto por médico. Antes de cada generación se suma lo que ya gastó (las
 * terminadas, con su costo real) + lo que podría costar como máximo cada una
 * en curso + lo máximo que puede costar la nueva. Si eso pasa el tope, no se
 * genera: así el tope es duro, aunque abra varias pestañas.
 */
export async function gastoProyectado(db, usuarioId, costoMax) {
  const r = await db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN estado = 'ok' THEN costo_usd ELSE 0 END), 0) AS gastado,
              SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
       FROM generaciones WHERE usuario_id = ?`
    )
    .bind(usuarioId)
    .first();
  return { gastado: r.gastado, enCurso: (r.pendientes || 0) * costoMax };
}

export function topeUsd(env) {
  return Number(env.RECURSO_TOPE_USD_USUARIO) || TOPE_USD_USUARIO;
}
