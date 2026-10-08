// Genera los logos de CORTE como SVG con el texto convertido a trazos
// (se ven igual en cualquier equipo, sin depender de fuentes instaladas).
// Uso: node scripts/build-logos.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../branding/logo');
fs.mkdirSync(out, {recursive: true});

const C = {ink: '#0C0C0E', bone: '#F2EEE6', red: '#FF3B1F'};
const fontFile = path.resolve(
  here,
  '../node_modules/@fontsource/inter-tight/files/inter-tight-latin-900-normal.woff',
);
const font = opentype.parse(fs.readFileSync(fontFile).buffer);

// Isotipo: un disco "cortado" en diagonal, con las mitades separadas.
// Exportado también para que el showreel y la web dibujen exactamente lo mismo.
export const isoPaths = ({cx = 60, cy = 60, r = 40, angle = -35, gap = 5} = {}) => {
  const t = (angle * Math.PI) / 180;
  const ux = Math.cos(t);
  const uy = Math.sin(t);
  const nx = -uy; // normal al corte
  const ny = ux;
  const f = (n) => n.toFixed(2);
  const half = (sign) => {
    const ox = nx * gap * sign;
    const oy = ny * gap * sign;
    const ax = cx + ux * r + ox;
    const ay = cy + uy * r + oy;
    const bx = cx - ux * r + ox;
    const by = cy - uy * r + oy;
    const sweep = sign > 0 ? 1 : 0;
    return `M${f(ax)} ${f(ay)}A${r} ${r} 0 0 ${sweep} ${f(bx)} ${f(by)}Z`;
  };
  return {top: half(-1), bottom: half(1)};
};

const iso = (light) => {
  const {top, bottom} = isoPaths();
  return `<path d="${top}" fill="${light ? C.ink : C.bone}"/><path d="${bottom}" fill="${C.red}"/>`;
};

const word = (text, x, baseline, size, tracking = -0.035) => {
  let cursor = x;
  const parts = [];
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    parts.push(g.getPath(cursor, baseline, size).toPathData(2));
    cursor += (g.advanceWidth / font.unitsPerEm) * size + tracking * size;
  }
  return {d: parts.join(''), width: cursor - x - tracking * size};
};

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

const write = (name, content) => {
  fs.writeFileSync(path.join(out, name), content);
  console.log('✓', name);
};

// 1) Isotipo suelto
write('corte-isotipo.svg', svg(120, 120, iso(false), 'CORTE'));
write('corte-isotipo-claro.svg', svg(120, 120, iso(true), 'CORTE'));

// 2) Ícono de app / avatar (fondo Negro Sala)
write(
  'corte-avatar.svg',
  svg(120, 120, `<rect width="120" height="120" rx="28" fill="${C.ink}"/>${iso(false)}`, 'CORTE'),
);

// 3) Logotipo: CORTE + punto rojo
const size = 96;
const wm = word('CORTE', 0, 84, size);
const dotR = 9;
const wordmark = (fill, pad = 0) =>
  `<path d="${wm.d}" fill="${fill}" transform="translate(${pad} 0)"/>` +
  `<circle cx="${(pad + wm.width + 6 + dotR).toFixed(1)}" cy="${84 - dotR}" r="${dotR}" fill="${C.red}"/>`;
const wmW = Math.ceil(wm.width + 6 + dotR * 2 + 2);
write('corte-logotipo.svg', svg(wmW, 100, wordmark(C.bone), 'CORTE'));
write('corte-logotipo-claro.svg', svg(wmW, 100, wordmark(C.ink), 'CORTE'));

// 4) Horizontal: isotipo + logotipo
const horiz = (light) => {
  const isoScaled = `<g transform="translate(-6 -10) scale(1)">${iso(light)}</g>`;
  return isoScaled + `<g transform="translate(118 0)">${wordmark(light ? C.ink : C.bone)}</g>`;
};
const hW = 118 + wmW;
write('corte-horizontal.svg', svg(hW, 100, horiz(false), 'CORTE'));
write('corte-horizontal-claro.svg', svg(hW, 100, horiz(true), 'CORTE'));

// 5) Favicon para la web
const webDir = path.resolve(here, '../../web/assets');
fs.mkdirSync(webDir, {recursive: true});
fs.writeFileSync(
  path.join(webDir, 'favicon.svg'),
  svg(120, 120, `<rect width="120" height="120" rx="28" fill="${C.ink}"/>${iso(false)}`, 'CORTE'),
);
console.log('✓ web/assets/favicon.svg');
