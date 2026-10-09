import React from 'react';
import {interpolate, random, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {font as brandFont} from '../../brand';
import {clamp, easeIn, easeInOut, easeOut} from '../core';
import metrics from './metrics.json';

// Efectos de texto del kit. Todos se colocan en la línea de tiempo con from/to (frames)
// y animan su entrada y su salida dentro de ese tramo.

export type Face = 'anton' | 'display' | 'displayItalic' | 'serif' | 'mono';
const FAMILY: Record<Face, React.CSSProperties> = {
  anton: {fontFamily: brandFont.impact, fontWeight: 400},
  display: {fontFamily: brandFont.display, fontWeight: 900},
  displayItalic: {fontFamily: brandFont.display, fontWeight: 900, fontStyle: 'italic'},
  serif: {fontFamily: brandFont.serif, fontWeight: 400, fontStyle: 'italic'},
  mono: {fontFamily: brandFont.mono, fontWeight: 700},
};

/** Ancho del texto en `em` según las medidas reales de la fuente. */
export const textWidth = (text: string, face: Face, ls = 0) => {
  if (face === 'mono') return text.length * (0.6 + ls);
  const w = (metrics as Record<string, {widths: Record<string, number>}>)[face].widths;
  let sum = 0;
  for (const c of text) sum += w[c] ?? w.M ?? 0.6;
  return sum + ls * Math.max(0, text.length - 1);
};
/** Tamaño de letra para que `text` ocupe exactamente `width` px. */
export const fit = (text: string, face: Face, width: number, ls = 0, max = 1400) => Math.min(max, width / textWidth(text, face, ls));

type Timed = {from: number; to: number};
const timed = <P extends {dur: number}>(Inner: React.FC<P>, label: string) => {
  const C: React.FC<Omit<P, 'dur'> & Timed> = ({from, to, ...rest}) => (
    <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none" name={label}>
      <Inner {...({...rest, dur: to - from} as unknown as P)} />
    </Sequence>
  );
  return C;
};

// Contenedor absoluto que centra aunque el texto sea más ancho que la pantalla (se desborda por igual a ambos lados).
const abs = (y: number, align: 'center' | 'left' | 'right' = 'center', x = 60): React.CSSProperties => ({
  position: 'absolute',
  left: align === 'right' ? undefined : align === 'center' ? 0 : x,
  right: align === 'left' ? undefined : align === 'center' ? 0 : x,
  top: y,
  display: 'flex',
  flexDirection: 'column',
  alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
  textAlign: align,
  whiteSpace: 'nowrap',
});

const outlineStyle = (px: number, color: string): React.CSSProperties => ({
  color: 'transparent',
  WebkitTextStroke: `${px}px ${color}`,
});

const rgb = (d: number) => (d > 0.3 ? `${d}px 0 0 rgba(255,40,60,0.85), ${-d}px 0 0 rgba(30,230,255,0.85)` : undefined);

// ---------------------------------------------------------------- palabra gigante
export type GiantProps = {
  text: string;
  /** centro vertical (px) */
  y: number;
  face?: Face;
  width?: number;
  size?: number;
  color?: string;
  outline?: number;
  ls?: number;
  enter?: 'track' | 'rise' | 'scale' | 'drop' | 'wipe' | 'none';
  exit?: 'fade' | 'up' | 'scale' | 'cut' | 'blur';
  enterDur?: number;
  rotate?: number;
  opacity?: number;
  shadow?: boolean;
  /** escala continua mientras está en pantalla [inicio, fin] */
  drift?: [number, number];
  /** desplazamiento horizontal continuo (px) */
  slide?: [number, number];
};

const GiantInner: React.FC<GiantProps & {dur: number}> = ({
  text,
  y,
  face = 'anton',
  width = 1000,
  size,
  color = '#fff',
  outline,
  ls = 0,
  enter = 'track',
  exit = 'cut',
  enterDur = 12,
  rotate = 0,
  opacity = 1,
  shadow,
  drift = [1, 1.04],
  slide,
  dur,
}) => {
  const frame = useCurrentFrame();
  const fs = size ?? fit(text, face, width, ls);
  const e = interpolate(frame, [0, enterDur], [0, 1], {...clamp, easing: easeOut});
  const x = interpolate(frame, [dur - 6, dur], [0, 1], {...clamp, easing: easeIn});
  let spacing = ls;
  let scale = interpolate(frame, [0, dur], drift, clamp);
  let op = opacity;
  let ty = 0;
  let blur = 0;
  if (enter === 'track') {
    spacing = ls + 0.4 * (1 - e);
    op *= interpolate(frame, [0, 5], [0, 1], clamp);
    scale *= 1 + 0.06 * (1 - e);
  } else if (enter === 'scale') {
    scale *= 1 + 0.9 * (1 - e);
    blur = 18 * (1 - e);
    op *= interpolate(frame, [0, 3], [0, 1], clamp);
  }
  if (exit === 'fade') op *= 1 - x;
  if (exit === 'up') {
    ty = -fs * 0.25 * x;
    op *= 1 - x;
  }
  if (exit === 'scale') {
    scale *= 1 + 0.5 * x;
    op *= 1 - x;
  }
  if (exit === 'blur') {
    blur += 20 * x;
    op *= 1 - x;
  }
  const tx = slide ? interpolate(frame, [0, dur], slide, clamp) : 0;
  const base: React.CSSProperties = {
    ...FAMILY[face],
    fontSize: fs,
    lineHeight: 1,
    letterSpacing: `${spacing}em`,
    color,
    ...(outline ? outlineStyle(outline, color) : {}),
    textShadow: shadow ? '0 20px 60px rgba(0,0,0,0.45)' : undefined,
  };
  const letters = [...text];
  const perLetter = enter === 'rise' || enter === 'drop' || enter === 'wipe';
  return (
    <div
      style={{
        ...abs(y - fs * 0.5),
        height: fs,
        opacity: op,
        transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`,
        filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
      }}
    >
      {perLetter ? (
        <span style={{...base, display: 'inline-block', overflow: enter === 'drop' ? 'visible' : 'hidden', paddingBottom: fs * 0.04}}>
          {letters.map((c, i) => {
            const st = i * 1.6;
            let tr = '';
            if (enter === 'rise') {
              const p = interpolate(frame, [st, st + 10], [0, 1], {...clamp, easing: easeOut});
              tr = `translateY(${(1 - p) * 105}%)`;
            } else if (enter === 'drop') {
              const sp = spring({frame: frame - st, fps: 30, config: {damping: 9, stiffness: 180, mass: 0.6}});
              tr = `translateY(${(1 - sp) * -900}px) rotate(${(1 - sp) * (random(`r${i}${text}`) - 0.5) * 60}deg)`;
            } else {
              const p = interpolate(frame, [st * 0.6, st * 0.6 + 6], [0, 1], clamp);
              return (
                <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateX(${(1 - p) * -30}px)`, whiteSpace: 'pre'}}>
                  {c}
                </span>
              );
            }
            return (
              <span key={i} style={{display: 'inline-block', transform: tr, whiteSpace: 'pre'}}>
                {c}
              </span>
            );
          })}
        </span>
      ) : (
        <span style={base}>{text}</span>
      )}
    </div>
  );
};
export const Giant = timed(GiantInner, 'texto gigante');

// ---------------------------------------------------------------- palabras que golpean
export type SlamWord = {text: string; at: number; color?: string; face?: Face; size?: number; br?: boolean};
const SlamInner: React.FC<{
  words: SlamWord[];
  y: number;
  size?: number;
  face?: Face;
  color?: string;
  align?: 'center' | 'left';
  exit?: 'up' | 'cut' | 'scale';
  dur: number;
  lineHeight?: number;
  shadow?: boolean;
}> = ({words, y, size = 150, face = 'display', color = '#fff', align = 'center', exit = 'cut', dur, lineHeight = 0.92, shadow = true}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [dur - 6, dur], [0, 1], {...clamp, easing: easeIn});
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top: y,
        textAlign: align,
        lineHeight,
        opacity: exit === 'cut' ? 1 : 1 - x,
        transform: exit === 'up' ? `translateY(${-80 * x}px)` : exit === 'scale' ? `scale(${1 + 0.4 * x})` : undefined,
      }}
    >
      {words.map((w, i) => {
        const f = frame - w.at;
        if (f < 0) return null;
        const e = interpolate(f, [0, 5], [0, 1], {...clamp, easing: easeOut});
        const fs = w.size ?? size;
        const r = (random(`slam${i}${w.text}`) - 0.5) * 6;
        return (
          <React.Fragment key={i}>
            {w.br && <br />}
            <span
              style={{
                ...FAMILY[w.face ?? face],
                display: 'inline-block',
                fontSize: fs,
                color: w.color ?? color,
                marginRight: fs * 0.22,
                transform: `scale(${1 + 1.3 * (1 - e)}) rotate(${r * (1 - e)}deg)`,
                filter: e < 1 ? `blur(${(1 - e) * 10}px)` : undefined,
                textShadow: [rgb(14 * (1 - interpolate(f, [0, 9], [0, 1], clamp))), shadow ? '0 10px 40px rgba(0,0,0,0.5)' : undefined].filter(Boolean).join(', ') || undefined,
              }}
            >
              {w.text}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
export const Slam = timed(SlamInner, 'palabras que golpean');

// ---------------------------------------------------------------- revelado por máscara (limpio)
const RevealInner: React.FC<{
  lines: string[];
  y: number;
  size?: number;
  face?: Face;
  color?: string | string[];
  align?: 'center' | 'left' | 'right';
  x?: number;
  stagger?: number;
  lineHeight?: number;
  exit?: 'up' | 'down' | 'fade' | 'cut';
  ls?: number;
  dur: number;
  shadow?: boolean;
}> = ({lines, y, size = 90, face = 'display', color = '#fff', align = 'center', x = 70, stagger = 3, lineHeight = 1.0, exit = 'up', ls = -0.01, dur, shadow = true}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 7, dur], [0, 1], {...clamp, easing: easeIn});
  return (
    <div style={{...abs(y, align, x), lineHeight}}>
      {lines.map((l, i) => {
        const p = interpolate(frame, [i * stagger, i * stagger + 11], [0, 1], {...clamp, easing: easeOut});
        let off = (1 - p) * 110;
        let op = 1;
        if (exit === 'up') off -= out * 110;
        if (exit === 'down') off += out * 110;
        if (exit === 'fade') op = 1 - out;
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: size * 0.06, marginBottom: -size * 0.06}}>
            <div
              style={{
                ...FAMILY[face],
                fontSize: size,
                letterSpacing: `${ls}em`,
                color: Array.isArray(color) ? color[i % color.length] : color,
                transform: `translateY(${off}%)`,
                opacity: op,
                textShadow: shadow ? '0 8px 30px rgba(0,0,0,0.45)' : undefined,
              }}
            >
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export const Reveal = timed(RevealInner, 'revelado');

// ---------------------------------------------------------------- máquina de escribir / decodificado
const ScrambleInner: React.FC<{
  text: string;
  y: number;
  size?: number;
  face?: Face;
  color?: string;
  align?: 'center' | 'left' | 'right';
  x?: number;
  speed?: number;
  mode?: 'scramble' | 'type';
  ls?: number;
  bg?: string;
  dur: number;
}> = ({text, y, size = 34, face = 'mono', color = '#fff', align = 'center', x = 70, speed = 1.2, mode = 'scramble', ls = 0.12, bg, dur}) => {
  const frame = useCurrentFrame();
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=';
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  const shown = [...text]
    .map((c, i) => {
      const at = i / speed;
      if (c === ' ') return frame >= at ? ' ' : mode === 'type' ? '' : ' ';
      if (frame >= at + (mode === 'scramble' ? 6 : 0)) return c;
      if (mode === 'type') return '';
      if (frame < at) return '';
      return glyphs[Math.floor(random(`g${i}-${frame}`) * glyphs.length)];
    })
    .join('');
  const typing = mode === 'type' && frame < text.length / speed + 6;
  return (
    <div style={{...abs(y, align, x), opacity: out}}>
      <span
        style={{
          ...FAMILY[face],
          fontSize: size,
          letterSpacing: `${ls}em`,
          color,
          background: bg,
          padding: bg ? `${size * 0.2}px ${size * 0.4}px` : undefined,
          textShadow: bg ? undefined : '0 4px 20px rgba(0,0,0,0.6)',
          whiteSpace: 'pre',
        }}
      >
        {shown}
        {typing && <span style={{opacity: Math.floor(frame / 4) % 2 ? 0 : 1}}>▌</span>}
      </span>
    </div>
  );
};
export const Scramble = timed(ScrambleInner, 'decodificado');

// ---------------------------------------------------------------- contador
const CountInner: React.FC<{
  value: [number, number];
  y: number;
  size?: number;
  face?: Face;
  color?: string;
  prefix?: string;
  suffix?: string;
  suffixSize?: number;
  roll?: number;
  sep?: string;
  align?: 'center' | 'left' | 'right';
  x?: number;
  outline?: number;
  dur: number;
  exit?: 'fade' | 'cut' | 'up';
}> = ({value, y, size = 300, face = 'anton', color = '#fff', prefix = '', suffix = '', suffixSize, roll = 22, sep = '.', align = 'center', x = 60, outline, dur, exit = 'cut'}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, roll], [0, 1], {...clamp, easing: easeOut});
  const v = Math.round(value[0] + (value[1] - value[0]) * p);
  const txt = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const pop = spring({frame: frame - roll, fps: 30, config: {damping: 10, stiffness: 260, mass: 0.5}});
  const out = interpolate(frame, [dur - 6, dur], [0, 1], clamp);
  return (
    <div
      style={{
        ...abs(y, align, x),
        ...FAMILY[face],
        fontSize: size,
        lineHeight: 1,
        color,
        ...(outline ? outlineStyle(outline, color) : {}),
        fontVariantNumeric: 'tabular-nums',
        transform: `scale(${1 + 0.06 * Math.sin(pop * Math.PI)}) translateY(${exit === 'up' ? -60 * out : 0}px)`,
        opacity: exit === 'cut' ? 1 : 1 - out,
        textShadow: outline ? undefined : '0 14px 50px rgba(0,0,0,0.45)',
      }}
    >
      <span>
        {prefix}
        {txt}
        {suffix && <span style={{fontSize: suffixSize ?? size * 0.55}}>{suffix}</span>}
      </span>
    </div>
  );
};
export const Count = timed(CountInner, 'contador');

// ---------------------------------------------------------------- eco de contornos
const EchoInner: React.FC<{
  text: string;
  y: number;
  face?: Face;
  width?: number;
  copies?: number;
  color?: string;
  spread?: number;
  stroke?: number;
  dur: number;
  solidColor?: string;
}> = ({text, y, face = 'anton', width = 980, copies = 3, color = '#fff', spread = 0.82, stroke = 3, dur, solidColor}) => {
  const frame = useCurrentFrame();
  const fs = fit(text, face, width);
  const e = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: easeOut});
  const breathe = interpolate(frame, [14, dur], [0, 0.12], clamp);
  const rows = [];
  for (let k = -copies; k <= copies; k++) {
    const solid = k === 0;
    const off = k * fs * spread * (e + breathe);
    rows.push(
      <div
        key={k}
        style={{
          ...abs(y - fs / 2 + off),
          ...FAMILY[face],
          fontSize: fs,
          lineHeight: 1,
          ...(solid ? {color: solidColor ?? color} : outlineStyle(stroke, color)),
          opacity: solid ? 1 : Math.max(0, 0.75 - Math.abs(k) * 0.18) * e,
        }}
      >
        {text}
      </div>,
    );
  }
  return <>{rows}</>;
};
export const Echo = timed(EchoInner, 'eco');

// ---------------------------------------------------------------- banda de texto en movimiento
const MarqueeInner: React.FC<{
  text: string;
  y: number;
  size?: number;
  face?: Face;
  color?: string;
  outline?: number;
  speed?: number;
  angle?: number;
  dur: number;
  sep?: string;
  bg?: string;
}> = ({text, y, size = 220, face = 'anton', color = '#fff', outline, speed = 14, angle = 0, dur, sep = ' · ', bg}) => {
  const frame = useCurrentFrame();
  const unit = text + sep;
  const unitW = textWidth(unit, face) * size;
  const reps = Math.ceil(2600 / Math.max(1, unitW)) + 2;
  const off = -((frame * speed) % unitW);
  const op = interpolate(frame, [0, 4, dur - 4, dur], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: -700, right: -700, top: y - size / 2, height: size * 1.1, transform: `rotate(${angle}deg)`, opacity: op, background: bg, overflow: 'hidden'}}>
      <div
        style={{
          ...FAMILY[face],
          fontSize: size,
          lineHeight: 1.1,
          whiteSpace: 'pre',
          color,
          ...(outline ? outlineStyle(outline, color) : {}),
          transform: `translateX(${off}px)`,
        }}
      >
        {unit.repeat(reps)}
      </div>
    </div>
  );
};
export const Marquee = timed(MarqueeInner, 'banda');

// ---------------------------------------------------------------- letras que se deshacen
const DissolveInner: React.FC<{text: string; y: number; face?: Face; width?: number; color?: string; start?: number; dur: number}> = ({
  text,
  y,
  face = 'anton',
  width = 980,
  color = '#fff',
  start = 8,
  dur,
}) => {
  const frame = useCurrentFrame();
  const fs = fit(text, face, width);
  return (
    <div style={{...abs(y - fs / 2), ...FAMILY[face], fontSize: fs, lineHeight: 1, color}}>
      <span>
      {[...text].map((c, i) => {
        const at = start + i * 2.2;
        const p = interpolate(frame, [at, Math.max(at + 1, dur)], [0, 1], {...clamp, easing: easeIn});
        const dx = (random(`dx${i}${text}`) - 0.3) * 500;
        const dy = -(0.4 + random(`dy${i}${text}`)) * 420;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              transform: `translate(${dx * p}px, ${dy * p}px) rotate(${(random(`ro${i}`) - 0.5) * 90 * p}deg) scale(${1 - 0.3 * p})`,
              opacity: 1 - p,
              filter: p > 0.02 ? `blur(${p * 14}px)` : undefined,
            }}
          >
            {c}
          </span>
        );
      })}
      </span>
    </div>
  );
};
export const Dissolve = timed(DissolveInner, 'se deshace');

// ---------------------------------------------------------------- letras que se construyen
const BuildInner: React.FC<{text: string; y: number; face?: Face; width?: number; color?: string; stagger?: number; dur: number}> = ({
  text,
  y,
  face = 'anton',
  width = 980,
  color = '#fff',
  stagger = 2.4,
}) => {
  const frame = useCurrentFrame();
  const fs = fit(text, face, width);
  return (
    <div style={{...abs(y - fs / 2), ...FAMILY[face], fontSize: fs, lineHeight: 1, color}}>
      <span>
      {[...text].map((c, i) => {
        const sp = spring({frame: frame - i * stagger, fps: 30, config: {damping: 13, stiffness: 300, mass: 0.6}});
        return (
          <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - sp) * -1100}px) scaleY(${1 + 0.25 * Math.max(0, 1 - sp)})`, opacity: frame >= i * stagger ? 1 : 0}}>
            {c}
          </span>
        );
      })}
      </span>
    </div>
  );
};
export const Build = timed(BuildInner, 'se construye');

// ---------------------------------------------------------------- línea que tacha
const StrikeInner: React.FC<{x: number; y: number; width: number; height?: number; color?: string; angle?: number; draw?: number; dur: number}> = ({
  x,
  y,
  width,
  height = 22,
  color = '#FF3B1F',
  angle = -4,
  draw = 7,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, draw], [0, 1], {...clamp, easing: easeInOut});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - height / 2,
        width,
        height,
        background: color,
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg) scaleX(${p})`,
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
      }}
    />
  );
};
export const Strike = timed(StrikeInner, 'tachado');

// ---------------------------------------------------------------- pila de palabras (una empuja a la otra)
const StackInner: React.FC<{
  words: {text: string; at: number; color?: string; face?: Face}[];
  y: number;
  size?: number;
  face?: Face;
  color?: string;
  align?: 'left' | 'center';
  x?: number;
  dur: number;
}> = ({words, y, size = 120, face = 'display', color = '#fff', align = 'left', x = 70}) => {
  const frame = useCurrentFrame();
  const lh = size * 1.0;
  const visible = words.filter((w) => frame >= w.at);
  const lastAt = visible.length ? visible[visible.length - 1].at : 0;
  const push = interpolate(frame, [lastAt, lastAt + 7], [1, 0], {...clamp, easing: easeOut});
  return (
    <div style={{position: 'absolute', left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, top: y, textAlign: align}}>
      {visible.map((w, i) => {
        const fromEnd = visible.length - 1 - i;
        const ty = -(fromEnd - push * (fromEnd > 0 ? 1 : 0)) * lh;
        const newest = fromEnd === 0;
        const e = interpolate(frame - w.at, [0, 7], [0, 1], {...clamp, easing: easeOut});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: newest ? (1 - e) * lh * 0.8 : ty,
              ...FAMILY[w.face ?? face],
              fontSize: size,
              lineHeight: 1,
              color: w.color ?? color,
              opacity: newest ? e : Math.max(0.25, 1 - fromEnd * 0.3),
              whiteSpace: 'nowrap',
              textShadow: '0 8px 30px rgba(0,0,0,0.45)',
            }}
          >
            {w.text}
          </div>
        );
      })}
    </div>
  );
};
export const Stack = timed(StackInner, 'pila');

// ---------------------------------------------------------------- etiqueta pequeña (mono)
export const Label: React.FC<Timed & {text: string; y: number; x?: number; align?: 'left' | 'center' | 'right'; color?: string; size?: number; dot?: string}> = ({
  from,
  to,
  text,
  y,
  x = 70,
  align = 'left',
  color = '#fff',
  size = 44,
  dot,
}) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none" name="etiqueta">
    <LabelInner text={text} y={y} x={x} align={align} color={color} size={size} dot={dot} dur={to - from} />
  </Sequence>
);
const LabelInner: React.FC<{text: string; y: number; x: number; align: 'left' | 'center' | 'right'; color: string; size: number; dot?: string; dur: number}> = ({text, y, x, align, color, size, dot, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <div style={{...abs(y, align, x), opacity: out}}>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.45, ...FAMILY.mono, fontSize: size, letterSpacing: '0.16em', color, textShadow: '0 3px 14px rgba(0,0,0,0.7)'}}>
        {dot && <span style={{width: size * 0.42, height: size * 0.42, borderRadius: '50%', background: dot, transform: `scale(${p})`, opacity: Math.floor((frame / fps) * 2) % 2 && frame > 20 ? 0.35 : 1}} />}
        <span style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{text}</span>
      </span>
    </div>
  );
};
