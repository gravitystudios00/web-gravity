/**
 * Configuración central de la landing.
 * Todo lo editable sin tocar componentes vive acá.
 */

export const site = {
  title: 'Gravity Studios — Sistema de captación de pacientes con IA',
  description:
    'Instalamos un sistema con IA que capta, filtra y agenda pacientes para tu clínica estética en menos de 90 días. Sin que grabes más contenido.',
  url: 'https://gravity-studios.com',
  ogImage: '/og.jpg',
  locale: 'es_AR',
};

/* ---------------------------------------------------------------------------
 * Analítica
 * ------------------------------------------------------------------------- */
export const analytics = {
  ga4: 'G-4K6QNGC64M',
  /** TODO: pegar el Meta Pixel ID. Hoy el sitio en Framer NO tiene pixel. */
  metaPixel: '' as string,
};

/* ---------------------------------------------------------------------------
 * VSL — cambiar el id cuando Juan pase el video nuevo
 * ------------------------------------------------------------------------- */
export const vsl = {
  /** ID de YouTube. El actual es el que está hoy en producción. */
  youtubeId: 'ygHrlIzxOt0',
  /** Poster propio (opcional). Si queda vacío usa el thumbnail de YouTube. */
  poster: '',
  kicker: 'En 4 minutos te explicamos nuestro método',
};

/* ---------------------------------------------------------------------------
 * WhatsApp
 * `phone` va en formato internacional, solo dígitos, sin + ni guiones.
 * (El sitio actual tiene el de Tomás mal escrito: 54295474-8078)
 * ------------------------------------------------------------------------- */
export const whatsapp = {
  juan: { name: 'Juan', phone: '543482504982' },
  tomas: { name: 'Tomás', phone: '542954748078' },
  /** A quién van los botones de la landing. */
  primary: 'juan' as 'juan' | 'tomas',
};

/**
 * Arma el link de WhatsApp con mensaje pre-cargado.
 * El `source` sirve para saber desde qué sección abrió la conversación.
 */
export function waLink(source: string, who: 'juan' | 'tomas' = whatsapp.primary) {
  const phone = whatsapp[who].phone;
  const text = `Hola! Vengo de la web (${source}) y quiero hacer la auditoría para mi clínica.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/* ---------------------------------------------------------------------------
 * Calendly
 * ------------------------------------------------------------------------- */
export const calendly = {
  url: 'https://calendly.com/d/cyfg-zrj-grb/llamada-de-consultoria-con-gravity-studios-clon',
};

/* ---------------------------------------------------------------------------
 * Headlines — una sola plantilla genera /, /hl1 … /hl5
 * Antes cada variante era una página duplicada a mano en Framer.
 * ------------------------------------------------------------------------- */
export type Headline = {
  slug: string;
  eyebrow: string;
  /** Partes del titular. `accent: true` lo pinta de amarillo. */
  parts: { text: string; accent?: boolean }[];
};

export const headlines: Headline[] = [
  {
    slug: 'index',
    eyebrow: 'Para clínicas estéticas y de cirugía plástica',
    parts: [
      { text: 'Más pacientes calificados en menos de ' },
      { text: '90 días', accent: true },
      { text: ' con un sistema que funciona ' },
      { text: '100% en automático con IA', accent: true },
      { text: ', descubrí cómo ⭣' },
    ],
  },
  {
    slug: 'hl1',
    eyebrow: 'Para clínicas estéticas y de cirugía plástica',
    parts: [
      { text: 'Vamos a ' },
      { text: 'multiplicar los pacientes', accent: true },
      { text: ' en tu clínica con un sistema de captación con IA. Sin que tengas que grabar más contenido ni invertir más plata en anuncios ⭣' },
    ],
  },
  {
    slug: 'hl2',
    eyebrow: 'Para clínicas estéticas y de cirugía plástica',
    parts: [
      { text: 'En los próximos ' },
      { text: '90 días', accent: true },
      { text: ' vas a ' },
      { text: 'triplicar los pacientes', accent: true },
      { text: ' en tu clínica gracias a la inteligencia artificial, enterate cómo ⭣' },
    ],
  },
  {
    slug: 'hl3',
    eyebrow: 'Para clínicas estéticas y de cirugía plástica',
    parts: [
      { text: 'Más pacientes calificados en menos de ' },
      { text: '90 días', accent: true },
      { text: ' con un sistema que funciona ' },
      { text: '100% en automático con IA', accent: true },
      { text: ', descubrí cómo ⭣' },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * "¿Por qué elegirnos?"
 * ------------------------------------------------------------------------- */
export const gravityPoints = [
  'Diseñamos tu oferta para vender tratamientos, no para sumar "likes"',
  'Creamos contenido y anuncios con IA sin que grabes 20 videos al mes',
  'Automatizamos Instagram y WhatsApp para filtrar curiosos y solo agendar pacientes serios',
  'Conocimiento especializado en tu industria',
  // Reemplaza el item de la garantía del 80% que ya no usamos.
  'En menos de 90 días tenés un sistema automático que trae pacientes nuevos todos los días',
];

/* ---------------------------------------------------------------------------
 * "Qué hacemos" — el 3er item ya no habla de la garantía
 * ------------------------------------------------------------------------- */
export const services = [
  {
    title: 'Contenido y anuncios con IA',
    text: 'Diseñamos mensajes y videos con IA para tus anuncios. Vos solo validás el contenido y dedicás más tiempo a lo que te gusta que a grabar.',
  },
  {
    title: 'Asistente virtual 24/7',
    text: 'Responde dudas, filtra curiosos y solo lleva a agenda pacientes interesados. Sin quemar a tu secretaria ni tu presupuesto.',
  },
  {
    title: 'Un sistema que queda funcionando',
    text: 'En menos de 90 días tenés un sistema automático que trae pacientes nuevos todos los días, sin depender de que publiques.',
  },
];

/* ---------------------------------------------------------------------------
 * Caso: Congreso Mundial
 * ------------------------------------------------------------------------- */
export const caseStudy = {
  title: 'Cómo gestionamos el Congreso Mundial de estética para 1.400 especialistas',
  text: 'XXI UIP World Congress Buenos Aires 2025: congreso mundial de estética al que asistieron más de 1.400 especialistas de todo el mundo, aplicando nuestro sistema durante 6 meses.',
  stats: [
    { value: 1400, suffix: '+', label: 'Especialistas asistentes' },
    { value: 6, suffix: ' meses', label: 'Con el sistema corriendo' },
    { value: 2025, suffix: '', label: 'XXI UIP World Congress, Buenos Aires' },
  ],
  /** TODO: reemplazar el iframe de Google Drive por el archivo self-hosteado. */
  videoSrc: '',
  driveFallbackId: '1ZZCdX26j2kW0DYyR7seQzo5he70V4774',
};

/* ---------------------------------------------------------------------------
 * Equipo
 * ------------------------------------------------------------------------- */
/**
 * Fotos recortadas a 4:5 con scripts/process-team.mjs desde los originales
 * en Downloads. Si se suben fotos nuevas, correr el script de nuevo — ahí
 * está el criterio de encuadre para cada una.
 */
export const team = [
  { name: 'Juan Manuel Colussi', role: 'AI Expert', photo: '/team/juan.webp' },
  { name: 'Tomás Cuesta', role: 'Creative Director', photo: '/team/tomas.webp' },
];

export const aboutText = [
  'Fundada en 2023, Gravity Studios nació de la obsesión compartida de Tomás Cuesta y Juan Colussi: ayudar a los negocios a escalar y vender más digitalmente.',
  'El primer año trabajamos contenido, community management y anuncios en rubros muy distintos. Esa experiencia nos mostró dónde estaba el problema real: muchas agencias ofreciendo lo mismo y ninguna metiéndose en lo que de verdad hace escalar una clínica.',
  'Hoy diseñamos un embudo completo de adquisición de pacientes con IA para clínicas de medicina estética y cirugía plástica, para que puedas enfocarte en lo que mejor sabés hacer con un sistema corriendo en automático 24/7.',
];

export const agencyPoints = [
  'Esperan que los anuncios vendan por ellos',
  'Te piden que inviertas todo lo que ganás en publicidad',
  'Tienen 30 clientes y ninguno con resultados',
  'Te piden que les pases "fotitos" o "videítos" todo el tiempo',
  'Subcontratan personas sin experiencia',
];
