// Utilidades compartidas por render.mjs y pitch.mjs.
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';

export const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], {stdio: ['ignore', 'pipe', 'pipe']});

/** Mide la sonoridad (primera pasada de loudnorm; el JSON sale por stderr). */
const measure = (src) => {
  const {stderr} = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
    {encoding: 'utf8'},
  );
  return JSON.parse(stderr.slice(stderr.lastIndexOf('{')));
};

/** Normaliza el audio a -14 LUFS (estándar de Instagram/TikTok/YouTube) sin recomprimir el video. */
export const finish = (raw, master) => {
  const m = measure(raw);
  ff(
    '-i', raw,
    '-af', `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', master,
  );
};

/** Versión liviana para web / envío por mensaje. */
export const compress = (src, dst, crf = 24) =>
  ff('-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-maxrate', '4M', '-bufsize', '8M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst);

export const poster = (src, dst, at = 1.6) => ff('-ss', String(at), '-i', src, '-frames:v', '1', '-q:v', '3', dst);

export const mb = (p) => (fs.statSync(p).size / 1e6).toFixed(1) + ' MB';

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** CSV mínimo con soporte de comillas. */
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
};
