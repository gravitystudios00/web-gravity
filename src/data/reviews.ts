/**
 * Reseñas del carrusel de prueba social.
 *
 * El componente (src/components/Reviews.astro) está terminado: layout
 * horizontal, autoplay continuo, pausa al hover, swipe en mobile, avatar,
 * estrellas y verificado. Solo hay que llenar este array.
 *
 * Formato de cada entrada:
 *   name    → nombre que se muestra
 *   role    → especialidad + ciudad, va debajo del nombre en gris
 *   rating  → 1 a 5 (poné `stars: false` en el componente si no las querés)
 *   text    → la reseña
 *   avatar  → ruta a la imagen en public/reviews/ (ej: '/reviews/nombre.jpg')
 *             si va vacío, se dibuja la inicial sobre un círculo ámbar
 *   date    → texto libre, se muestra chico al lado del rating
 *
 * El carrusel necesita mínimo 6 entradas para que el loop se vea continuo;
 * con menos, duplicá el array o el bucle se va a notar.
 */

export type Review = {
  name: string;
  role: string;
  rating: number;
  text: string;
  avatar?: string;
  date?: string;
};

export const reviews: Review[] = [
  // ── Cargar acá. Ejemplo del formato: ─────────────────────────────────────
  // {
  //   name: 'Nombre Apellido',
  //   role: 'Cirugía plástica · Córdoba',
  //   rating: 5,
  //   text: 'Texto de la reseña.',
  //   avatar: '/reviews/nombre.jpg',
  //   date: 'hace 2 meses',
  // },
];
