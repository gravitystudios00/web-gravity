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
 * @param {string} [e.name]     nombre completo (o solo el nombre)
 * @param {string} [e.lastName] apellido, si viene aparte
 * @param {string} [e.phone]    +<dígitos>
 * @param {string} [e.email]
 * @param {string} [e.externalId] id propio del visitante cuando no hay teléfono
 *                                (por ejemplo el código cw del bot)
 * @param {string} [e.fbc]
 * @param {object} [e.custom]   custom_data extra
 *
 * Los eventos sin datos personales (VideoCompleto, EligioHorario) igual
 * sirven: Meta reconoce a la persona por las cookies del pixel (_fbp, _fbc),
 * la IP y el navegador.
 */
export async function metaEvent(env, ctx, request, e) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) {
    console.log(`CAPI sin configurar (${e.eventName}): falta META_PIXEL_ID o META_CAPI_TOKEN`);
    return;
  }

  const country = request.cf?.country?.toLowerCase();
  const cookies = readCookies(request);
  const fbc = text(e.fbc, 600) || cookies._fbc || '';
  const fbp = cookies._fbp || '';

  const user_data = {
    client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
    client_user_agent: request.headers.get('User-Agent') || undefined,
  };
  if (e.phone) {
    const digits = e.phone.slice(1);
    // En Argentina WhatsApp usa 54 9 + número; si lo escribieron sin el 9, se
    // mandan las dos formas para que Meta encuentre a la persona.
    const phones = [digits];
    if (/^54(?!9)\d{10}$/.test(digits)) phones.push(`549${digits.slice(2)}`);
    user_data.ph = await Promise.all(phones.map(sha256));
    user_data.external_id = [await sha256(digits)];
  } else if (e.externalId) {
    user_data.external_id = [await sha256(e.externalId)];
  }
  const parts = (e.name || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length) user_data.fn = [await sha256(parts[0])];
  const last = (e.lastName || (parts.length > 1 ? parts[parts.length - 1] : '')).trim().toLowerCase();
  if (last) user_data.ln = [await sha256(last)];
  if (e.email) user_data.em = [await sha256(e.email.trim().toLowerCase())];
  if (country) user_data.country = [await sha256(country)];
  if (/^fb\.1\.\d+\.\S+$/.test(fbc)) user_data.fbc = fbc;
  if (/^fb\.\d\.\d+\.\d+$/.test(fbp)) user_data.fbp = fbp;

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

/** Cookies del pedido como objeto (las del pixel: _fbp y _fbc). */
function readCookies(request) {
  const out = {};
  for (const c of (request.headers.get('Cookie') || '').split(/;\s*/)) {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i)] = c.slice(i + 1);
  }
  return out;
}

/** La URL que manda el navegador, solo si es de este sitio; si no, `fallback`. */
export function sitePageUrl(raw, url, fallback) {
  try {
    const u = new URL(text(raw, 2000));
    if (u.host === url.host) return u.href;
  } catch {}
  return `${url.origin}${fallback}`;
}
