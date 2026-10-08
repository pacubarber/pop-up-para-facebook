import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {clamp, easeInOut} from './core';

type Dir = 'left' | 'right' | 'up' | 'down';
const vec = (dir: Dir) => ({
  axis: dir === 'left' || dir === 'right' ? 'X' : 'Y',
  // dirección en la que se MUEVE el contenido
  sign: dir === 'left' || dir === 'up' ? -1 : 1,
});

const Inner: React.FC<{
  children: React.ReactNode;
  enter?: Dir;
  exit?: Dir;
  exitAt?: number;
  dur: number;
}> = ({children, enter, exit, exitAt, dur}) => {
  const frame = useCurrentFrame();
  let offset = 0;
  let axis = 'X';
  let blur = 0;
  if (enter && frame < dur) {
    const {axis: a, sign} = vec(enter);
    const p = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: easeInOut});
    offset = -sign * (1 - p) * 100;
    axis = a;
    blur = Math.sin(p * Math.PI) * 36;
  }
  if (exit && exitAt !== undefined && frame >= exitAt) {
    const {axis: a, sign} = vec(exit);
    const p = interpolate(frame, [exitAt, exitAt + dur], [0, 1], {...clamp, easing: easeInOut});
    offset = sign * p * 100;
    axis = a;
    blur = Math.sin(p * Math.PI) * 36;
  }
  return (
    <AbsoluteFill style={{transform: `translate${axis}(${offset}%)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * Escena con transición tipo "whip pan": la escena entrante y la saliente se
 * desplazan juntas con desenfoque de movimiento, sin frames vacíos entre medio.
 * La escena empieza a entrar en `from` y empieza a salir en `to` (donde entra la siguiente).
 */
export const Scene: React.FC<{
  from: number;
  to?: number;
  enter?: Dir;
  exit?: Dir;
  dur?: number;
  name?: string;
  children: React.ReactNode;
}> = ({from, to, enter, exit, dur = 10, name, children}) => {
  const exitAt = to !== undefined ? to - from : undefined;
  const length = exitAt !== undefined ? exitAt + dur : undefined;
  return (
    <Sequence from={from} durationInFrames={length} name={name}>
      <Inner enter={enter} exit={exit} exitAt={exitAt} dur={dur}>
        {children}
      </Inner>
    </Sequence>
  );
};
