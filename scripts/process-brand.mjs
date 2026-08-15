/**
 * Procesa el brandbook (C:\Claude\Gravity Brandbook) → public/brand/.
 *
 *   node scripts/process-brand.mjs
 *
 * Recorta el espacio transparente sobrante de cada PNG, lo pasa a WebP y
 * guarda las proporciones reales en RATIOS abajo (las lee Logo.astro para
 * fijar el alto/ancho del <img> y no generar salto de layout).
 * También genera el set de favicons desde el ícono amarillo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const SRC = 'C:/Claude/Gravity Brandbook';
const OUT = resolve('public/brand');
const ICONS_OUT = resolve('public');

await mkdir(OUT, { recursive: true });

// La versión de mayor resolución disponible de cada lockup/tono.
const ASSETS = {
  'wordmark-yellow': 'Group 190 (1).png',
  'wordmark-cream': 'Group 195.png',
  'wordmark-black': 'Group 196.png',
  'icon-black': 'Group 191.png',
  'icon-cream': 'Group 198@2x.png',
  'icon-yellow': 'Group 202 (1).png',
};

const ratios = {};

for (const [name, file] of Object.entries(ASSETS)) {
  const img = sharp(resolve(SRC, file)).trim();
  const buf = await img.toBuffer({ resolveWithObject: true });
  const { width, height } = buf.info;

  await sharp(buf.data).webp({ quality: 92 }).toFile(resolve(OUT, `${name}.webp`));

  ratios[name] = +(width / height).toFixed(4);
  console.log(`${name.padEnd(16)} ${width}×${height}  ratio ${ratios[name]}`);
}

// --- Favicon, desde el ícono amarillo (mejor contraste en tab claro u oscuro) ---
const iconSrc = sharp(resolve(SRC, ASSETS['icon-yellow'])).trim();

for (const size of [16, 32, 180, 512]) {
  await iconSrc
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(ICONS_OUT, `favicon-${size}.png`));
}

console.log('\nfavicon-16/32/180/512.png escritos en public/.');

// El módulo de ratios que consume src/components/Logo.astro.
const ratiosFile = `/**
 * Generado por scripts/process-brand.mjs — no editar a mano.
 * Proporción ancho/alto real de cada lockup, para fijar el <img> sin CLS.
 */
export const LOGO_RATIOS = ${JSON.stringify(ratios, null, 2)} as const;
`;
await writeFile(resolve('src/data/logoRatios.ts'), ratiosFile);
console.log('src/data/logoRatios.ts escrito.');
