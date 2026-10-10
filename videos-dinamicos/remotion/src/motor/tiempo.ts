// Convierte las referencias a la voz ("@L3/cuarto+0.1") en segundos y calcula la duración del video.
import type {CalculateMetadataFunction} from 'remotion';
import {staticFile} from 'remotion';
import type {Bloque, InfoSonido, Palabra, Props, Spec, Tiempo, VozData} from './tipos';

export const normaliza = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const REF = /^@(?:L(\d+)(?:\/([^#.+\-]+)(?:#(\d+))?)?|([^#.+\-/\s]+)(?:#(\d+))?)(\.fin)?([+-]\d*\.?\d+)?$/;

const palabrasDe = (voz: VozData) => voz.lineas.flatMap((l) => l.palabras);

export const tiempo = (v: Tiempo, voz: VozData | null | undefined): number => {
  if (typeof v === 'number') return v;
  const m = REF.exec(v.trim());
  if (!m) throw new Error(`Tiempo no válido: "${v}"`);
  const [, linea, enLinea, nLinea, palabra, nPalabra, fin, desfase] = m;
  const off = desfase ? parseFloat(desfase) : 0;
  if (palabra === 'fin' && !nPalabra) {
    if (!voz) throw new Error('"@fin" necesita una voz');
    return voz.dur + off;
  }
  if (!voz) throw new Error(`"${v}" necesita una voz`);
  let w: Palabra | undefined;
  if (linea) {
    const l = voz.lineas[parseInt(linea, 10) - 1];
    if (!l) throw new Error(`"${v}": no hay línea ${linea}`);
    if (!enLinea) return (fin ? l.fin : l.inicio) + off;
    w = l.palabras.filter((p) => normaliza(p.texto) === normaliza(enLinea))[(nLinea ? parseInt(nLinea, 10) : 1) - 1];
  } else {
    w = palabrasDe(voz).filter((p) => normaliza(p.texto) === normaliza(palabra))[(nPalabra ? parseInt(nPalabra, 10) : 1) - 1];
  }
  if (!w) throw new Error(`"${v}": esa palabra no está en la voz`);
  return (fin ? w.fin : w.inicio) + off;
};

/** Recorre todo el JSON y reemplaza cada "@…" por segundos (menos dentro de "texto"). */
const resolverTodo = (x: unknown, voz: VozData | null | undefined, key?: string): unknown => {
  if (typeof x === 'string' && x.startsWith('@') && key !== 'texto') return tiempo(x, voz);
  if (Array.isArray(x)) return x.map((y) => resolverTodo(y, voz, key));
  if (x && typeof x === 'object')
    return Object.fromEntries(Object.entries(x as Record<string, unknown>).map(([k, y]) => [k, resolverTodo(y, voz, k)]));
  return x;
};

/** Momento en que la voz dice cada palabra del bloque (para "sync"). */
const sincronizar = (b: Bloque, desde: number, voz: VozData): number[] => {
  const todas = palabrasDe(voz);
  const t0 = (b.en as number | undefined) ?? desde;
  let i = todas.findIndex((p) => p.inicio >= t0 - 0.3);
  if (i < 0) i = todas.length;
  let prev = t0;
  return b.texto.split(/\s+/).map((tok) => {
    const n = normaliza(tok);
    if (!n) return prev;
    for (let j = i; j < Math.min(todas.length, i + 7); j++) {
      if (normaliza(todas[j].texto) === n) {
        i = j + 1;
        prev = Math.max(prev, todas[j].inicio);
        return prev;
      }
    }
    prev += 0.12;
    return prev;
  });
};

export const resolver = (spec: Spec, voz: VozData | null | undefined): Spec => {
  const s = resolverTodo(spec, voz) as Spec;
  s.escenas.forEach((e, i) => {
    const sig = s.escenas[i + 1];
    if (e.hasta === undefined && sig) e.hasta = sig.desde;
    for (const b of e.textos ?? []) {
      if (b.sync && voz) b._palabras = sincronizar(b, e.desde as number, voz);
      if (b.en === undefined) b.en = b._palabras?.[0] ?? (e.desde as number);
    }
  });
  if (s.duracion === undefined) s.duracion = voz ? voz.dur + 0.3 : 10;
  const ultima = s.escenas[s.escenas.length - 1];
  if (ultima && ultima.hasta === undefined) ultima.hasta = s.duracion;
  return s;
};

const leerJson = async <T,>(ruta: string): Promise<T | null> => {
  const r = await fetch(staticFile(ruta));
  if (!r.ok) return null;
  return (await r.json()) as T;
};

export const calcular: CalculateMetadataFunction<Props> = async ({props}) => {
  const spec = props.spec;
  const fps = spec.fps ?? 30;
  let voz: VozData | null = null;
  if (spec.voz) {
    voz = await leerJson<VozData>(spec.voz.archivo.replace(/\.\w+$/, '.json'));
    if (!voz) throw new Error(`Falta public/${spec.voz.archivo}: corre "python3 preparar.py videos/${spec.nombre}.json"`);
  }
  const sfx = (await leerJson<Record<string, InfoSonido>>('sonidos/indice.json')) ?? {};
  for (const s of spec.sonidos ?? [])
    if (!sfx[s.id]) throw new Error(`Falta el efecto "${s.id}": corre "python3 preparar.py videos/${spec.nombre}.json"`);
  const resuelto = resolver(spec, voz);
  return {
    fps,
    width: spec.ancho ?? 1080,
    height: spec.alto ?? 1920,
    durationInFrames: Math.round((resuelto.duracion as number) * fps),
    props: {spec: resuelto, voz, sfx},
  };
};
