// Capas que viven por encima de todas las escenas ("capas": [{"tipo": "regla", …}]).
import React from 'react';
import {staticFile} from 'remotion';
import {familia} from './fuentes';
import type {Capa as CapaT, Ctx} from './tipos';
import {clamp, col, easeIn, easeOut, lerp, prog} from './util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = Record<string, any>;

/** Regla de progreso con una marca por truco: se llenan al cumplirse, la última es un "?" hasta revelarse,
 *  y al final el cabezal rebobina a cero (empalma con el inicio). */
const Regla: React.FC<{c: C; ctx: Ctx}> = ({c, ctx}) => {
  const {t, tema} = ctx;
  const {y = 1660, x0 = 150, x1 = 930, r = 34} = c;
  const marcas: number[] = c.marcas;
  const n = marcas.length;
  const xs = marcas.map((_, k) => x0 + ((x1 - x0) * (k + 1)) / n);
  const aparece = c.en ?? 0;
  if (t < aparece) return null;
  const entra = aparece <= 0 ? 1 : easeOut(prog(t, aparece, 0.4));
  // cabezal: avanza por tramos hasta cada marca; después de la última, hasta el final del video
  const tiempos = [0, ...marcas, ctx.dur];
  const puntos = [x0, ...xs, x1 + 0.0001];
  let cab = x0;
  for (let k = 0; k < tiempos.length - 1; k++) {
    if (t >= tiempos[k]) cab = lerp(puntos[k], Math.min(puntos[k + 1], x1), clamp((t - tiempos[k]) / (tiempos[k + 1] - tiempos[k])));
  }
  const rb = c.rebobina as [number, number] | undefined;
  let cabRebobinado = cab;
  if (rb && t >= rb[0]) {
    const desde = lerp(puntos[n], x1, clamp((rb[0] - marcas[n - 1]) / (ctx.dur - marcas[n - 1])));
    cabRebobinado = lerp(desde, x0, easeIn(prog(t, rb[0], rb[1] - rb[0]), 2));
    cab = cabRebobinado;
  }
  const tinta = ctx.tinta;
  const acento = col('acento', tema);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: entra, transform: `translateY(${(1 - entra) * 40}px)`}}>
      <div style={{position: 'absolute', left: x0, width: x1 - x0, top: y - 3, height: 6, borderRadius: 3, background: tinta, opacity: 0.22}} />
      <div style={{position: 'absolute', left: x0, width: Math.max(0, cab - x0), top: y - 3, height: 6, borderRadius: 3, background: acento}} />
      <div style={{position: 'absolute', left: cab - 11, top: y - 11, width: 22, height: 22, borderRadius: 11, background: acento}} />
      {xs.map((x, k) => {
        const lleno = t >= marcas[k] && !(rb && t >= rb[0] && cab < x);
        const misterio = k === c.misterio && (c.revela === undefined || t < c.revela);
        const lt = t - marcas[k];
        const s = lleno && lt < 0.5 ? 1 + 0.35 * Math.exp(-lt * 9) * Math.cos(lt * 18) : 1;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              border: `5px solid ${lleno ? acento : tinta}`,
              background: lleno ? acento : col(c.fondoMarca ?? 'transparent', tema),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: familia.mono,
              fontWeight: 700,
              fontSize: r * 0.95,
              color: lleno ? col('hueso', tema) : tinta,
              transform: `scale(${s})`,
              boxSizing: 'border-box',
            }}
          >
            {misterio ? '?' : (c.etiquetas?.[k] ?? k + 1)}
          </div>
        );
      })}
    </div>
  );
};

/** Rótulo fijo que cambia de texto en ciertos momentos (sube el nuevo, se va el anterior). */
const Rotulo: React.FC<{c: C; ctx: Ctx}> = ({c, ctx}) => {
  const {t, tema} = ctx;
  const cambios: {t: number; texto: string}[] = c.cambios;
  let k = -1;
  cambios.forEach((ch, i) => {
    if (t >= ch.t) k = i;
  });
  if (k < 0 || cambios[k].texto === '') return null;
  const lt = t - cambios[k].t;
  const e = cambios[k].t <= 0 ? 1 : easeOut(lt / 0.3, 4);
  const al = c.alinear ?? 'izq';
  return (
    <div
      style={{
        position: 'absolute',
        top: c.y ?? 120,
        left: al === 'izq' ? (c.x ?? 70) : undefined,
        right: al === 'der' ? ctx.W - (c.x ?? ctx.W - 70) : undefined,
        overflow: 'hidden',
        fontFamily: familia[(c.fuente as keyof typeof familia) ?? 'mono'],
        fontWeight: c.peso ?? 700,
        fontSize: c.tam ?? 32,
        letterSpacing: c.tracking ?? '0.12em',
        color: col(c.color ?? ctx.tinta, tema),
        padding: '4px 0',
      }}
    >
      <div style={{transform: `translateY(${(1 - e) * 110}%)`, display: 'flex', alignItems: 'center', gap: 14}}>
        {cambios[k].texto}
      </div>
    </div>
  );
};

/** Grano de película (textura de public/grano.png que se mueve cada fotograma). */
const Grano: React.FC<{c: C; ctx: Ctx}> = ({c, ctx}) => {
  const f = Math.floor(ctx.t * ctx.fps);
  const ox = (f * 197) % 512;
  const oy = (f * 331) % 512;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${staticFile('grano.png')})`,
        backgroundSize: '512px 512px',
        backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'overlay',
        opacity: c.opacidad ?? 0.08,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Viñeta suave en los bordes. */
const Vineta: React.FC<{c: C; ctx: Ctx}> = ({c}) => (
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(12,12,14,1) 130%)', opacity: c.opacidad ?? 0.35}} />
);

const CAPAS: Record<string, React.FC<{c: C; ctx: Ctx}>> = {regla: Regla, rotulo: Rotulo, grano: Grano, vineta: Vineta};

export const Capa: React.FC<{c: CapaT; ctx: Ctx}> = ({c, ctx}) => {
  const K = CAPAS[c.tipo];
  if (!K) throw new Error(`Capa desconocida: "${c.tipo}"`);
  if (c.hasta !== undefined && ctx.t >= (c.hasta as number)) return null;
  return <K c={c} ctx={ctx} />;
};
