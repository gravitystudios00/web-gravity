/**
 * Genera public/og.jpg — la imagen que se ve al compartir el link en
 * WhatsApp, redes, etc. Hoy no existe (el sitio no tenía og:image real).
 *
 *   node scripts/build-og-image.mjs
 *
 * Wordmark amarillo centrado sobre negro, con el mismo halo radial ámbar
 * que el hero, para que la miniatura del link ya se sienta parte del sitio.
 */
import { resolve } from 'node:path';
import sharp from 'sharp';

const W = 1200;
const H = 630;

const glow = Buffer.from(`
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="46%" r="55%">
        <stop offset="0%" stop-color="#EABE3F" stop-opacity="0.22"/>
        <stop offset="60%" stop-color="#EABE3F" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#EABE3F" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#000000"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>
`);

const logo = await sharp('public/brand/wordmark-yellow.webp')
  .resize({ width: 620 })
  .toBuffer();
const logoMeta = await sharp(logo).metadata();

await sharp(glow)
  .composite([
    {
      input: logo,
      left: Math.round((W - logoMeta.width) / 2),
      top: Math.round((H - logoMeta.height) / 2),
    },
  ])
  .jpeg({ quality: 90 })
  .toFile(resolve('public/og.jpg'));

console.log('public/og.jpg escrito.');
