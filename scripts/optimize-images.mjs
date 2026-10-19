/**
 * Achica las imágenes que PageSpeed marcaba como "más grandes de lo
 * necesario" (≈310 KB de más en mobile).
 *
 *   node scripts/optimize-images.mjs
 *
 * - Logos: se reemplazan en el lugar. El más alto que se usa es 3rem (48 px),
 *   así que a 3x alcanza con ~150 px de alto; los originales tenían 446.
 * - Equipo y poster del VSL: se genera una versión chica al lado
 *   (-360 / -768) para el srcset; el original queda para pantallas grandes.
 *
 * Es idempotente: si una imagen ya está chica, no la toca.
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const kb = async (f) => `${((await stat(f)).size / 1024).toFixed(0)} KB`;

// --- Logos: en el lugar ------------------------------------------------------
for (const file of await readdir('public/brand')) {
  if (!file.endsWith('.webp')) continue;
  const path = `public/brand/${file}`;
  const target = file.startsWith('wordmark') ? 120 : 150;
  const input = await readFile(path); // en memoria: en Windows sharp deja el archivo abierto
  const { height } = await sharp(input).metadata();
  if (height <= target) continue;
  const before = await kb(path);
  await writeFile(path, await sharp(input).resize({ height: target }).webp({ quality: 90 }).toBuffer());
  console.log(`${path}  ${before} → ${await kb(path)}`);
}

// --- Versiones chicas para srcset -------------------------------------------
const variants = [
  { src: 'public/team/juan.webp', out: 'public/team/juan-360.webp', width: 360 },
  { src: 'public/team/tomas.webp', out: 'public/team/tomas-360.webp', width: 360 },
  { src: 'public/video/vsl-poster.webp', out: 'public/video/vsl-poster-768.webp', width: 768 },
];
for (const v of variants) {
  await sharp(v.src).resize({ width: v.width }).webp({ quality: 78 }).toFile(v.out);
  console.log(`${v.out}  ${await kb(v.out)}  (original ${await kb(v.src)})`);
}

// --- Fotos de las tarjetas de casos: en el lugar ------------------------------
// Se ven a 6,5rem de ancho (104 px) como máximo: 260 px cubre pantallas 2,5x.
for (const path of ['public/casos/guillermo/foto.webp', 'public/casos/carolina/foto.webp']) {
  const input = await readFile(path);
  const { width } = await sharp(input).metadata();
  if (width <= 260) continue;
  const before = await kb(path);
  await writeFile(path, await sharp(input).resize(260, 325).webp({ quality: 82 }).toBuffer());
  console.log(`${path}  ${before} → ${await kb(path)}`);
}
