/** Utilidades compartidas por las rutas del Worker. */

/** Texto recortado; cualquier otra cosa → ''. */
export const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Respuesta vacía con un código. */
export const empty = (status) => new Response(null, { status });

/** JSON con no-store: nada de lo que devuelve la API se cachea. */
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Solo pedidos desde el propio sitio (o sin Origin, como curl). */
export function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

/** Lee el cuerpo como JSON con un tope de tamaño. Devuelve null si no sirve. */
export async function readJson(request, max = 4000) {
  const raw = await request.text();
  if (raw.length > max) return null;
  try {
    const body = JSON.parse(raw);
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

export async function sha256(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Workflow "Gravity · Leads quiz" de n8n: recibe los leads del quiz y del recurso. */
export const N8N_LEADS = 'https://n8n.gravity-studios.com/webhook/quiz-lead-36a69739';

/** Teléfono en formato +<8 a 15 dígitos>. */
export const PHONE_RE = /^\+\d{8,15}$/;
