import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut} from '../core';
import {fit, type Face} from './Type';
import {font as brandFont} from '../../brand';

// Efectos de cámara y capas de luz del kit.

/** Sacudida de cámara que decae tras cada golpe (frames absolutos de la composición). */
export const Shake: React.FC<{hits: number[]; amp?: number; decay?: number; children: React.ReactNode}> = ({hits, amp = 18, decay = 5, children}) => {
  const frame = useCurrentFrame();
  let dx = 0;
  let dy = 0;
  let r = 0;
  let k = 0;
  for (const h of hits) {
    const f = frame - h;
    if (f < 0 || f > decay * 5) continue;
    const a = amp * Math.exp(-f / decay);
    k = Math.max(k, a / amp);
    dx += (random(`sx${h}-${frame}`) - 0.5) * 2 * a;
    dy += (random(`sy${h}-${frame}`) - 0.5) * 2 * a;
    r += (random(`sr${h}-${frame}`) - 0.5) * a * 0.08;
  }
  return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) rotate(${r}deg) scale(${1 + 0.04 * k})`}}>{children}</AbsoluteFill>;
};

/** Destello de luz cálida que cruza el cuadro (light leak), en modo "screen". */
export const LightLeak: React.FC<{at: number[]; dur?: number; colors?: [string, string]; strength?: number}> = ({
  at,
  dur = 18,
  colors = ['255,150,60', '255,60,90'],
  strength = 0.9,
}) => {
  const frame = useCurrentFrame();
  const active = at.map((a) => (frame - a) / dur).find((p) => p >= 0 && p <= 1);
  if (active === undefined) return null;
  const o = Math.sin(active * Math.PI) * strength;
  const x = interpolate(active, [0, 1], [-20, 120]);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: 'screen',
        opacity: o,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 45% at ${x}% 30%, rgba(${colors[0]},0.95), rgba(${colors[0]},0) 70%), radial-gradient(ellipse 50% 60% at ${x - 25}% 75%, rgba(${colors[1]},0.75), rgba(${colors[1]},0) 70%)`,
      }}
    />
  );
};

/** Barra de progreso fina arriba: le dice al cerebro "ya casi termina". */
export const Progress: React.FC<{total: number; color?: string; height?: number}> = ({total, color = '#fff', height = 7}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, height, width: `${(frame / total) * 100}%`, background: color, boxShadow: `0 0 18px ${color}`, opacity: 0.9}} />
  );
};

/** Partículas: burbujas que suben o plancton que flota. */
export const Particles: React.FC<{count?: number; kind?: 'bubbles' | 'plankton' | 'dust'; color?: string; seed?: string; speed?: number}> = ({
  count = 40,
  kind = 'bubbles',
  color = '255,255,255',
  seed = 'p',
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const depth = 0.3 + r('d') * 0.9;
        const size = kind === 'bubbles' ? 8 + 46 * depth * r('s') : kind === 'plankton' ? 3 + 9 * depth : 2 + 5 * depth;
        const vy = kind === 'bubbles' ? 9 * depth : kind === 'plankton' ? 1.2 : 0.7;
        const y = (((r('y') * 2200 - frame * vy * speed) % 2200) + 2200) % 2200 - 140;
        const x = r('x') * 1080 + Math.sin(frame / (14 + r('w') * 20) + i) * (kind === 'bubbles' ? 14 : 30);
        const tw = kind === 'plankton' ? 0.5 + 0.5 * Math.sin(frame / 6 + i * 1.7) : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              border: kind === 'bubbles' ? `${Math.max(1.5, size * 0.08)}px solid rgba(${color},0.75)` : undefined,
              background: kind === 'bubbles' ? `radial-gradient(circle at 30% 30%, rgba(${color},0.55), rgba(${color},0.05) 60%)` : `rgba(${color},${0.9 * tw})`,
              boxShadow: kind === 'plankton' ? `0 0 ${size * 2.5}px rgba(${color},${0.9 * tw})` : undefined,
              filter: depth < 0.5 ? `blur(${(0.5 - depth) * 8}px)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Video DENTRO de las letras: texto blanco sobre negro y el video encima en modo "multiply".
 * Con `expand` (frame local) las letras crecen hasta llenar la pantalla y el video queda completo.
 */
export const VideoText: React.FC<{
  from: number;
  to: number;
  id: number;
  text: string;
  y?: number;
  face?: Face;
  width?: number;
  expand?: number;
  origin?: string;
  trim?: number;
  bg?: string;
  textColor?: string;
}> = ({from, to, ...p}) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} name={`video en texto ${p.text}`}>
    <VideoTextInner {...p} dur={to - from} />
  </Sequence>
);
const VideoTextInner: React.FC<{
  id: number;
  text: string;
  y?: number;
  face?: Face;
  width?: number;
  expand?: number;
  origin?: string;
  trim?: number;
  dur: number;
  bg?: string;
  textColor?: string;
}> = ({id, text, y = 960, face = 'anton', width = 1000, expand, origin = '50% 50%', trim, dur, bg = '#000', textColor = '#fff'}) => {
  const frame = useCurrentFrame();
  const fs = fit(text, face, width);
  const e = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: easeOut});
  const grow = expand !== undefined ? interpolate(frame, [expand, Math.min(dur, expand + 12)], [1, 26], {...clamp, easing: (t) => t * t * t}) : 1;
  const family: Record<Face, React.CSSProperties> = {
    anton: {fontFamily: brandFont.impact},
    display: {fontFamily: brandFont.display, fontWeight: 900},
    displayItalic: {fontFamily: brandFont.display, fontWeight: 900, fontStyle: 'italic'},
    serif: {fontFamily: brandFont.serif, fontStyle: 'italic'},
    mono: {fontFamily: brandFont.mono, fontWeight: 700},
  };
  return (
    <AbsoluteFill style={{background: bg, isolation: 'isolate'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y - fs / 2,
          textAlign: 'center',
          ...family[face],
          fontSize: fs,
          lineHeight: 1,
          color: textColor,
          transform: `scale(${(0.85 + 0.15 * e) * grow})`,
          transformOrigin: origin,
          letterSpacing: `${0.2 * (1 - e)}em`,
        }}
      >
        {text}
      </div>
      <AbsoluteFill style={{mixBlendMode: bg === '#000' ? 'multiply' : 'screen'}}>
        <OffthreadVideo
          src={staticFile(`stock/${id}.mp4`)}
          muted
          trimBefore={trim ? Math.round(trim * 30) : undefined}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - 0.1 * (frame / dur)})`, filter: 'contrast(1.15) saturate(1.2) brightness(1.1)'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Barrido de luz blanca diagonal (para transiciones limpias). */
export const Sweep: React.FC<{at: number; dur?: number; color?: string; angle?: number}> = ({at, dur = 9, color = '255,255,255', angle = 20}) => {
  const frame = useCurrentFrame();
  const p = (frame - at) / dur;
  if (p < 0 || p > 1) return null;
  const x = interpolate(p, [0, 1], [-60, 160], {easing: easeInOut});
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        background: `linear-gradient(${90 + angle}deg, rgba(${color},0) ${x - 30}%, rgba(${color},0.75) ${x}%, rgba(${color},0) ${x + 30}%)`,
      }}
    />
  );
};

/** Bandas negras de cine que entran/salen. */
export const Bars: React.FC<{from: number; to: number; size?: number}> = ({from, to, size = 150}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], {...clamp, easing: easeOut});
  if (p <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: size * p, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: size * p, background: '#000'}} />
    </>
  );
};
