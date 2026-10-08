import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------- tipos de las locuciones generadas por tools/tts.py
export type VoWord = {text: string; start: number; end: number};
export type VoLine = {voice: string; text: string; start: number; end: number; words: VoWord[]};
export type VoData = {name: string; duration: number; lines: VoLine[]};

// ---------- curvas
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 entre dos frames con easing. */
export const prog = (frame: number, from: number, dur: number, easing = easeOut) =>
  interpolate(frame, [from, from + dur], [0, 1], {...clamp, easing});

/** Resorte que empieza en `at` (frames). */
export const useSpring = (at: number, config: Partial<{damping: number; stiffness: number; mass: number}> = {}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping: 14, stiffness: 160, mass: 0.7, ...config}});
};

// ---------- audio
export const Sfx: React.FC<{name: string; at: number; volume?: number}> = ({name, at, volume = 1}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`sfx:${name}`}>
    <Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
  </Sequence>
);

/**
 * Música con fade de entrada/salida y "ducking" automático bajo la locución.
 * `delay` (frames) retrasa su entrada sin desincronizar el ducking.
 */
export const Music: React.FC<{
  name: string;
  volume: number;
  duration: number;
  vo?: VoData;
  duck?: number;
  fadeIn?: number;
  fadeOut?: number;
  startFrom?: number;
  delay?: number;
}> = ({name, volume, duration, vo, duck = 0.45, fadeIn = 8, fadeOut = 30, startFrom = 0, delay = 0}) => {
  const {fps} = useVideoConfig();
  const local = duration - delay;
  return (
    <Sequence from={delay} layout="none" name={`música:${name}`}>
      <Audio
        src={staticFile(`audio/${name}.wav`)}
        trimBefore={startFrom}
        volume={(f) => {
          const t = (f + delay) / fps;
          let v = volume * interpolate(f, [0, fadeIn, local - fadeOut, local], [0, 1, 1, 0], clamp);
          if (vo) {
            const speaking = vo.lines.some((l) => t > l.start - 0.15 && t < l.end + 0.2);
            if (speaking) v *= duck;
          }
          return v;
        }}
      />
    </Sequence>
  );
};

// ---------- texturas
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('grain.png')})`,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Flash blanco corto para marcar un corte. */
export const Flash: React.FC<{at: number; dur?: number; color?: string; max?: number}> = ({
  at,
  dur = 6,
  color = '#fff',
  max = 0.8,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + dur], [0, max, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

export const Logo: React.FC<{src: string; height: number; style?: React.CSSProperties}> = ({src, height, style}) => (
  <Img src={staticFile(src)} style={{height, ...style}} />
);

/** Mueve la "cámara" con un empujón al inicio de cada corte (punch-in de edición). */
export const usePunch = (cuts: number[], amount = 0.06, dur = 10) => {
  const frame = useCurrentFrame();
  let s = 1;
  for (const c of cuts) {
    if (frame >= c && frame < c + dur) {
      s = 1 + amount * (1 - easeOut((frame - c) / dur));
    }
  }
  return s;
};

/** Divide un texto en palabras animadas que entran una por una. */
export const WordsIn: React.FC<{
  text: string;
  at: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number, word: string) => React.CSSProperties;
  rise?: number;
}> = ({text, at, stagger = 3, style, wordStyle, rise = 40}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((w, i) => {
        const p = prog(frame, at + i * stagger, 14);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * rise}px)`,
              marginRight: '0.24em',
              ...(wordStyle ? wordStyle(i, w) : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};
