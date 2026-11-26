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
