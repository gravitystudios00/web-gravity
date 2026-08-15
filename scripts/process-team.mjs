/**
 * Recorta y comprime las fotos del equipo → public/team/.
 *
 *   node scripts/process-team.mjs
 *
 * Las originales vienen en 2:3 (retrato de cámara); las tarjetas del equipo
 * usan un ratio 4:5 fijo (ver .member__photo en About.astro), así que se
 * recorta en vez de dejar que el navegador lo haga con object-fit: cover —
 * así elegimos el encuadre a mano y bajamos el peso antes de subir (la de
 * Juan pesaba 13 MB).
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const OUT = resolve('public/team');
await mkdir(OUT, { recursive: true });

const jobs = [
  {
    name: 'juan',
    src: 'C:/Users/juanm/Downloads/DSC_0217-4.jpg',
    // Original 4000×6000. Recorte a 4:5 conservando todo el ancho y
    // ancladando arriba: la cara está cerca del tercio superior, el
    // recorte se lleva la parte de abajo (piernas), que no aporta al card.
    extract: { left: 0, top: 0, width: 4000, height: 5000 },
  },
  {
    name: 'tomas',
    src: 'C:/Users/juanm/Downloads/DSC_0187-3.jpg',
    // Original 1365×2048. Mismo criterio: ancho completo, recorte del
    // sobrante abajo.
    extract: { left: 0, top: 0, width: 1365, height: 1706 },
  },
];

for (const { name, src, extract } of jobs) {
  const out = resolve(OUT, `${name}.webp`);
  await sharp(src)
    .extract(extract)
    .resize(720, 900, { fit: 'cover' }) // 4:5, suficiente para retina en el tamaño de card
    .webp({ quality: 84 })
    .toFile(out);

  const { size } = await import('node:fs/promises').then((fs) => fs.stat(out));
  console.log(`${name}.webp  720×900  ${(size / 1024).toFixed(0)} KB`);
}
