/**
 * Lee una reserva de Calendly para mandarla a Meta con los datos de la persona.
 *
 * Calendly está en el plan gratis (sin webhooks), pero el calendario embebido
 * le avisa a la página cuando alguien confirma, con la URL de la reserva
 * ("invitee"). El Worker la consulta con el token personal de Calendly (secret
 * CALENDLY_TOKEN, el mismo que usa n8n) y saca nombre, email y teléfono.
 *
 * Como la reserva se lee en la cuenta de Gravity, nadie puede inventar una:
 * si la URL no es de una reserva real, reciente y activa, no se manda nada.
 */
import { PHONE_RE } from './util.js';

const INVITEE_RE = /^https:\/\/api\.calendly\.com\/scheduled_events\/[\w-]{10,64}\/invitees\/[\w-]{10,64}$/;
// Una reserva vieja no cuenta como conversión de esta visita.
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

/**
 * @returns {Promise<null | { name: string, lastName: string, email: string, phone: string }>}
 */
export async function readInvitee(env, uri) {
  if (!env.CALENDLY_TOKEN || typeof uri !== 'string' || !INVITEE_RE.test(uri)) return null;
  let res;
  try {
    res = await fetch(uri, { headers: { Authorization: `Bearer ${env.CALENDLY_TOKEN}` } });
  } catch (err) {
    console.log(`Calendly error: ${err}`);
    return null;
  }
  if (!res.ok) {
    console.log(`Calendly ${res.status} al leer la reserva`);
    return null;
  }
  const r = (await res.json())?.resource;
  if (!r || r.status !== 'active') return null;
  if (Date.now() - Date.parse(r.created_at) > MAX_AGE_MS) return null;

  // El teléfono es una pregunta del formulario ("¿Cual es tu numero con
  // WhatsApp?"); si no, el número de recordatorio por SMS.
  const qa = (r.questions_and_answers || []).find((q) =>
    /whats|tel[eé]fono|n[uú]mero|celular|phone/i.test(q.question || '')
  );
  const phone = normalizePhone(qa?.answer || r.text_reminder_number || '');

  return {
    name: r.first_name || r.name || '',
    lastName: r.last_name || '',
    email: r.email || '',
    phone,
  };
}

/** "+54 261 300-2052" → "+542613002052". Sin código de país no se adivina. */
function normalizePhone(raw) {
  const s = String(raw).trim();
  if (!s.startsWith('+')) return '';
  const p = `+${s.replace(/\D/g, '')}`;
  return PHONE_RE.test(p) ? p : '';
}
