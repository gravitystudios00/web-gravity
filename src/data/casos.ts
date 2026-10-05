import { asset } from '../utils/asset';
import { metrics } from './casoGuillermo';

/**
 * Tarjetas de la sección "Casos de éxito" de la landing.
 *
 * Cada tarjeta resume un caso: quién es, qué problema traía y qué cambió.
 * Si el caso tiene página propia, `href` muestra el "ver el caso completo".
 *
 * Las rutas de fotos y video pasan por asset(): mientras el archivo no esté
 * en public/, la tarjeta muestra un placeholder en vez de una imagen rota.
 */

export type Caso = {
  slug: string;
  eyebrow: string;
  name: string;
  role: string;
  photo: string;
  problem: string;
  /** Página del caso completo. Sin href, la tarjeta no muestra el link. */
  href?: string;
};

export const guillermo: Caso & {
  result: string;
  chartLabel: string;
  series: number[];
  seriesLabels: string[];
} = {
  slug: 'guillermo',
  eyebrow: 'Caso real',
  name: 'Dr. Guillermo Cienfuegos',
  role: 'Cirujano plástico · Río Cuarto',
  photo: asset('/casos/guillermo/foto.webp'),
  problem: 'Vino con un problema puntual: conseguir más ventas.',
  result: 'De $0 vendidos en Instagram a USD 12.000 por semana',
  chartLabel: 'Ingresos semanales desde Instagram',
  // La serie de su página, con el punto de partida en cero adelante: la
  // tarjeta dice "de $0" y el gráfico tiene que arrancar ahí también.
  series: [0, ...metrics.revenue.series],
  seriesLabels: ['Antes', metrics.revenue.labels[1]],
  href: '/casos/guillermo/',
};

export const carolina: Caso & {
  clip: string;
  clipPoster: string;
  clipCaption: string;
} = {
  slug: 'carolina',
  eyebrow: 'Caso real',
  name: 'Dra. Carolina Alonso',
  role: 'Odontóloga estética · Bogotá',
  photo: asset('/casos/carolina/foto.webp'),
  problem: 'Vino con un problema puntual: no tenía tiempo para grabar contenido.',
  clip: asset('/casos/carolina/clon.mp4'),
  clipPoster: asset('/casos/carolina/clon-poster.webp'),
  clipCaption: 'Su clon con IA graba por ella',
  // Sin href: todavía no tiene página propia.
};
