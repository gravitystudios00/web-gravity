/**
 * Prompt del AVATAR DE NICHO: el paciente ideal, con el mismo cuestionario que
 * usa Gravity con sus clientes. El ejemplo es un avatar real resumido y
 * anonimizado (sin nombre, sin ciudad, sin cifras del cliente).
 */
import { REGLAS, perfil } from './comun.js';

const EJEMPLO = `# Avatar principal (ejemplo anonimizado, cirujano plástico)
**Mujer postparto de 32 a 40 años, profesional o emprendedora, con 1 o 2 hijos, de ingreso medio-alto, que vive en la ciudad o su radio regional, ya intentó recuperar su abdomen por medios no quirúrgicos, no quiere verse "operada" sino volver a sentirse ella, y no posterga por falta de deseo sino por precio, logística, familia y miedo a equivocarse.**

## Ocupación
No es "ama de casa" ni "paciente estética genérica": es una mujer profesional o emprendedora organizada, madre, con poder de decisión en la economía del hogar, que priorizó trabajo, maternidad y familia antes que su cuerpo. Médica, abogada, contadora, dueña de un comercio, gerente media.

## Cómo pasa su semana
Trabajo, hijos, WhatsApp constante, agenda fragmentada, culpa por no llegar a todo. No vive en ocio: vive administrando energía. Su semana se siente llena pero poco propia.

## Qué logró
Ya logró bastante: carrera, pareja, hijos, cierta estabilidad. Su frustración no es "mi vida está mal", es "mi vida avanzó, pero mi cuerpo quedó atrás".

## Dónde se informa
Se informa por Instagram y WhatsApp, valida en Google, profundiza en YouTube y confirma con la recomendación de una amiga. Para una cirugía el orden es: me apareció → lo seguí → vi resultados → pregunté a alguien → recién ahí consulté.

## Ingresos (estimación orientativa)
No es la asalariada promedio pagando de contado: es un hogar de doble ingreso profesional, una dueña de pyme o alguien con ahorro. Debajo de cierto nivel aumenta mucho la postergación y la objeción económica.

## Preocupaciones
Plata, sí, pero más como "cómo lo ordeno" que como "no puedo". Tiempo de recuperación, quién cuida a los hijos, cómo impacta en el trabajo, si se va a ver natural, si después se va a arrepentir.

## Cómo hay que venderle
Nada de tono gritón o marketinero. Autoridad, contención, claridad, lenguaje clínico pero humano. Quiere privacidad, no sentirse juzgada y saber cómo es el "después".

## Historia
Estudió, formó familia, atravesó embarazos, priorizó a todos, probó dieta, gimnasio y fajas, y vio que hay algo que ya no depende de la voluntad. Siente: "no es que no me cuidé; es que mi cuerpo cambió y ya no volvió". No reniega de ser madre: reniega de haber quedado última en su propia lista.

## Pensamientos justo antes de comprar
"No quiero seguir pateándolo." "Ya hice mucho por todos; ahora me toca a mí." "Quiero verme bien, pero sin hacer una locura." "Si lo hago, quiero hacerlo con alguien serio."

## La gota que rebalsa el vaso
El hijo creció, terminó la lactancia, se acerca el verano o un evento, ve el resultado de otra mamá, la pareja le dice "hacelo", cobra el aguinaldo.

# Avatar secundario
Mujer de 19 a 29 años, muy digital y visual, que arrastra desde hace años una incomodidad con su nariz, compara resultados y, cuando confía en el cirujano, decide rápido.`;

export function promptAvatar(u, oferta) {
  return {
    instructions: `${REGLAS}

TU TAREA: escribir el AVATAR DE NICHO (el paciente ideal) de este profesional, para que sepa exactamente a quién le habla en cada video y anuncio.

Basate en sus datos y en la oferta que ya le armamos. El avatar principal es el paciente del SERVICIO ESTRELLA. Si tiene un segundo servicio fuerte, agregá un avatar secundario más corto.

Seguí exactamente esta estructura:
# Tu paciente ideal
Una síntesis en negrita, de 2 o 3 líneas, como en el ejemplo.
## Ocupación o título descriptivo
## Dónde vive (ciudades y zonas donde atiende, y en qué cambia cada una si son varias)
## Edad (rango y centro)
## Qué logró en su vida
## Cómo pasa su semana
## Qué hace fuera del trabajo
## Dónde se informa (y el recorrido hasta consultar)
## Cuánto gana (estimación orientativa en la moneda del país, aclarada como tal; sin inventar estadísticas oficiales)
## Cómo se siente con su trabajo
## Sus preocupaciones
## Cómo hay que venderle
## Su historia: qué pasó para llegar hasta acá
## Evento clave que la/lo hace interesarse ahora
## Familia y cómo influye en la decisión
## Qué le importa de verdad del tratamiento
## Pensamientos justo antes de comprar (frases en primera persona, entre comillas)
## La gota que rebalsa el vaso (qué dispara la decisión)
# Avatar secundario (si corresponde)
## Cómo usar este avatar en tus videos — 5 ganchos de video escritos para este paciente.

Largo: unas 1.000 a 1.400 palabras. Que se sienta escrito para SU especialidad, SU ciudad y SU servicio estrella.

EJEMPLO DE NIVEL (de otro profesional, anonimizado — NO copies datos ni frases):
${EJEMPLO}`,
    input: `${perfil(u)}

OFERTA QUE YA LE ARMAMOS:
${oferta}

Escribí su avatar de nicho.`,
  };
}
