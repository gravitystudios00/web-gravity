/**
 * Fotos y clip de las tarjetas de "Casos de éxito" → public/casos/.
 *
 *   node scripts/process-case-media.mjs
 *
 * Las fotos van recortadas a medio cuerpo en 4:5: en la tarjeta se ven en
 * una miniatura de ~6rem, y con la foto entera la cara queda diminuta.
 * El clip de Caro va entero (pedido así), sin audio — en la tarjeta corre
 * muteado en loop — y bajado a 540px / 30 fps, que alcanza para el tamaño
 * en que se muestra. Requiere ffmpeg en el PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const DL = 'C:/Users/juanm/Downloads';

const photos = [
  {
    out: 'public/casos/guillermo/foto.webp',
    src: `${DL}/WhatsApp Image 2026-04-17 at 8.14.01 PM.jpeg`,
    // Original 853×1280. Cabeza y hombros; la cara está en x≈485.
    extract: { left: 225, top: 40, width: 520, height: 650 },
  },
  {
    out: 'public/casos/carolina/foto.webp',
    src: `${DL}/WhatsApp Image 2026-07-29 at 12.58.36 PM.jpeg`,
    // Original 837×1280. La cara está en x≈420.
    extract: { left: 140, top: 120, width: 560, height: 700 },
  },
];

for (const p of photos) {
  await mkdir(resolve(p.out, '..'), { recursive: true });
  await sharp(p.src).extract(p.extract).resize(480, 600).webp({ quality: 84 }).toFile(p.out);
  console.log(`${p.out}  ${((await stat(p.out)).size / 1024).toFixed(0)} KB`);
}

const CLIP_SRC = `${DL}/Screen_Recording_20261005_190922_Instagram_1.mp4`;
const CLIP_OUT = resolve('public/casos/carolina/clon.mp4');
const POSTER_RAW = resolve('public/casos/carolina/.poster-raw.png');
const POSTER = resolve('public/casos/carolina/clon-poster.webp');

execFileSync(
  'ffmpeg',
  [
    '-y', '-v', 'error',
    '-i', CLIP_SRC,
    '-an',
    '-vf', 'scale=540:-2,fps=30',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    CLIP_OUT,
  ],
  { stdio: 'inherit' }
);

execFileSync(
  'ffmpeg',
  ['-y', '-v', 'error', '-ss', '1', '-i', CLIP_SRC, '-frames:v', '1', '-update', '1', POSTER_RAW],
  { stdio: 'inherit' }
);
await sharp(POSTER_RAW).resize({ width: 540 }).webp({ quality: 80 }).toFile(POSTER);
await unlink(POSTER_RAW);

console.log(`clon.mp4         ${((await stat(CLIP_OUT)).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`clon-poster.webp ${((await stat(POSTER)).size / 1024).toFixed(0)} KB`);
