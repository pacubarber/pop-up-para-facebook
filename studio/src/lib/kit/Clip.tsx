import React from 'react';
import {AbsoluteFill, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut} from '../core';

// Tomas de video real (Mixkit, preparadas por tools/stock.py en public/stock/).

export const GRADES = {
  none: 'contrast(1.06) saturate(1.1)',
  bw: 'grayscale(1) contrast(1.32) brightness(0.9)',
  warm: 'contrast(1.1) saturate(1.22) sepia(0.12)',
  cool: 'contrast(1.12) saturate(0.95) hue-rotate(-6deg) brightness(0.96)',
  punch: 'contrast(1.2) saturate(1.3)',
  dim: 'brightness(0.45) contrast(1.1) saturate(0.8)',
  teal: 'contrast(1.16) saturate(1.15) hue-rotate(-8deg)',
  night: 'brightness(0.8) contrast(1.25) saturate(1.1)',
} as const;
export type Grade = keyof typeof GRADES;

export type Enter = 'cut' | 'punch' | 'zoom' | 'pull' | 'blur' | 'iris' | 'wipe' | 'drop' | 'whipL' | 'whipR' | 'whipU' | 'whipD' | 'spin';

export type ClipProps = {
  id: number;
  dur: number;
  /** segundos que se saltan del clip */
  trim?: number;
  rate?: number;
  zoom?: [number, number];
  x?: [number, number];
  y?: [number, number];
  rot?: [number, number];
  grade?: Grade;
  /** filtro CSS extra, se suma al grado */
  filter?: string;
  enter?: Enter;
  enterDur?: number;
  /** capa entre el fondo y la persona recortada (texto "detrás") */
  behind?: React.ReactNode;
  /** capa encima de todo, sin el movimiento de cámara */
  front?: React.ReactNode;
  /** dibuja encima la persona (o el primer plano) recortada: public/stock/<id>.fg.webm */
  cutout?: boolean;
  /** contorno blanco tipo sticker alrededor del recorte (px) */
  sticker?: number;
  /** frame local en el que se congela la imagen */
  freezeAt?: number;
  /** el recorte se ve con un color/grado distinto al fondo (p. ej. fondo B/N, persona a color) */
  fgGrade?: Grade;
  /** quita el fondo: solo el recorte sobre `bg` */
  bgOff?: boolean;
  bg?: string;
};

const whip = (axis: 'X' | 'Y', sign: number, e: number) => ({axis, offset: sign * (1 - e) * 100});

export const Clip: React.FC<ClipProps> = (p) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, Math.max(1, p.dur)], [0, 1], clamp);
  const lerp = (r: [number, number] | undefined, d: number) => (r ? r[0] + (r[1] - r[0]) * easeInOut(t) : d);
  let s = lerp(p.zoom ?? [1.03, 1.12], 1);
  let tx = lerp(p.x, 0);
  let ty = lerp(p.y, 0);
  let rot = lerp(p.rot, 0);
  let blur = 0;
  let clip: string | undefined;
  let slide = '';
  const ed = p.enterDur ?? 8;
  const e = interpolate(frame, [0, ed], [0, 1], {...clamp, easing: easeOut});
  switch (p.enter) {
    case 'punch':
      s *= 1 + 0.22 * (1 - e);
      break;
    case 'zoom':
      s *= 1 + 0.7 * (1 - e);
      blur = 26 * (1 - e);
      break;
    case 'pull':
      s *= 1 - 0.25 * (1 - e);
      blur = 16 * (1 - e);
      break;
    case 'blur':
      blur = 34 * (1 - e);
      break;
    case 'drop':
      ty += -420 * (1 - e);
      blur = 14 * (1 - e);
      break;
    case 'spin':
      rot += -14 * (1 - e);
      s *= 1 + 0.35 * (1 - e);
      blur = 18 * (1 - e);
      break;
    case 'iris':
      clip = `circle(${e * 115}% at 50% 50%)`;
      break;
    case 'wipe':
      clip = `polygon(0 0, ${e * 230}% 0, ${e * 230 - 70}% 100%, 0 100%)`;
      break;
    case 'whipL':
    case 'whipR':
    case 'whipU':
    case 'whipD': {
      const m = {whipL: whip('X', 1, e), whipR: whip('X', -1, e), whipU: whip('Y', 1, e), whipD: whip('Y', -1, e)}[p.enter];
      slide = ` translate${m.axis}(${m.offset}%)`;
      blur = Math.sin(e * Math.PI) * 30 + (1 - e) * 20;
      break;
    }
    default:
      break;
  }
  const trimBefore = p.trim ? Math.round(p.trim * 30) : undefined;
  const style = (g?: Grade): React.CSSProperties => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: `${GRADES[g ?? 'none']} ${p.filter ?? ''}`,
  });
  const frozen = p.freezeAt !== undefined && frame >= p.freezeAt;
  const freeze = (node: React.ReactNode) => (frozen ? <Freeze frame={p.freezeAt!}>{node}</Freeze> : node);
  const sticker = p.sticker && frozen ? p.sticker : 0;
  const outline = sticker
    ? [`${sticker}px 0`, `-${sticker}px 0`, `0 ${sticker}px`, `0 -${sticker}px`].map((o) => `drop-shadow(${o} 0 #fff)`).join(' ') + ' drop-shadow(0 18px 30px rgba(0,0,0,0.45))'
    : '';
  return (
    <AbsoluteFill style={{background: p.bg ?? '#000', overflow: 'hidden', clipPath: clip}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${s}) rotate(${rot}deg)${slide}`, filter: blur > 0.4 ? `blur(${blur}px)` : undefined}}>
        {!p.bgOff && freeze(<OffthreadVideo src={staticFile(`stock/${p.id}.mp4`)} trimBefore={trimBefore} playbackRate={p.rate ?? 1} muted style={style(p.grade)} />)}
        {p.behind ? <AbsoluteFill>{p.behind}</AbsoluteFill> : null}
        {p.cutout &&
          freeze(
            <AbsoluteFill style={{filter: outline || undefined}}>
              <OffthreadVideo src={staticFile(`stock/${p.id}.fg.webm`)} transparent trimBefore={trimBefore} playbackRate={p.rate ?? 1} muted style={style(p.fgGrade ?? p.grade)} />
            </AbsoluteFill>,
          )}
      </AbsoluteFill>
      {p.front ? <AbsoluteFill>{p.front}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};

/** Una toma en la línea de tiempo: [from, to) en frames de la composición. */
export const Shot: React.FC<Omit<ClipProps, 'dur'> & {from: number; to: number; name?: string}> = ({from, to, name, ...p}) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} name={name ?? `toma ${p.id}`}>
    <Clip {...p} dur={to - from} />
  </Sequence>
);

/** Varias tomas en pantalla dividida (columnas o filas) que entran escalonadas. */
export const Split: React.FC<{
  ids: number[];
  dur: number;
  dir?: 'cols' | 'rows';
  stagger?: number;
  grades?: Grade[];
  gap?: number;
  labels?: React.ReactNode[];
}> = ({ids, dur, dir = 'cols', stagger = 4, grades = [], gap = 10, labels = []}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000', display: 'flex', flexDirection: dir === 'cols' ? 'row' : 'column', gap}}>
      {ids.map((id, i) => {
        const e = interpolate(frame, [i * stagger, i * stagger + 10], [0, 1], {...clamp, easing: easeOut});
        const off = (1 - e) * 110 * (i % 2 ? -1 : 1);
        return (
          <div key={id} style={{position: 'relative', flex: 1, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, transform: dir === 'cols' ? `translateY(${off}%)` : `translateX(${off}%)`}}>
              <Sequence from={i * stagger} layout="none">
                <OffthreadVideo
                  src={staticFile(`stock/${id}.mp4`)}
                  muted
                  style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: GRADES[grades[i] ?? 'none'], transform: `scale(${1.1 + 0.08 * (frame / dur)})`}}
                />
              </Sequence>
              {labels[i]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
