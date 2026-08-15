import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Devuelve la ruta pública solo si el archivo existe en public/.
 * Si todavía no se subió, devuelve '' y el componente muestra el placeholder
 * en vez de una imagen rota.
 *
 * Se evalúa en build, así que no llega nada de esto al navegador.
 */
export function asset(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return existsSync(join(process.cwd(), 'public', rel)) ? publicPath : '';
}
