/**
 * Prompt de la OFERTA: el método de la oferta espejo de Gravity.
 *
 * El ejemplo es la oferta real de un cliente, resumida y anonimizada: sin
 * nombre, sin ciudad, sin pacientes, sin precios. Sirve para mostrarle al
 * modelo el nivel de profundidad y el tono, no para que copie el contenido.
 */
import { REGLAS, perfil } from './comun.js';

const EJEMPLO = `# Oferta de marca — Cirujano plástico (ejemplo anonimizado)

**Oferta madre:** Decisiones estéticas bien guiadas para verte natural.

El profesional ayuda a mujeres a tomar decisiones estéticas y quirúrgicas bien guiadas para verse más armónicas, naturales y seguras, sin caer en resultados exagerados ni decisiones improvisadas. No vende "procedimientos": vende una decisión estética seria, natural y bien indicada, con acompañamiento durante todo el proceso.

## 1. Quién
Mujeres de la ciudad y su radio regional que quieren mejorar una parte de su rostro o cuerpo con un resultado natural, seguro y bien indicado.
**Subavatar rinoplastia:** joven o adulta joven, muy visual y digital, arrastra hace años una incomodidad con su nariz. No busca una nariz "perfecta" sino una que no le robe atención a su cara. Cuando confía en el cirujano, decide rápido.
**Subavatar abdomen:** mujer adulta, profesional o emprendedora, postparto o con cambios de peso. Quiere recuperar una forma más armónica y volver a sentirse cómoda con su ropa.
**Subavatar toxina/relleno:** quiere verse más fresca, pero le aterra verse inflada o perder expresión. Decide más rápido: es el servicio de flujo de caja.
**El problema real:** no es "verse mejor". Es que tiene una incomodidad cotidiana y no sabe si corresponde tratarla, qué tiene sentido hacerse ni cómo decidir sin miedo a equivocarse.
**Qué intentó antes:** gimnasio, dietas, cremas, fajas, filtros, editar fotos, evitar ángulos, consultar precios sin avanzar.
**Qué piensa antes de consultar:** "No quiero quedar rara." "Quiero verme natural." "No quiero que me vendan cualquier cosa." "Si lo hago, quiero hacerlo bien."
**Deseo profundo:** no es cambiarse. Es reconciliarse con una parte de su imagen.

## 2. Resultado
**Gran promesa:** Mejorá eso que te incomoda con una decisión estética bien guiada, natural y segura.
**Por servicio:** "Armonizá tu nariz sin perder naturalidad." "Verte más fresca y descansada sin verte cambiada."
**Qué NO se promete:** resultados perfectos, recuperación igual para todas, "el cuerpo de antes", centímetros ni plazos rígidos.
**Estado final:** "Me veo mejor, me siento más segura y entiendo que tomé una decisión correcta para mi caso."

## 3. Plazo
Depende del procedimiento: la cirugía requiere valoración, coordinación, recuperación y controles; los inyectables son de decisión rápida. Se comunica como referencia general sujeta a valoración, nunca como plazo exacto.

## 4. Metodología (ruta médica clara, no "método inventado")
1. Entendemos qué querés mejorar. 2. Evaluamos si tiene sentido para tu caso. 3. Definimos el plan indicado (qué sí, qué no, tiempos, cuidados, expectativas). 4. Realizamos el tratamiento. 5. Acompañamos la evolución.

## 5. Factores de valor
Criterio médico antes que moda. Naturalidad como principio central ("mejorá sin dejar de reconocerte"). Decisión bien guiada. Autoridad quirúrgica aplicada también a la medicina estética. Continuidad: quien entra por un inyectable puede volver por una cirugía.
**Objeciones por servicio y cómo se responden:** miedo a quedar rara → naturalidad y casos; miedo a la recuperación → proceso explicado paso a paso; "todos hacen toxina, ¿por qué con vos?" → diseño con criterio, no aplicación.

## 6. Revertir el riesgo (sin garantías agresivas)
Valoración seria, indicación personalizada, expectativas realistas, controles, acompañamiento y la posibilidad de resolver dudas antes de avanzar. Mensaje: "Antes de avanzar, lo importante es entender si este procedimiento tiene sentido para tu caso."

## 7. Polarizar (contra expectativas, no contra personas)
No es para quien busca resultados exagerados, promesas mágicas o lo más barato sin importar el criterio. Sí es para quien quiere verse más armónica, seguir viéndose natural y decidir bien guiada.

## 8. Ultimátum
**Mejor escenario:** resuelve una incomodidad real con guía médica. **Peor escenario realista:** invierte una valoración y sale con claridad (si es candidata, qué conviene, qué no, cuánto cuesta). Si no avanza, sigue comparando, postergando y guardando publicaciones.

## 9. Empaquetado
No se vende "rinoplastia" o "toxina": se vende la posibilidad de mejorar una incomodidad con criterio médico, naturalidad y una decisión bien guiada. Empaquetado madre: "Decisiones estéticas bien guiadas para verte natural." Un empaquetado corto por servicio.

## 10. Distribución de contenido
50% servicio estrella (autoridad y conversión) · 25% servicio de flujo de caja · 15% servicio de ticket alto · 10% testimonios y autoridad. Con ideas de piezas para cada bloque.

## 11. Bio de Instagram
"Cirujano plástico | [Ciudad] · Rinoplastia, abdomen y medicina estética · Resultados naturales con criterio médico · Consultas por WhatsApp"`;

export function promptOferta(u) {
  return {
    instructions: `${REGLAS}

TU TAREA: escribir la OFERTA DE MARCA de este profesional con el método "Oferta Espejo" de Gravity: una oferta que vende el resultado que quiere su paciente, no el procedimiento.

Seguí exactamente esta estructura (con estos títulos):
# Tu oferta — [especialidad] en [ciudad]
**Oferta madre:** una frase de 5 a 10 palabras.
Un párrafo que explique qué vende de verdad.
## 1. Quién — avatar principal, subavatar por cada servicio importante (empezando por el servicio estrella), el problema real, qué intentaron antes, qué piensan antes de consultar, deseo profundo.
## 2. Resultado — gran promesa, promesa por servicio, qué NO prometer, estado final.
## 3. Plazo — cómo comunicar los tiempos de cada servicio sin prometer plazos exactos.
## 4. Metodología — la ruta de atención en 5 pasos simples.
## 5. Factores de valor — 4 o 5 diferenciales + las objeciones de cada servicio con cómo responderlas.
## 6. Revertir el riesgo — qué seguridad puede ofrecer sin garantías médicas.
## 7. Polarizar — para quién es y para quién no (contra expectativas, no contra personas).
## 8. Ultimátum — mejor y peor escenario realista para el paciente.
## 9. Empaquetado — empaquetado madre + uno corto por servicio.
## 10. Distribución de contenido para Instagram — porcentajes por servicio (el servicio estrella con más peso) y 3 ideas de video para cada bloque.
## 11. Bio de Instagram — 2 opciones.
## Tus próximos pasos para las primeras 10 ventas — 5 acciones concretas para esta semana.

Largo: completo pero sin relleno (unas 1.300 a 1.800 palabras). Usá su ciudad, su país y sus servicios reales en todo el texto.

EJEMPLO DE NIVEL (de otro profesional, anonimizado — NO copies servicios, frases ni datos):
${EJEMPLO}`,
    input: `${perfil(u)}

Escribí su oferta de marca.`,
  };
}
