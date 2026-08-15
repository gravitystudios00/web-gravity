import { asset } from '../utils/asset';

/**
 * Caso Dr. Guillermo Cienfuegos — reemplaza la sección "casos de éxito"
 * que mostraba el video del Congreso en un iframe de Google Drive.
 *
 * ⚠ Antes de publicar: confirmar con Guillermo que está de acuerdo con que se
 *   publiquen sus números de facturación, y que las capturas del chat vayan
 *   con los datos del paciente tapados.
 */

export const caso = {
  eyebrow: 'Caso real · Dr. Guillermo Cienfuegos',
  title: 'El contenido no tiene que ser viral. Tiene que vender.',
  lead: [
    'Con Guillermo no fuimos a buscar visualizaciones. Fuimos a buscar pacientes de abdominoplastia. Son dos trabajos distintos y casi nadie los distingue: un reel con 300.000 vistas de gente que nunca se va a operar no vale lo que uno con 8.000 vistas de la persona correcta.',
    'En 5 meses construimos un sistema donde el contenido atrae al paciente indicado y la conversación la termina de cerrar una automatización.',
  ],
  closing:
    'No es el caso de un influencer médico. Es el de un cirujano que dejó de depender de que un video explote.',
};

/* ---------------------------------------------------------------------------
 * Las tres tarjetas con gráfico
 *
 * ⚠ `series` es la forma que dibuja cada gráfico. Hoy son valores de muestra:
 *   NO tenemos los datos mes a mes ni semana a semana. Cuando lleguen, se
 *   reemplazan acá y los gráficos pasan a decir algo real.
 * ------------------------------------------------------------------------- */

export const metrics = {
  ia: {
    kicker: 'Contenido con IA',
    sub: 'Sobre el total publicado',
    percent: 50,
    title: 'La mitad del contenido no lo grabó él',
    text: 'La mitad de las piezas se producen con IA. Guillermo valida el mensaje y graba menos, sin que caiga el volumen de publicación.',
  },
  followers: {
    kicker: 'Comunidad',
    sub: 'Crecimiento en 5 meses',
    value: 27500,
    display: '27.500',
    title: 'Una audiencia con intención de operarse',
    text: '27.500 seguidores construidos alrededor de una especialidad concreta, no de un público general. Esa es la diferencia entre alcance y demanda.',
    /** TODO: seguidores al cierre de cada mes. */
    series: [4200, 8600, 13900, 20400, 27500],
    labels: ['Mes 1', 'Mes 5'],
  },
  revenue: {
    kicker: 'Ingresos',
    sub: 'Promedio semanal desde Instagram',
    display: 'USD 12.000',
    title: 'Instagram como canal de facturación',
    text: 'Doce mil dólares promedio por semana atribuibles a Instagram, con la abdominoplastia como procedimiento ancla.',
    /** TODO: facturación real por semana. */
    series: [7, 9, 8, 11, 13, 12, 15, 12],
    labels: ['Semana 1', 'Semana 8'],
  },
};

/* ---------------------------------------------------------------------------
 * Los tres puntos con tilde
 * ------------------------------------------------------------------------- */

export const points = [
  {
    title: 'Contenido con criterio comercial',
    text: 'Cada pieza está pensada para mover a alguien hacia una consulta, no para acumular vistas.',
  },
  {
    title: '80% de los mensajes automatizados',
    text: 'Una estructura que responde, filtra y agenda sola. Su secretaria interviene solo cuando hace falta.',
  },
  {
    title: '5 meses, no 5 años',
    text: 'El sistema arrancó a funcionar el primer mes y se fue afinando con datos reales.',
  },
];

/* ---------------------------------------------------------------------------
 * Capturas
 * Subir los PNG originales (sin recomprimir, sin pasar por WhatsApp) a
 * public/casos/guillermo/ y poner las rutas acá.
 * ------------------------------------------------------------------------- */

export const profile = {
  title: 'El perfil, hoy',
  text: 'Una cuenta construida para una especialidad, no para todo el mundo.',
  image: asset('/casos/guillermo/perfil.webp'),
  /** Datos leídos de la captura del perfil. */
  stats: [
    { value: '27.5K', label: 'Seguidores' },
    { value: '190', label: 'Publicaciones' },
    { value: '171.6K', label: 'Visualizaciones en 30 días' },
  ],
};

export const chat = {
  title: 'Así responde el sistema, de punta a punta',
  text: 'Estas son conversaciones reales, desde el primer mensaje hasta el turno agendado. No hay nadie del otro lado.',
  /**
   * 4 o 5 capturas para que se vea el recorrido completo.
   *
   * ⚠ NO cargar acá una captura hasta verificar que estén tapados:
   *   · CBU / CVU / alias bancarios (los de la clínica también)
   *   · CUIT / CUIL y DNI
   *   · Números de operación
   *   · Nombre Y foto de perfil del paciente, en el encabezado y en cada
   *     burbuja del chat
   *
   * Estado al 14/8/2026: CBU y CVU ya vienen tapados en las cuatro.
   * Falta tapar los avatares de los pacientes y el N° de operación de Mercado
   * Pago en chat-2 → lo hace `node scripts/redact-chats.mjs`, que lee de
   * public/casos/guillermo/_raw/ y escribe acá al lado.
   */
  images: [
    asset('/casos/guillermo/chat-1.webp'),
    asset('/casos/guillermo/chat-2.webp'),
    asset('/casos/guillermo/chat-3.webp'),
    asset('/casos/guillermo/chat-4.webp'),
  ].filter(Boolean),
};
