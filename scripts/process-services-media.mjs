/**
 * Videos de las tarjetas de "Qué hacemos" → public/servicios/.
 *
 *   node scripts/process-services-media.mjs
 *
 * Cada video sale en dos versiones:
 *   - *-loop.mp4: la que corre en la tarjeta, muteada y en loop. Liviana,
 *     porque arranca sola apenas la tarjeta entra en pantalla.
 *   - *-full.mp4: la que se abre al tocar la tarjeta. Más resolución (el bot
 *     tiene texto chico que en la tarjeta no se lee) y, en el clon, con audio.
 *     Solo se descarga si alguien la abre.
 * Requiere ffmpeg en el PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const DL = 'C:/Users/juanm/Downloads';
const OUT = resolve('public/servicios');

const videos = [
  {
    // Clon de IA de Caro, 1080×1920, 57 s, con audio.
    name: 'clon-caro',
    src: `${DL}/2026-10-20-el-peligro-de-corregir-hacia-el-extremo-contrario-fc86b4.mp4`,
    loop: { scale: '480:-2', crf: 28, audio: false },
    full: { scale: '720:-2', crf: 24, audio: true },
    posterAt: 1,
  },
  {
    // Bot de WhatsApp, 1920×1080, 40 s, sin audio.
    name: 'bot-whatsapp',
    src: `${DL}/Bot WhatsApp 16x9.mp4`,
    loop: { scale: '960:-2', crf: 26, audio: false },
    full: { scale: '1920:-2', crf: 23, audio: false },
    posterAt: 12,
  },
];

const encode = (src, out, { scale, crf, audio }) =>
  execFileSync(
    'ffmpeg',
    [
      '-y', '-v', 'error',
      '-i', src,
      '-vf', `scale=${scale}`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
      '-pix_fmt', 'yuv420p',
      ...(audio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an']),
      '-movflags', '+faststart',
      out,
    ],
    { stdio: 'inherit' }
  );

const size = async (f) => `${((await stat(f)).size / 1024 / 1024).toFixed(2)} MB`;

await mkdir(OUT, { recursive: true });

for (const v of videos) {
  const loop = `${OUT}/${v.name}-loop.mp4`;
  const full = `${OUT}/${v.name}-full.mp4`;
  encode(v.src, loop, v.loop);
  encode(v.src, full, v.full);

  const raw = `${OUT}/.${v.name}-poster.png`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(v.posterAt), '-i', v.src, '-frames:v', '1', '-update', '1', raw], {
    stdio: 'inherit',
  });
  const poster = `${OUT}/${v.name}-poster.webp`;
  await sharp(raw).resize({ width: v.name === 'bot-whatsapp' ? 960 : 480 }).webp({ quality: 80 }).toFile(poster);
  await unlink(raw);

  console.log(`${v.name}: loop ${await size(loop)} · full ${await size(full)} · poster ${await size(poster)}`);
}
