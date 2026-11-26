/**
 * API de conversiones de Meta.
 *
 * Los datos personales van cifrados con SHA-256, como pide Meta; fbc, IP y
 * navegador van tal cual. Necesita META_PIXEL_ID (vars de wrangler.jsonc) y el
 * secret META_CAPI_TOKEN; sin alguno de los dos no manda nada.
 *
 * Para probar sin ensuciar las estadísticas: cargar META_TEST_EVENT_CODE en
 * las vars de wrangler.jsonc con el código de "Probar eventos" del
 * Administrador de eventos, y sacarlo después.
 */
import { sha256, text } from './util.js';

const GRAPH = 'https://graph.facebook.com/v26.0';

/**
 * Manda un evento a Meta en segundo plano (ctx.waitUntil). No devuelve nada:
 * si falla, queda en los logs del Worker.
 *
 * @param {object} e
 * @param {string} e.eventName  Lead, Contact, CompleteRegistration…
 * @param {string} e.eventId
 * @param {string} e.pageUrl    URL de la página (ya validada que es del sitio)
 * @param {string} e.name
 * @param {string} e.phone      +<dígitos>
 * @param {string} [e.email]
 * @param {string} [e.fbc]
 * @param {object} [e.custom]   custom_data extra
 */
export async function metaEvent(env, ctx, request, e) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) {
    console.log(`CAPI sin configurar (${e.eventName}): falta META_PIXEL_ID o META_CAPI_TOKEN`);
    return;
  }

  const digits = e.phone.slice(1);
  // En Argentina WhatsApp usa 54 9 + número; si lo escribieron sin el 9, se
  // mandan las dos formas para que Meta encuentre a la persona.
  const phones = [digits];
  if (/^54(?!9)\d{10}$/.test(digits)) phones.push(`549${digits.slice(2)}`);

  const first = e.name.toLowerCase().split(/\s+/)[0];
  const country = request.cf?.country?.toLowerCase();
  const fbc = text(e.fbc, 600);

  const user_data = {
    ph: await Promise.all(phones.map(sha256)),
    fn: [await sha256(first)],
    external_id: [await sha256(digits)],
    client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
    client_user_agent: request.headers.get('User-Agent') || undefined,
  };
  if (e.email) user_data.em = [await sha256(e.email.trim().toLowerCase())];
  if (country) user_data.country = [await sha256(country)];
  if (/^fb\.1\.\d+\.\S+$/.test(fbc)) user_data.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: 'website',
        event_source_url: e.pageUrl,
        user_data,
        custom_data: e.custom || {},
      },
    ],
  };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  ctx.waitUntil(
    (async () => {
      try {
        const res = await fetch(
          `${GRAPH}/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );
        if (!res.ok) console.log(`CAPI ${res.status} (${e.eventName}): ${await res.text()}`);
      } catch (err) {
        console.log(`CAPI error (${e.eventName}): ${err}`);
      }
    })()
  );
}

/** La URL que manda el navegador, solo si es de este sitio; si no, `fallback`. */
export function sitePageUrl(raw, url, fallback) {
  try {
    const u = new URL(text(raw, 2000));
    if (u.host === url.host) return u.href;
  } catch {}
  return `${url.origin}${fallback}`;
}
