/**
 * Baja las dos fuentes Baloo del design system de Google Fonts y las guarda
 * en public/fonts/, generando public/fonts/fonts.css con los @font-face.
 *
 *   node scripts/fetch-fonts.mjs
 *
 * Se corre una sola vez; los .woff2 quedan versionados en el repo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/fonts');

// UA de Chrome para que Google devuelva woff2 y no ttf.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const FAMILIES = [
  { name: 'Baloo Da 2', slug: 'baloo-da-2', axis: 'wght@400;500;600;700' },
  { name: 'Baloo Bhaina 2', slug: 'baloo-bhaina-2', axis: 'wght@400;500;600' },
];

await mkdir(OUT, { recursive: true });

let css = '/* Generado por scripts/fetch-fonts.mjs — no editar a mano. */\n';

for (const fam of FAMILIES) {
  const url =
    'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(fam.name).replace(/%20/g, '+') +
    ':' +
    fam.axis +
    '&display=swap';

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${fam.name}: ${res.status} ${res.statusText}`);
  let sheet = await res.text();

  // Quedarnos solo con los subsets latin / latin-ext.
  const blocks = sheet.split('/*').filter((b) => /latin/.test(b.split('*/')[0] || ''));

  for (const block of blocks) {
    const subset = /latin-ext/.test(block.split('*/')[0]) ? 'latin-ext' : 'latin';
    const weight = (block.match(/font-weight:\s*([\d ]+)/) || [])[1]?.trim() ?? '400';
    const href = (block.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
    const unicodeRange = (block.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!href) continue;

    const file = `${fam.slug}-${weight.replace(/\s+/g, '-')}-${subset}.woff2`;
    const bin = Buffer.from(await (await fetch(href, { headers: { 'User-Agent': UA } })).arrayBuffer());
    await writeFile(resolve(OUT, file), bin);
    console.log(`  ${file}  ${(bin.length / 1024).toFixed(1)} KB`);

    css +=
      `\n@font-face {\n` +
      `  font-family: '${fam.name}';\n` +
      `  font-style: normal;\n` +
      `  font-weight: ${weight};\n` +
      `  font-display: swap;\n` +
      `  src: url('/fonts/${file}') format('woff2');\n` +
      (unicodeRange ? `  unicode-range: ${unicodeRange};\n` : '') +
      `}\n`;
  }
}

await writeFile(resolve(OUT, 'fonts.css'), css);
console.log('\nfonts.css escrito.');
