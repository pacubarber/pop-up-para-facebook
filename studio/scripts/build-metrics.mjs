// Mide el ancho de cada letra en las tipografías del kit, para que los textos gigantes
// puedan ajustarse al ancho exacto de la pantalla sin medir en el navegador.
// Uso: node scripts/build-metrics.mjs  → src/lib/kit/metrics.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = {
  anton: '@fontsource/anton/files/anton-latin-400-normal.woff',
  display: '@fontsource/inter-tight/files/inter-tight-latin-900-normal.woff',
  displayItalic: '@fontsource/inter-tight/files/inter-tight-latin-900-italic.woff',
  serif: '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff',
};
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789 .,;:!?¡¿%$+-–—/&@#()·"\'×';
const out = {};
for (const [key, rel] of Object.entries(files)) {
  const font = opentype.parse(fs.readFileSync(path.resolve(here, '../node_modules', rel)).buffer);
  const widths = {};
  for (const c of chars) widths[c] = +(font.charToGlyph(c).advanceWidth / font.unitsPerEm).toFixed(4);
  out[key] = {capHeight: +((font.tables.os2.sCapHeight || font.ascender * 0.7) / font.unitsPerEm).toFixed(4), widths};
}
fs.writeFileSync(path.resolve(here, '../src/lib/kit/metrics.json'), JSON.stringify(out));
console.log('✓ src/lib/kit/metrics.json');
