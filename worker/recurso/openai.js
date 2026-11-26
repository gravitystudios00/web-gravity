/**
 * Llamada a OpenAI (API de Responses) con el texto en vivo.
 *
 * OpenAI manda eventos SSE. Algunos (response.created, response.completed)
 * traen la respuesta entera, instrucciones incluidas: no se reenvían tal cual.
 * Al navegador le llega un formato propio, una línea JSON por evento:
 *   {"d":"texto"}            un pedazo de texto
 *   {"fin":true, ...extra}   terminó bien
 *   {"error":"mensaje"}      falló
 *
 * Para gastar poco CPU, solo se hace JSON.parse de los eventos de texto (que
 * son chicos) y del evento final; el resto se descarta por su tipo.
 */

const API = 'https://api.openai.com/v1/responses';

/** USD por token de gpt-6.2-sol (entrada, entrada cacheada, salida). */
const PRECIO = { entrada: 2 / 1e6, cache: 0.1 / 1e6, salida: 10 / 1e6 };

export function costo(uso) {
  const cache = uso.cache || 0;
  return (uso.entrada - cache) * PRECIO.entrada + cache * PRECIO.cache + uso.salida * PRECIO.salida;
}

/**
 * Pide la generación y devuelve el Response para el navegador. Cuando termina
 * (bien o mal) llama a `alTerminar({ok, texto, uso})`, que guarda en la base y
 * devuelve datos extra para el evento final.
 */
export async function generarEnVivo(env, ctx, { instructions, input, effort, maxTokens }, alTerminar) {
  let res;
  try {
    // OPENAI_URL solo para pruebas locales (un OpenAI simulado).
    res = await fetch(env.OPENAI_URL || API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-6.2-sol',
        instructions,
        input,
        stream: true,
        store: false,
        reasoning: { effort },
        text: { verbosity: 'medium' },
        max_output_tokens: maxTokens,
      }),
    });
  } catch (err) {
    console.log(`OpenAI sin conexión: ${err}`);
    await alTerminar({ ok: false, texto: '', uso: null });
    return null;
  }

  if (!res.ok || !res.body) {
    console.log(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
    await alTerminar({ ok: false, texto: '', uso: null });
    return null;
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  let abierto = true;
  const enviar = async (obj) => {
    if (!abierto) return;
    try {
      await writer.write(enc.encode(JSON.stringify(obj) + '\n'));
    } catch {
      // La persona cerró la página: se sigue leyendo para guardar igual.
      abierto = false;
    }
  };

  const leer = async () => {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buffer = '';
    const partes = [];
    let uso = null;
    let ok = false;
    let error = '';

    const procesar = async (bloque) => {
      // Un evento SSE: líneas "event: x" y "data: {...}".
      const i = bloque.indexOf('data: ');
      if (i < 0) return;
      const data = bloque.slice(i + 6);
      // El tipo va al principio del JSON; se mira solo ese pedazo.
      const head = data.slice(0, 120);
      const es = (tipo) => head.includes(`"type":"${tipo}"`);
      if (es('response.output_text.delta')) {
        const ev = JSON.parse(data);
        partes.push(ev.delta);
        await enviar({ d: ev.delta });
      } else if (es('response.completed')) {
        const u = JSON.parse(data).response?.usage || {};
        uso = {
          entrada: u.input_tokens || 0,
          cache: u.input_tokens_details?.cached_tokens || 0,
          salida: u.output_tokens || 0,
        };
        ok = true;
      } else if (es('response.incomplete')) {
        // Se quedó sin tokens: lo que llegó sirve igual.
        const u = JSON.parse(data).response?.usage || {};
        uso = { entrada: u.input_tokens || 0, cache: u.input_tokens_details?.cached_tokens || 0, salida: u.output_tokens || 0 };
        ok = partes.length > 0;
      } else if (es('response.failed') || es('error')) {
        error = data.slice(0, 500);
      }
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        let corte;
        while ((corte = buffer.indexOf('\n\n')) >= 0) {
          const bloque = buffer.slice(0, corte);
          buffer = buffer.slice(corte + 2);
          await procesar(bloque);
        }
      }
      if (buffer.trim()) await procesar(buffer);
    } catch (err) {
      error = String(err);
    }

    const texto = partes.join('');
    if (error) console.log(`OpenAI falló a mitad: ${error}`);
    const extra = await alTerminar({ ok: ok && !!texto, texto, uso });
    if (ok && texto) await enviar({ fin: true, ...extra });
    else await enviar({ error: 'No pudimos terminar de generarlo. Probá de nuevo en un minuto.' });
    if (abierto) await writer.close().catch(() => {});
  };

  ctx.waitUntil(leer());

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
