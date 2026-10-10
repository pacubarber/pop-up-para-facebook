// Renderiza los videos descritos en JSON.
//
//   node render.mjs videos/corte-4-trucos-b.json                  → ../salida/<nombre>.mp4 (+ póster .jpg)
//   node render.mjs videos/corte-4-trucos-b.json --frames 1.2,8.5  → out/<nombre>-<t>.jpg para revisar
//   node render.mjs videos/corte-4-trucos-b.json --desde 10 --hasta 16   → solo ese tramo, en out/
//
// Antes: python3 preparar.py videos/<nombre>.json (voz, efectos, fuentes y grano en public/).
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const salida = path.resolve(here, '../salida');
const out = path.join(here, 'out');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const frames = flag('--frames');
const desde = flag('--desde');
const hasta = flag('--hasta');
const archivos = args.filter((a) => a.endsWith('.json'));
if (!archivos.length) {
  console.error('Uso: node render.mjs videos/<nombre>.json [--frames 1.0,2.5] [--desde s --hasta s]');
  process.exit(1);
}

// En la nube usamos el Chromium de Playwright; en tu equipo Remotion descarga el suyo.
const navegador = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  const shell = fs.readdirSync(base).find((d) => d.startsWith('chromium_headless_shell'));
  const p = shell && path.join(base, shell, 'chrome-linux', 'headless_shell');
  return p && fs.existsSync(p) ? p : undefined;
};
const browserExecutable = navegador();

const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], {stdio: ['ignore', 'pipe', 'pipe']});

/** Audio a −14 LUFS / −1.5 dBTP (dos pasadas de loudnorm) sin recomprimir la imagen. */
const normalizar = (raw, final) => {
  const {stderr} = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], {encoding: 'utf8'});
  const m = JSON.parse(stderr.slice(stderr.lastIndexOf('{')));
  ff(
    '-i', raw,
    '-af', `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', final,
  );
};

console.log('Empaquetando…');
const serveUrl = await bundle({entryPoint: path.join(here, 'src/index.ts'), publicDir: path.join(here, 'public')});
fs.mkdirSync(out, {recursive: true});

for (const archivo of archivos) {
  const spec = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const inputProps = {spec, voz: null, sfx: null};
  const composition = await selectComposition({serveUrl, id: spec.nombre, inputProps, browserExecutable, logLevel: 'error'});
  const fps = composition.fps;
  const t0 = Date.now();

  if (frames) {
    for (const s of frames.split(',')) {
      const f = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(s) * fps));
      const dst = path.join(out, `${spec.nombre}-${s}.jpg`);
      await renderStill({composition, serveUrl, frame: f, output: dst, inputProps, browserExecutable, imageFormat: 'jpeg', jpegQuality: 90, logLevel: 'error'});
      console.log(dst);
    }
    continue;
  }

  const tramo = desde !== undefined || hasta !== undefined;
  const frameRange = tramo
    ? [Math.round(parseFloat(desde ?? '0') * fps), Math.min(composition.durationInFrames - 1, Math.round(parseFloat(hasta ?? '1e9') * fps))]
    : undefined;
  const raw = path.join(out, `${spec.nombre}.raw.mp4`);
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 20,
    encodingMaxRate: '5M',
    encodingBufferSize: '10M',
    x264Preset: 'medium',
    outputLocation: raw,
    inputProps,
    browserExecutable,
    concurrency: Math.max(1, os.cpus().length),
    imageFormat: 'jpeg',
    jpegQuality: 92,
    frameRange,
    timeoutInMilliseconds: 120000,
    logLevel: 'error',
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 20);
      if (p !== ultimo) {
        ultimo = p;
        process.stdout.write(`\r${spec.nombre}: ${p * 5}%`);
      }
    },
  });
  const final = tramo ? path.join(out, `${spec.nombre}-tramo.mp4`) : path.join(salida, `${spec.nombre}.mp4`);
  normalizar(raw, final);
  fs.rmSync(raw);
  if (!tramo) ff('-ss', String(spec.poster ?? 1.0), '-i', final, '-frames:v', '1', '-q:v', '3', final.replace(/\.mp4$/, '.jpg'));
  const mb = (fs.statSync(final).size / 1e6).toFixed(1);
  console.log(`\r✓ ${path.relative(process.cwd(), final)} (${mb} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
