/**
 * Quiz funnel de /plan: "Plan de Captación personalizado para tu clínica".
 *
 * Todo el texto de la página vive acá. Cada opción tiene:
 *   - label: lo que ve la persona en el botón.
 *   - phrase: el pedazo que aporta al mensaje de WhatsApp.
 *   - key: un código corto que viaja al lead (n8n) y, en el cuello de botella,
 *     también en el mensaje: con eso Cleo elige qué plan mandar.
 *
 * Si cambiás una `key` del cuello de botella o del filtro, avisale al chat de
 * Cleo: las lee del mensaje (ver docs/quiz-plan-cleo.md).
 */

export type QuizOption = { label: string; phrase: string; key: string };
export type QuizStep = {
  /** Nombre del campo en el lead que se guarda en n8n. */
  id: 'clinica' | 'consultas' | 'origen' | 'cuello' | 'responde' | 'momento';
  question: string;
  /** Texto chico arriba de la pregunta (solo en el filtro final). */
  kicker?: string;
  /** Aclaración debajo de la pregunta. */
  hint?: string;
  options: QuizOption[];
};

export const quiz = {
  title: 'Recibí gratis tu Plan de Captación para tu clínica · Gravity Studios',
  description:
    'Respondé 6 preguntas y recibí por WhatsApp un plan personalizado para llenar la agenda de tu clínica con pacientes calificados.',

  /** `accent: true` lo pinta de ámbar, igual que los headlines de la home. */
  headline: [
    { text: 'Recibí gratis tu ' },
    { text: 'Plan personalizado', accent: true },
    { text: ' para llenar la agenda de tu clínica con ' },
    { text: 'pacientes calificados', accent: true },
    { text: '… en menos de 60 segundos' },
  ],

  proof: 'Especialistas que ya llenan su agenda con nuestro sistema',

  bullets: [
    'Tu plan por WhatsApp en menos de 60 segundos',
    'Hecho para clínicas estéticas, no una plantilla genérica',
    '100% gratis, sin compromiso',
  ],

  steps: [
    {
      id: 'clinica',
      question: '¿Qué tipo de clínica tenés?',
      options: [
        { label: 'Medicina estética', phrase: 'medicina estética', key: 'estetica' },
        { label: 'Odontología estética', phrase: 'odontología estética', key: 'odontologia' },
        { label: 'Cirugía plástica', phrase: 'cirugía plástica', key: 'cirugia' },
        { label: 'Dermatología', phrase: 'dermatología', key: 'dermatologia' },
        { label: 'Otra especialidad', phrase: 'otra especialidad', key: 'otra' },
      ],
    },
    {
      id: 'consultas',
      question: '¿Cuántas consultas o valoraciones agendás por semana?',
      options: [
        { label: 'Menos de 5', phrase: 'menos de 5', key: '0-5' },
        { label: 'Entre 5 y 15', phrase: 'entre 5 y 15', key: '5-15' },
        { label: 'Entre 15 y 30', phrase: 'entre 15 y 30', key: '15-30' },
        { label: 'Más de 30', phrase: 'más de 30', key: '30+' },
      ],
    },
    {
      id: 'origen',
      question: '¿De dónde llegan hoy la mayoría de tus pacientes?',
      options: [
        { label: 'Boca en boca y referidos', phrase: 'la mayoría de los pacientes llega por boca en boca', key: 'boca' },
        { label: 'Instagram orgánico', phrase: 'la mayoría de los pacientes llega por Instagram orgánico', key: 'instagram' },
        { label: 'Anuncios pagos', phrase: 'la mayoría de los pacientes llega por anuncios', key: 'anuncios' },
        { label: 'No lo tengo claro', phrase: 'no tengo claro de dónde llega la mayoría de los pacientes', key: 'nose' },
      ],
    },
    {
      id: 'cuello',
      question: '¿Cuál es tu principal cuello de botella hoy?',
      options: [
        {
          label: 'No llegan suficientes consultas',
          phrase: 'no llegan suficientes consultas',
          key: 'consultas',
        },
        {
          label: 'Preguntan el precio y desaparecen',
          phrase: 'llegan consultas pero preguntan el precio y desaparecen',
          key: 'curiosos',
        },
        {
          label: 'No damos abasto para responder rápido',
          phrase: 'no damos abasto para responder rápido',
          key: 'respuesta',
        },
        {
          label: 'No tengo tiempo para grabar contenido',
          phrase: 'no tengo tiempo para grabar contenido',
          key: 'contenido',
        },
        {
          label: 'Agendan pero no vienen',
          phrase: 'agendan pero después no vienen',
          key: 'ausencias',
        },
      ],
    },
    {
      id: 'responde',
      question: '¿Quién responde hoy los mensajes de WhatsApp e Instagram?',
      options: [
        { label: 'Yo', phrase: 'los mensajes los respondo yo', key: 'yo' },
        { label: 'Una secretaria o asistente', phrase: 'los mensajes los responde una asistente', key: 'asistente' },
        { label: 'Nadie de forma fija', phrase: 'los mensajes no los responde nadie de forma fija', key: 'nadie' },
        { label: 'Un bot', phrase: 'los mensajes los responde un bot', key: 'bot' },
      ],
    },
    {
      id: 'momento',
      kicker: 'Última pregunta antes de enviarte tu plan',
      question: '¿En qué punto estás hoy?',
      hint: 'Este plan es para especialistas que quieren llenar su agenda en serio.',
      options: [
        {
          label: 'Quiero llenar mi agenda en los próximos 90 días',
          phrase: '',
          key: '1',
        },
        { label: 'Solo estoy curioseando', phrase: '', key: '2' },
      ],
    },
  ] satisfies QuizStep[],

  form: {
    question: '¿A dónde te enviamos tu plan?',
    name: 'Tu nombre',
    phone: 'Tu WhatsApp',
    instagram: 'El @ de Instagram de tu clínica',
    submit: 'Recibir mi plan',
    consent:
      'Al enviar tus datos aceptás que Gravity Studios te contacte por WhatsApp para enviarte tu plan. No compartimos tu información con nadie.',
  },

  /** Prefijos de los países donde trabajamos. "Otro" deja escribir el número entero. */
  countries: [
    { code: '54', label: 'Argentina', flag: '🇦🇷' },
    { code: '57', label: 'Colombia', flag: '🇨🇴' },
    { code: '52', label: 'México', flag: '🇲🇽' },
    { code: '34', label: 'España', flag: '🇪🇸' },
    { code: '56', label: 'Chile', flag: '🇨🇱' },
    { code: '598', label: 'Uruguay', flag: '🇺🇾' },
    { code: '51', label: 'Perú', flag: '🇵🇪' },
    { code: '593', label: 'Ecuador', flag: '🇪🇨' },
    { code: '595', label: 'Paraguay', flag: '🇵🇾' },
    { code: '591', label: 'Bolivia', flag: '🇧🇴' },
    { code: '506', label: 'Costa Rica', flag: '🇨🇷' },
    { code: '1', label: 'EE. UU. / Rep. Dom.', flag: '🇺🇸' },
    { code: '', label: 'Otro (con código)', flag: '🌎' },
  ],

  final: {
    kicker: 'Solo falta un paso',
    title: 'Abrí WhatsApp',
    lead: 'Para recibir tu plan personalizado, abrí WhatsApp. El mensaje ya está escrito: solo tocá enviar.',
    button: 'Recibir mi plan por WhatsApp',
    countdown: 8,
    preview: 'Vista previa del mensaje',
    previewNote: 'Solamente tocá enviar en WhatsApp',
  },
};

/**
 * Arma el mensaje de WhatsApp. Lo usan el navegador (para el link) y la
 * documentación de Cleo (para los ejemplos), así que vive acá y no en el
 * componente.
 *
 * La última línea es la referencia que lee Cleo: PG-<cuello>-<momento>.
 * Momento 1 = quiere llenar la agenda en 90 días; 2 = curioseando.
 */
export function quizMessage(
  name: string,
  instagram: string,
  answers: Record<QuizStep['id'], string>
) {
  const phrase = (id: QuizStep['id']) =>
    quiz.steps.find((s) => s.id === id)?.options.find((o) => o.key === answers[id])?.phrase ?? '';

  const first = name.trim().split(/\s+/)[0];
  const ig = instagram.trim().replace(/^@?/, '@');
  return [
    `Hola, quiero recibir mi plan personalizado para mi clínica.`,
    `Soy ${first}${ig.length > 1 ? ` (${ig})` : ''} y tengo una clínica de ${phrase('clinica')}. ` +
      `Hoy agendamos ${phrase('consultas')} consultas por semana, ${phrase('origen')}, ` +
      `${phrase('responde')} y mi principal cuello de botella es que ${phrase('cuello')}.`,
    ``,
    `Ref: PG-${answers.cuello}-${answers.momento}`,
  ].join('\n');
}
