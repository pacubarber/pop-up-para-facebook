// Genera videos de prospección personalizados (uno por cliente) + el mensaje listo para enviar.
//
// Un cliente:
//   npm run pitch -- --nombre "Laura" --negocio "Panadería La Espiga" --handle "@laespiga.pan" \
//                    --nicho restaurante --color "#D9822B" --ciudad "Guadalajara"
// Todos los pendientes de la lista (estado vacío o "por_contactar"):
//   npm run pitch -- --csv ../prospeccion/leads.csv
//
// Salida: prospeccion/videos/<slug>.mp4 (+ .jpg) y prospeccion/mensajes/<slug>.md
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {compress, finish, mb, parseCsv, poster, slugify} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const prosp = path.resolve(root, '../prospeccion');
const nichos = JSON.parse(fs.readFileSync(path.join(root, 'src/data/nichos.json'), 'utf8'));

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};

// ---------------------------------------------------------------- prospectos
let leads;
if (opt('csv')) {
  leads = parseCsv(fs.readFileSync(path.resolve(opt('csv')), 'utf8')).filter(
    (r) => r.negocio && (!r.estado || r.estado === 'por_contactar'),
  );
} else {
  if (!opt('nombre') || !opt('negocio')) {
    console.error('Faltan datos. Ejemplo:\n  npm run pitch -- --nombre "Laura" --negocio "Panadería La Espiga" --handle "@laespiga.pan" --nicho restaurante --color "#D9822B"');
    process.exit(1);
  }
  leads = [
    {
      nombre: opt('nombre'),
      nombre_voz: opt('nombre-voz'),
      negocio: opt('negocio'),
      negocio_voz: opt('negocio-voz'),
      handle: opt('handle') ?? '',
      nicho: opt('nicho') ?? 'otro',
      ciudad: opt('ciudad') ?? '',
      color: opt('color') ?? '#FF3B1F',
      firma: opt('firma'),
    },
  ];
}
if (!leads.length) {
  console.log('No hay prospectos pendientes en la lista.');
  process.exit(0);
}

const validColor = (c) => (/^#[0-9a-f]{6}$/i.test(c ?? '') ? c : '#FF3B1F');

// ---------------------------------------------------------------- 1) locuciones
const voDir = path.join(root, 'public/vo');
const specDir = path.join(root, '.cache/pitch');
fs.mkdirSync(specDir, {recursive: true});

const jobs = leads.map((l) => {
  const slug = slugify(`${l.negocio}`) || slugify(l.nombre);
  const nombre = l.nombre_voz || l.nombre;
  const negocio = l.negocio_voz || l.negocio;
  const spec = {
    name: `pitch-${slug}`,
    lead: 0.35,
    gap: 0.3,
    voices: {voz: {model: process.env.PITCH_VOICE || 'es_MX-claude-high', speed: 1.04}},
    lines: [
      {voice: 'voz', text: `Hola, ${nombre}.`, gap: 0.35},
      {voice: 'voz', text: `Vi el perfil de ${negocio} y preparé este video solo para ti.`, gap: 0.55},
      {voice: 'voz', text: 'Así se verían tus videos con edición profesional:', gap: 0.25},
      {voice: 'voz', text: 'subtítulos que enganchan, cortes con ritmo, y tu marca en cada segundo.', gap: 0.5},
      {voice: 'voz', text: `Te dejo tres ideas de contenido para ${negocio}.`, gap: 2.6},
      {voice: 'voz', text: 'Tu primer video te lo edito gratis. Responde a este mensaje y empezamos.'},
    ],
  };
  const specPath = path.join(specDir, `${slug}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 1));
  return {lead: l, slug, specPath};
});

console.log(`Generando ${jobs.length} locución(es)…`);
execFileSync('python3', [path.join(root, 'tools/tts.py'), ...jobs.map((j) => j.specPath)], {stdio: ['ignore', 'inherit', 'inherit']});

// ---------------------------------------------------------------- 2) render
console.log('Empaquetando proyecto…');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
fs.mkdirSync(path.join(prosp, 'videos'), {recursive: true});
fs.mkdirSync(path.join(prosp, 'mensajes'), {recursive: true});

for (const {lead: l, slug} of jobs) {
  const vo = JSON.parse(fs.readFileSync(path.join(voDir, `pitch-${slug}.json`), 'utf8'));
  const nicho = nichos[l.nicho] ? l.nicho : 'otro';
  const inputProps = {
    nombre: l.nombre,
    negocio: l.negocio,
    handle: l.handle || '',
    nicho,
    colorMarca: validColor(l.color),
    ciudad: l.ciudad || undefined,
    firma: l.firma || process.env.PITCH_FIRMA || 'el equipo de CORTE',
    vo,
  };
  const composition = await selectComposition({serveUrl, id: 'Pitch', inputProps, browserExecutable});
  const raw = path.join(root, 'out', `pitch-${slug}.raw.mp4`);
  const master = path.join(root, 'out', `pitch-${slug}.mp4`);
  fs.mkdirSync(path.dirname(raw), {recursive: true});
  await renderMedia({composition, serveUrl, codec: 'h264', crf: 18, outputLocation: raw, inputProps, browserExecutable, concurrency: 4, imageFormat: 'jpeg', jpegQuality: 90});
  finish(raw, master);
  fs.rmSync(raw);
  const video = path.join(prosp, 'videos', `${slug}.mp4`);
  compress(master, video, 25);
  poster(master, path.join(prosp, 'videos', `${slug}.jpg`), 2.2);

  // ---------------------------------------------------------------- 3) mensaje
  const ideas = nichos[nicho].ideas;
  const msg = `# ${l.negocio} — mensaje de prospección

Video: \`prospeccion/videos/${slug}.mp4\` (${mb(video)})

## DM de Instagram (enviar el video primero, luego este texto)

Hola ${l.nombre} 👋 Vi el perfil de ${l.negocio} y te preparé este video de ${Math.round(vo.duration + 1.6)} segundos para mostrarte cómo se verían tus reels con edición profesional (subtítulos, ritmo y tu color de marca).

Además se me ocurrieron 3 ideas para tu cuenta:
1. ${ideas[0]}
2. ${ideas[1]}
3. ${ideas[2]}

Si te interesa, edito tu primer video gratis, sin compromiso. ¿Te lo mando? Solo responde «QUIERO».

## Email

**Asunto:** ${l.nombre}, te hice un video para ${l.negocio}

Hola ${l.nombre},

Soy de CORTE, un estudio de edición de video para marcas y creadores. Revisé el contenido de ${l.negocio}${l.handle ? ` (${l.handle})` : ''} y preparé un video corto solo para ti: [enlace al video]

Tres ideas que creo que funcionarían muy bien en tu cuenta:
- ${ideas[0]}
- ${ideas[1]}
- ${ideas[2]}

Te propongo algo simple: me mandas un video en bruto y te lo devuelvo editado en 72 horas, gratis. Si te gusta, hablamos de un plan mensual; si no, te lo quedas igual.

¿Te parece?

— ${inputProps.firma === 'el equipo de CORTE' ? 'CORTE · Estudio de edición de video' : `${inputProps.firma} · CORTE`}
cortestudio.co · @corte.studio

## Seguimiento (si no responde en 3 días)

Hola ${l.nombre}, ¿alcanzaste a ver el video que te hice para ${l.negocio}? La oferta del primer video gratis sigue en pie 🙌
`;
  fs.writeFileSync(path.join(prosp, 'mensajes', `${slug}.md`), msg);
  console.log(`✓ ${l.negocio} → prospeccion/videos/${slug}.mp4 (${mb(video)}) + mensajes/${slug}.md`);
}
