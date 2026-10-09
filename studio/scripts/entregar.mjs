// Copia los videos ya renderizados (out/<id>.mp4) a entregas/ en versión liviana para subir a redes,
// con su portada. No toca web/ (la landing se maneja aparte).
//
//   node scripts/entregar.mjs            → todos los que estén renderizados
//   node scripts/entregar.mjs Fresca     → solo esos
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compress, mb, poster} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dest = path.resolve(root, '../entregas');

// id de composición → [carpeta, archivo, segundo para la portada]
export const ENTREGAS = {
  Disciplina: ['motivacionales', 'disciplina', 9.4],
  Nadie: ['motivacionales', 'nadie-va-a-venir-a-salvarte', 6.8],
  Restaurante: ['biblioteca', 'restaurante-3-errores', 6.2],
  Oceano: ['biblioteca', 'sabias-que-oceano', 2.6],
  Mexico: ['biblioteca', 'guia-mexico-5-lugares', 5.4],
  Fresca: ['estilo-cafe', 'fresca-jugos', 2.8],
  Brasa: ['estilo-cafe', 'brasa-smash-burgers', 6.6],
  Cobra: ['saas', 'cobra-facturas', 3.9],
  Cafe: ['portafolio-voz-nueva', 'anuncio-grano-alto', 4.0],
  Saas: ['portafolio-voz-nueva', 'saas-flujo', 5.0],
  Inmobiliaria: ['portafolio-voz-nueva', 'inmobiliaria-casa-alameda', 6.0],
  Podcast: ['portafolio-voz-nueva', 'podcast-mente-fundadora', 12.0],
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ENTREGAS);
for (const id of ids) {
  const src = path.join(root, 'out', `${id}.mp4`);
  if (!ENTREGAS[id] || !fs.existsSync(src)) {
    console.log(`– ${id}: sin render en out/, lo salto`);
    continue;
  }
  const [dir, name, at] = ENTREGAS[id];
  fs.mkdirSync(path.join(dest, dir), {recursive: true});
  const mp4 = path.join(dest, dir, `${name}.mp4`);
  compress(src, mp4);
  poster(src, path.join(dest, dir, `${name}.jpg`), at);
  console.log(`✓ ${id} → entregas/${dir}/${name}.mp4 (${mb(mp4)})`);
}
