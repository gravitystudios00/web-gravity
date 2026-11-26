/**
 * Prompt de los GUIONES, con la estructura de Gravity: HOOK, PROBLEMA,
 * SOLUCIÓN, PRUEBA SOCIAL y CTA. Los ejemplos son guiones reales de una
 * clienta (odontóloga), sin su nombre.
 */
import { REGLAS, perfil } from './comun.js';

export const FORMATOS = {
  talking_head: 'Talking head',
  selfie: 'Selfie',
  comentario: 'Respondiendo al comentario',
  testimonio: 'Testimonio',
};

const GUIA = `LOS 4 FORMATOS

## Talking head
El profesional habla a cámara en el consultorio, con buena luz, cámara fija. 45 a 75 segundos. Estructura fija:
### HOOK — 1 o 2 frases que frenan el scroll: una duda, un miedo o una creencia del paciente.
### PROBLEMA — por qué le pasa, sin culparlo; la creencia equivocada que tiene.
### SOLUCIÓN — qué hay que mirar o hacer, con criterio médico, sin prometer resultados.
### PRUEBA SOCIAL — cómo lo resuelve el profesional en la valoración o qué notan sus pacientes (sin inventar casos con nombre ni cifras).
### CTA — "Comentá [PALABRA] y te cuento por DM…" con una palabra clave en mayúsculas.

Ejemplo (odontología, anonimizado):
### HOOK
Tus dientes pueden quedar alineados y aun así, tu sonrisa puede no verse como esperabas…
### PROBLEMA
Después de retirar los brackets, algunas personas notan dientes pequeños, bordes irregulares, diferencias de forma o un color que aún no les convence. Eso no significa que la ortodoncia haya fallado: corrige principalmente la posición de los dientes y la mordida, no todos los detalles estéticos.
### SOLUCIÓN
Primero hay que identificar qué sigue generando la inconformidad. Si el problema está en la posición o la mordida, la resina y la cerámica no deberían ocultarlo. Pero si está en la forma, el color, los bordes o la proporción, sí pueden evaluarse. La idea es complementar lo que la ortodoncia ya logró, interviniendo solo donde hace falta.
### PRUEBA SOCIAL
En valoración, primero diferencio si la inquietud es de posición o estética. Luego defino si conviene un cambio puntual, un diseño más amplio o simplemente conservar el resultado. Porque terminar ortodoncia no significa que automáticamente necesites carillas.
### CTA
Si terminaste ortodoncia y todavía hay algo de tu sonrisa que no te convence, comenta **"YO"** y te cuento por DM qué deberías tener en cuenta.

## Selfie
Grabado con el celular en la mano, más íntimo y espontáneo, como una historia. 30 a 60 segundos. Misma estructura, más conversacional. El HOOK suele ser una pregunta que le hacen los pacientes ("Esta es una pregunta bastante común que me hacen").

Ejemplo (odontología, anonimizado):
### HOOK
Después de ponerme resina, ¿voy a tener que vivir cuidando todo lo que bebo o como? Esta es una pregunta bastante común que me hacen.
### PROBLEMA
Y es totalmente entendible. Nadie quiere invertir en una sonrisa bonita para después sentir miedo cada vez que toma café o sale a comer. El problema es que muchas personas creen que solo hay dos posibilidades: que la resina no requiere ningún cuidado o que van a vivir limitadas para siempre.
### SOLUCIÓN
La realidad está en un punto intermedio. La resina sí necesita cuidados y mantenimiento, pero el proceso empieza explicándote qué puedes hacer con normalidad, qué hábitos conviene revisar y qué situaciones aumentan el riesgo de pigmentación.
### PRUEBA SOCIAL
Cuando esta conversación se tiene desde el principio, se nota mucho el alivio: mis pacientes dejan de imaginar restricciones y empiezan a disfrutar su sonrisa con información real.
### CTA
Si estás pensando en un diseño en resina y esta también es una de tus dudas, comenta **RESINA** y te paso un documento de cómo sería el proceso.

## Respondiendo al comentario
En pantalla aparece el comentario de un paciente (como sticker de Instagram) y el profesional responde a cámara. Corto: 20 a 40 segundos. Estructura:
### COMENTARIO EN PANTALLA — la pregunta tal como la escribiría un paciente real (informal, a veces con miedo o duda).
### RESPUESTA — 4 a 7 frases: respuesta directa, el matiz que nadie explica y por qué importa la valoración.
### CTA — corto, con palabra clave.

Ejemplo (odontología, anonimizado):
### COMENTARIO EN PANTALLA
¿Qué debería saber un paciente antes de querer cambiar su sonrisa?
### RESPUESTA
Debería saber que, aunque sabe qué quiere cambiar, muchas veces no sabe qué debe conservar. Ahí es donde entra el acompañamiento y la guía profesional, para que tengamos el mejor resultado.

## Testimonio
Video donde habla un paciente real. El profesional NO lo actúa: recibe una guía para grabarlo. Estructura:
### ANTES DE GRABAR — a qué paciente elegir, cómo pedirle permiso y cómo encuadrar.
### PREGUNTAS PARA EL PACIENTE (en este orden) — 6 a 8 preguntas abiertas: qué le pasaba antes, qué miedo tenía, por qué eligió a este profesional, cómo fue el proceso, cómo se siente hoy, qué le diría a alguien que está dudando.
### CÓMO EDITARLO — qué partes usar como gancho, dónde poner imágenes de apoyo (consultorio, proceso, resultado solo con autorización) y el texto del CTA final.`;

export function promptGuion(u, { oferta, avatar, formato, servicio, previos }) {
  return {
    instructions: `${REGLAS}

TU TAREA: escribir UN guion de video para Instagram de este profesional, listo para grabar, con la estructura de Gravity.

El guion tiene que:
- Hablarle al paciente ideal del avatar (sus miedos, sus creencias, sus palabras).
- Bajar la oferta del profesional a una idea concreta de un solo video, sobre el servicio indicado.
- Sonar dicho, no leído: frases cortas, naturales, como habla un profesional de verdad.
- Ser distinto de los guiones que ya generó (te paso sus títulos).

Formato de salida:
# [Título del video: la idea en una línea]
**Formato:** … · **Servicio:** … · **Duración:** …
Después, las secciones exactas del formato pedido (ver guía abajo).
Al final:
**Texto en pantalla sugerido:** 1 línea para la portada del reel.
**Tip de grabación:** 1 consejo práctico para grabarlo bien.

${GUIA}`,
    input: `${perfil(u)}

OFERTA DEL PROFESIONAL (resumen para inspirarte):
${recortar(oferta, 6000)}

PACIENTE IDEAL (avatar):
${recortar(avatar, 5000)}

FORMATO PEDIDO: ${FORMATOS[formato]}
SERVICIO DEL VIDEO: ${servicio}
GUIONES QUE YA GENERÓ (no repitas la idea): ${previos.length ? previos.join(' | ') : 'ninguno'}

Escribí el guion.`,
  };
}

/** Corta textos largos para no pagar de más por la entrada. */
function recortar(t, max) {
  if (!t) return '(todavía no lo generó)';
  return t.length > max ? `${t.slice(0, max)}\n[…]` : t;
}
