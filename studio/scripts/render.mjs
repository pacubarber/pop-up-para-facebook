// Renderiza composiciones y las deja listas para publicar.
//
//   node scripts/render.mjs Podcast Cafe          → solo esas
//   node scripts/render.mjs --all                 → todo el portafolio
//   node scripts/render.mjs Pitch --props p.json --out ../prospeccion/videos/x.mp4
//
// Por cada video: master (out/<id>.mp4, audio a -14 LUFS), versión web liviana
// (web/media/<slug>.mp4) y póster (web/media/<slug>.jpg).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {compress, finish, mb, poster} from './lib.mjs';
import {renderMedia, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(root, 'out');
const webMedia = path.resolve(root, '../web/media');

// id de composición → nombre de archivo en la web
export const PORTFOLIO = {
  Podcast: 'podcast-mente-fundadora',
  Cafe: 'anuncio-grano-alto',
  Inmobiliaria: 'inmobiliaria-casa-alameda',
  Saas: 'saas-flujo',
  Showreel: 'showreel-corte',
};

// segundo del video que se usa como portada en la web
const POSTER_AT = {Podcast: 13.6, Cafe: 4.6, Inmobiliaria: 6.6, Saas: 5.6, Showreel: 5.0};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const propsPath = flag('--props');
const customOut = flag('--out');
const noWeb = args.includes('--no-web');
const ids = args.includes('--all') ? Object.keys(PORTFOLIO) : args.filter((a) => !a.startsWith('--'));
if (!ids.length) {
  console.error('Uso: node scripts/render.mjs <Composición...> | --all');
  process.exit(1);
}
const inputProps = propsPath ? JSON.parse(fs.readFileSync(propsPath, 'utf8')) : {};
const browserExecutable = process.env.REMOTION_BROWSER || undefined;

const webVersion = (id, master, slug) => {
  fs.mkdirSync(webMedia, {recursive: true});
  const mp4 = path.join(webMedia, `${slug}.mp4`);
  compress(master, mp4);
  poster(master, path.join(webMedia, `${slug}.jpg`), POSTER_AT[id]);
  return mp4;
};

fs.mkdirSync(outDir, {recursive: true});
// El showreel monta los videos ya renderizados: los copiamos a public/reel.
if (ids.some((id) => id.startsWith('Showreel'))) {
  const reel = path.join(root, 'public/reel');
  fs.mkdirSync(reel, {recursive: true});
  for (const [id, slug] of Object.entries(PORTFOLIO)) {
    if (id.startsWith('Showreel')) continue;
    const from = path.join(webMedia, `${slug}.mp4`);
    if (!fs.existsSync(from)) throw new Error(`Falta ${from}: renderiza ${id} antes del showreel.`);
    fs.copyFileSync(from, path.join(reel, `${slug}.mp4`));
  }
}
console.log('Empaquetando proyecto…');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});

for (const id of ids) {
  const t0 = Date.now();
  const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
  const raw = path.join(outDir, `${id}.raw.mp4`);
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 17,
    outputLocation: raw,
    inputProps,
    browserExecutable,
    concurrency: 4,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`\r${id}: ${p * 10}%`);
      }
    },
  });
  const master = customOut ? path.resolve(customOut) : path.join(outDir, `${id}.mp4`);
  fs.mkdirSync(path.dirname(master), {recursive: true});
  finish(raw, master);
  fs.rmSync(raw);
  let line = `\r✓ ${id} → ${path.relative(process.cwd(), master)} (${mb(master)})`;
  if (!noWeb && !customOut && PORTFOLIO[id]) {
    const web = webVersion(id, master, PORTFOLIO[id]);
    line += `  web: ${path.relative(process.cwd(), web)} (${mb(web)})`;
  }
  console.log(`${line}  [${((Date.now() - t0) / 1000).toFixed(0)}s]`);
}
