/**
 * Comprime el VSL, genera el poster y sube el video a R2.
 *
 *   node scripts/process-vsl.mjs "C:\ruta\al\video-original.mp4" [--720p] [--no-upload]
 *
 * El archivo que suele entregar el editor viene sin comprimir para web
 * (en este caso: H.264 1080p a ~15,7 Mbps, 431 MB para 3:46 de video).
 * Ese bitrate no aporta nada en pantalla — es edición, no entrega.
 *
 * El resultado NO va a public/: a 1080p pesa ~115 MB, muy por encima de los
 * dos límites que importan acá — 25 MiB por asset estático en Cloudflare
 * Pages, y 100 MB por archivo en un push normal de GitHub. Por eso el video
 * comprimido va a _local-media/ (fuera de git y de public/) y de ahí se sube
 * directo al bucket público de R2 (web-gravity-assets). Solo el poster
 * (unos KB) se queda en public/, que es donde Pages sí lo puede servir.
 *
 * Por default entrega en 1080p nativo a CRF 21 (calidad alta, sin perder
 * resolución real). Como el video es una fachada — no se descarga hasta que
 * alguien aprieta play — el peso del archivo no toca el tiempo de carga de
 * la página, solo el arranque de la reproducción. `--720p` da la variante
 * liviana si alguna vez hace falta. `--no-upload` deja el archivo listo en
 * _local-media/ sin tocar R2 (por si querés revisarlo antes de publicarlo).
 *
 * Requiere ffmpeg en el PATH (instalado en esta sesión con
 * `winget install Gyan.FFmpeg`) y wrangler autenticado (`npx wrangler whoami`).
 */
import { execFileSync } from 'node:child_process';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const R2_BUCKET = 'web-gravity-assets';
const R2_PUBLIC_URL = 'https://pub-f92130ee84a64f4189eee960be4dc120.r2.dev';

const src = process.argv[2];
const es720 = process.argv.includes('--720p');
const sinSubida = process.argv.includes('--no-upload');

if (!src) {
  console.error(
    'Uso: node scripts/process-vsl.mjs "C:\\ruta\\al\\video.mp4" [--720p] [--no-upload]'
  );
  process.exit(1);
}

const OUT_VIDEO = resolve('_local-media/video/vsl.mp4');
const OUT_POSTER_RAW = resolve('public/video/.poster-raw.png');
const OUT_POSTER = resolve('public/video/vsl-poster.webp');

await mkdir(resolve('_local-media/video'), { recursive: true });
await mkdir(resolve('public/video'), { recursive: true });

console.log(`Comprimiendo video en ${es720 ? '720p' : '1080p'} (puede tardar unos minutos)...`);
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-i', src,
    ...(es720 ? ['-vf', 'scale=-2:720'] : []),
    '-c:v', 'libx264',
    '-preset', 'medium',
    // CRF más bajo en 1080p que en 720p (21 vs 23): a más resolución, más
    // bits hacen falta para que la misma calidad se sostenga.
    '-crf', es720 ? '23' : '21',
    '-maxrate', es720 ? '2500k' : '4500k',
    '-bufsize', es720 ? '5000k' : '9000k',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', es720 ? '96k' : '128k',
    '-ac', '2',
    // El moov atom va al principio del archivo: así el navegador puede
    // empezar a reproducir sin esperar a descargar el archivo entero.
    '-movflags', '+faststart',
    OUT_VIDEO,
  ],
  { stdio: 'inherit' }
);

/*
 * Si el VSL trae subtítulos quemados palabra por palabra (como este),
 * arrancan casi desde el frame 0 — no hay un instante "limpio" sin texto
 * más adelante. Por eso el default es un frame bien temprano en vez de
 * esperar unos segundos: a los 2s cae en medio de una palabra con la boca
 * abierta. Revisar public/video/vsl-poster.webp después de correr esto y,
 * si el gesto queda raro, volver a extraer con otro -ss.
 */
console.log('\nExtrayendo el poster...');
execFileSync(
  'ffmpeg',
  ['-y', '-ss', '0.3', '-i', src, '-frames:v', '1', '-q:v', '2', OUT_POSTER_RAW],
  { stdio: 'inherit' }
);

await sharp(OUT_POSTER_RAW).resize({ width: 1280 }).webp({ quality: 82 }).toFile(OUT_POSTER);
await unlink(OUT_POSTER_RAW);

const srcMB = (await stat(src)).size / 1024 / 1024;
const videoMB = (await stat(OUT_VIDEO)).size / 1024 / 1024;
const posterKB = (await stat(OUT_POSTER)).size / 1024;

console.log(
  `\nOriginal:   ${srcMB.toFixed(1)} MB` +
    `\nComprimido: ${videoMB.toFixed(1)} MB  (${(100 - (videoMB / srcMB) * 100).toFixed(0)}% menos)` +
    `\nPoster:     ${posterKB.toFixed(0)} KB`
);

if (sinSubida) {
  console.log(
    `\nListo en ${OUT_VIDEO} (no se subió a R2 — se pasó --no-upload).` +
      `\nPara subirlo después:` +
      `\n  npx wrangler r2 object put ${R2_BUCKET}/video/vsl.mp4 --file "${OUT_VIDEO}" --content-type video/mp4 --cache-control "public, max-age=31536000, immutable" --remote`
  );
  process.exit(0);
}

console.log(`\nSubiendo a R2 (bucket ${R2_BUCKET})...`);
execFileSync(
  'npx',
  [
    'wrangler', 'r2', 'object', 'put', `${R2_BUCKET}/video/vsl.mp4`,
    '--file', OUT_VIDEO,
    '--content-type', 'video/mp4',
    '--cache-control', 'public, max-age=31536000, immutable',
    '--remote',
  ],
  { stdio: 'inherit', shell: true }
);

console.log(
  `\nListo. El video vive en:` +
    `\n  ${R2_PUBLIC_URL}/video/vsl.mp4` +
    `\n\nSi ese bucket o esa URL cambiaron, actualizar vsl.src en src/data/site.ts.` +
    ` Si no cambiaron, no hay que tocar nada más — el sitio ya apunta ahí.`
);
