// Una escena: fondo, cámara lenta, gráficos y textos, con su transición de entrada.
// La escena anterior sigue visible debajo mientras dura la entrada de la siguiente.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Grafico} from './graficos';
import {Texto} from './Texto';
import type {Ctx, Entrada, Escena} from './tipos';
import {clamp, col, easeIO, easeIn, easeOut, esClaro, lerp} from './util';

const DUR: Record<Entrada['tipo'], number> = {corte: 0, barrido: 0.3, empuje: 0.34, zoom: 0.34, circulo: 0.5, diagonal: 0.42};

export const durEntrada = (e?: Entrada) => (e ? (e.dur ?? DUR[e.tipo] ?? 0) : 0);

/** Recorta el cuadro W×H al semiplano n·p ≤ d (d avanza con p de una esquina a la opuesta). */
const semiplano = (W: number, H: number, anguloDeg: number, p: number) => {
  const a = (anguloDeg * Math.PI) / 180;
  const n = [Math.cos(a), Math.sin(a)];
  const pts = [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ];
  const ds = pts.map((q) => q[0] * n[0] + q[1] * n[1]);
  const d = lerp(Math.min(...ds), Math.max(...ds), p);
  const poly: number[][] = [];
  const borde: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const A = pts[i];
    const B = pts[(i + 1) % 4];
    const da = ds[i] - d;
    const db = ds[(i + 1) % 4] - d;
    if (da <= 0) poly.push(A);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const k = da / (da - db);
      const X = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
      poly.push(X);
      borde.push(X);
    }
  }
  return {poly, borde};
};

type Estilo = {transform: string[]; filter: string[]; opacity: number; clipPath?: string};

const desplazar = (dir: Entrada['dir'], q: number, W: number, H: number) => {
  switch (dir ?? 'arriba') {
    case 'arriba':
      return `translateY(${q * H}px)`;
    case 'abajo':
      return `translateY(${-q * H}px)`;
    case 'izq':
      return `translateX(${q * W}px)`;
    default:
      return `translateX(${-q * W}px)`;
  }
};

const entrada = (en: Entrada, p: number, W: number, H: number, s: Estilo) => {
  const e = easeOut(p, 4);
  switch (en.tipo) {
    case 'barrido':
    case 'empuje':
      s.transform.push(desplazar(en.dir, 1 - e, W, H));
      if (p < 1) s.filter.push(`blur(${Math.sin(Math.PI * p) * 12}px)`);
      break;
    case 'zoom':
      s.transform.push(`scale(${lerp(1.9, 1, e)})`);
      s.opacity *= clamp(p / 0.4);
      if (p < 1) s.filter.push(`blur(${(1 - e) * 16}px)`);
      break;
    case 'circulo':
      s.clipPath = `circle(${easeIO(p) * 145}% at ${en.x ?? W / 2}px ${en.y ?? H / 2}px)`;
      break;
    case 'diagonal': {
      const {poly} = semiplano(W, H, en.angulo ?? 55, easeIO(p));
      s.clipPath = poly.length ? `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})` : 'polygon(0 0,0 0,0 0)';
      break;
    }
    default:
      break;
  }
};

const salida = (en: Entrada, p: number, W: number, H: number, s: Estilo) => {
  switch (en.tipo) {
    case 'barrido':
      s.transform.push(desplazar(en.dir, -0.3 * easeOut(p, 4), W, H));
      s.filter.push(`brightness(${1 - 0.35 * p})`);
      break;
    case 'empuje':
      s.transform.push(desplazar(en.dir, -easeOut(p, 4), W, H));
      if (p < 1) s.filter.push(`blur(${Math.sin(Math.PI * p) * 12}px)`);
      break;
    case 'zoom':
      s.transform.push(`scale(${lerp(1, 2.4, easeIn(p, 2))})`);
      s.opacity *= 1 - clamp(p / 0.6);
      break;
    default:
      break;
  }
};

export const EscenaVista: React.FC<{e: Escena; sig?: Escena; ctx: Ctx}> = ({e, sig, ctx}) => {
  const {t, W, H, tema} = ctx;
  const desde = e.desde as number;
  const hasta = e.hasta as number;
  const ent = e.entrada ?? {tipo: 'corte'};
  const dIn = durEntrada(ent);
  const dOut = sig ? durEntrada(sig.entrada) : 0;
  if (t < desde || t >= hasta + dOut) return null;

  const s: Estilo = {transform: [], filter: [], opacity: 1};
  if (dIn > 0 && t < desde + dIn) entrada(ent, clamp((t - desde) / dIn), W, H, s);
  if (sig?.entrada && dOut > 0 && t >= (sig.desde as number)) salida(sig.entrada, clamp((t - (sig.desde as number)) / dOut), W, H, s);

  const fondo = col(e.fondo ?? 'hueso', tema);
  const sctx: Ctx = {...ctx, tinta: esClaro(fondo) ? tema.tinta : tema.hueso};
  const u = clamp((t - desde) / Math.max(0.01, hasta - desde));
  const cam = e.camara;
  const z = cam?.zoom ? lerp(cam.zoom[0], cam.zoom[1], easeIO(u)) : 1;
  const cx = cam?.x ? lerp(cam.x[0], cam.x[1], easeIO(u)) : 0;
  const cy = cam?.y ? lerp(cam.y[0], cam.y[1], easeIO(u)) : 0;
  const graficos = e.graficos ?? [];

  let borde: React.ReactNode = null;
  if (ent.tipo === 'diagonal' && t < desde + dIn) {
    const p = easeIO(clamp((t - desde) / dIn));
    const pts = semiplano(W, H, ent.angulo ?? 55, p).borde;
    if (pts.length === 2)
      borde = (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} stroke={col('acento', tema)} strokeWidth={14} strokeLinecap="round" />
        </svg>
      );
  }

  return (
    <>
      <AbsoluteFill
        style={{
          background: fondo,
          transform: s.transform.join(' ') || undefined,
          filter: s.filter.join(' ') || undefined,
          opacity: s.opacity,
          clipPath: s.clipPath,
          overflow: 'hidden',
        }}
      >
        <AbsoluteFill style={{transform: `translate(${cx}px, ${cy}px) scale(${z})`}}>
          {graficos.filter((g) => !g.encima).map((g, i) => (
            <Grafico key={`g${i}`} g={g} ctx={sctx} />
          ))}
          {(e.textos ?? []).map((b, i) => (
            <Texto key={`t${i}`} b={b} ctx={sctx} />
          ))}
          {graficos.filter((g) => g.encima).map((g, i) => (
            <Grafico key={`e${i}`} g={g} ctx={sctx} />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>
      {borde}
    </>
  );
};
