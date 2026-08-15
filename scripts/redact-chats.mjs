/**
 * Tapa lo que queda expuesto en las capturas del chatbot.
 *
 *   1. Poner los PNG originales en  public/casos/guillermo/_raw/
 *      con los nombres chat-1.png … chat-4.png
 *   2. node scripts/redact-chats.mjs
 *   3. Salen tapados en public/casos/guillermo/
 *
 * Las zonas van en porcentaje del ancho/alto, así que funciona con cualquier
 * resolución de captura. Los avatares de Instagram siempre caen en el mismo
 * lugar (columna izquierda y encabezado), por eso se pueden tapar a ciegas.
 *
 * Se usa pixelado grueso, no blur: un blur gaussiano suave sobre texto chico
 * a veces se puede revertir. El pixelado a este nivel no.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * IMPORTANTE: los originales viven FUERA de public/.
 * Todo lo que está en public/ se copia tal cual a dist/ y queda accesible por
 * URL — si los originales sin tapar estuvieran ahí, se publicarían.
 */
const IN = resolve(ROOT, '_originales/casos/guillermo');
const OUT = resolve(ROOT, 'public/casos/guillermo');

/**
 * Zonas comunes a todas las capturas, en % de [x, y, ancho, alto].
 * Medido sobre las capturas de Instagram a 940px de ancho:
 *   · avatar del encabezado ≈ x 13-23%, y 2-7%
 *   · avatares de las burbujas ≈ x 4-11%, en toda la altura
 * Las burbujas arrancan en x ≈ 11,5%, así que cortamos en 11,2% para no
 * comerles el borde.
 */
const COMMON = [
  { name: 'avatar del encabezado', box: [12.5, 0.5, 12, 7] },
  // Corta en 92% para no pixelar el botón de cámara de la barra de escritura.
  { name: 'columna de avatares', box: [0, 7.5, 11.2, 84.5] },
];

/** Zonas extra, por archivo. */
const EXTRA = {
  // El N° de operación de Mercado Pago quedó al pie del comprobante.
  'chat-2.png': [{ name: 'nro. de operación MP', box: [12, 64.3, 20, 2.4] }],
};

await mkdir(OUT, { recursive: true });

let files;
try {
  files = (await readdir(IN)).filter((f) => /\.png$/i.test(f));
} catch {
  console.error(`No existe ${IN}\nCreá la carpeta y poné ahí los PNG originales.`);
  process.exit(1);
}

if (!files.length) {
  console.error(`No hay PNG en ${IN}`);
  process.exit(1);
}

for (const file of files) {
  const img = sharp(resolve(IN, file));
  const { width, height } = await img.metadata();
  const zones = [...COMMON, ...(EXTRA[file] ?? [])];

  const patches = await Promise.all(
    zones.map(async ({ box: [x, y, w, h] }) => {
      const left = Math.max(0, Math.min(width - 1, Math.round((x / 100) * width)));
      const top = Math.max(0, Math.min(height - 1, Math.round((y / 100) * height)));
      // Clamp al borde: el redondeo puede pasarse un píxel y sharp rechaza
      // cualquier extract que se salga del lienzo.
      const bw = Math.max(1, Math.min(width - left, Math.round((w / 100) * width)));
      const bh = Math.max(1, Math.min(height - top, Math.round((h / 100) * height)));

      // Achicar a ~12px de ancho y volver a agrandar = pixelado irreversible.
      // Van en DOS pasadas a propósito: sharp no encadena dos .resize(), el
      // segundo pisa la configuración del primero y no se achica nada.
      const tiny = await sharp(resolve(IN, file))
        .extract({ left, top, width: bw, height: bh })
        .resize(12, Math.max(1, Math.round((12 * bh) / bw)), { fit: 'fill' })
        .toBuffer();

      const patch = await sharp(tiny)
        .resize(bw, bh, { kernel: 'nearest', fit: 'fill' })
        .png()
        .toBuffer();

      return { input: patch, left, top };
    })
  );

  const composed = img.composite(patches);

  // PNG para revisar el resultado a calidad plena, al lado de los originales…
  const png = await composed.clone().png({ compressionLevel: 9 }).toBuffer();
  await writeFile(resolve(IN, file.replace(/\.png$/i, '.revisar.png')), png);

  // …y WebP para servir. Son capturas con texto chico, así que va calidad
  // alta: por debajo de ~88 los números del comprobante empiezan a ensuciarse.
  const webpName = file.replace(/\.png$/i, '.webp');
  const webp = await composed.clone().webp({ quality: 90, effort: 6 }).toBuffer();
  await writeFile(resolve(OUT, webpName), webp);

  console.log(
    `${file}  ${width}×${height}  ${zones.length} zonas  ` +
      `PNG ${(png.length / 1024).toFixed(0)} KB → WebP ${(webp.length / 1024).toFixed(0)} KB`
  );
}

console.log(`\nListo. Revisar los PNG en ${OUT} antes de publicar.`);
console.log('La página sirve los .webp; los .png quedan como original de referencia.');
