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
 * VSL — el video pesa 115 MB (1080p) y Cloudflare Pages rechaza cualquier
 * asset estático de más de 25 MiB, así que no puede vivir en public/ ni en
 * el repo (GitHub tampoco acepta un push de +100 MB). Vive en un bucket R2
 * público (web-gravity-assets) y se referencia por URL absoluta.
 *
 * Para reemplazarlo:
 *   node scripts/process-vsl.mjs "C:\ruta\al\video-nuevo.mp4"
 * El script comprime, regenera el poster y sube el resultado a R2 — no hay
 * que tocar esta URL de nuevo salvo que cambie el nombre del bucket.
 * ------------------------------------------------------------------------- */
export const vsl = {
  src: 'https://pub-f92130ee84a64f4189eee960be4dc120.r2.dev/video/vsl.mp4',
  poster: '/video/vsl-poster.webp',
  kicker: 'En 4 minutos te explicamos nuestro método',
};

/* ---------------------------------------------------------------------------
 * WhatsApp
 * `phone` va en formato internacional, solo dígitos, sin + ni guiones.
 * (El sitio actual tiene el de Tomás mal escrito: 54295474-8078)
 * ------------------------------------------------------------------------- */
export const whatsapp = {
  juan: { name: 'Juan', phone: '15558684087' },
  tomas: { name: 'Tomás', phone: '542954748078' },
  /** A quién van los botones de la landing. */
  primary: 'juan' as 'juan' | 'tomas',
};

/**
 * Arma el link de WhatsApp con mensaje pre-cargado.
 * El `source` sirve para saber desde qué sección abrió la conversación.
 * `text` permite pisar el mensaje: las páginas de post-agenda mandan
 * "VISTO" en vez del pedido de auditoría.
 */
export function waLink(
  source: string,
  who: 'juan' | 'tomas' = whatsapp.primary,
  text?: string
) {
  const phone = whatsapp[who].phone;
  const mensaje =
    text ?? `Hola! Vengo de la web (${source}) y quiero hacer la auditoría para mi clínica.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

/* ---------------------------------------------------------------------------
 * Páginas de post-agenda (/video-t y /video-j)
 *
 * Adonde cae alguien que ACABA de reservar la llamada. Las dos son idénticas
 * salvo a quién le manda el "VISTO" por WhatsApp: /video-t a Tomás,
 * /video-j a Juan. No se indexan — no tienen sentido fuera del embudo.
 * ------------------------------------------------------------------------- */
export const videoPage = {
  /** `accent: true` pinta la parte de ámbar, igual que en los headlines. */
  headline: [
    { text: 'Si tu ' },
    { text: 'agenda', accent: true },
    { text: ' depende del ' },
    { text: 'azar', accent: true },
    { text: ', este video de 4 minutos es el ' },
    { text: 'primer paso', accent: true },
    { text: ' para ' },
    { text: 'cambiarlo', accent: true },
  ],
  intro: [
    { text: 'Acabás de ' },
    { text: 'agendar', accent: true },
    { text: ' una llamada de ' },
    { text: 'diagnóstico', accent: true },
    { text: ' con nosotros. Mirá este video donde vas a ver:' },
  ],
  /** Los mismos tres primeros puntos que "¿Por qué elegirnos?". */
  points: [
    'Diseñamos tu oferta para vender tratamientos, no para sumar "likes"',
    'Creamos contenido y anuncios con IA sin que grabes 20 videos al mes',
    'Automatizamos Instagram y WhatsApp para filtrar curiosos y solo agendar pacientes serios',
  ],
  urgency: [
    { text: 'Verlo ' },
    { text: 'ahora', accent: true },
    { text: ' hace que la reunión sea mucho más concreta y ' },
    { text: 'enfocada en TU CLÍNICA', accent: true },
  ],
  afterVideo: [
    { text: 'Cuando lo veas completo, mandanos ' },
    { text: '"VISTO"', accent: true },
    { text: ' por WhatsApp.' },
  ],
  /** El mensaje que queda pre-cargado en el chat. */
  waText: 'VISTO',
};

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
