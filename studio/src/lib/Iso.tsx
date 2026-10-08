import React from 'react';
import {color, font} from '../brand';

// Isotipo de CORTE (mismo trazado que scripts/build-logos.mjs) con las mitades animables.
const halfPath = (sign: number, {cx = 60, cy = 60, r = 40, angle = -35, gap = 5} = {}) => {
  const t = (angle * Math.PI) / 180;
  const ux = Math.cos(t);
  const uy = Math.sin(t);
  const ox = -uy * gap * sign;
  const oy = ux * gap * sign;
  const ax = cx + ux * r + ox;
  const ay = cy + uy * r + oy;
  const bx = cx - ux * r + ox;
  const by = cy - uy * r + oy;
  return `M${ax} ${ay}A${r} ${r} 0 0 ${sign > 0 ? 1 : 0} ${bx} ${by}Z`;
};

const TOP = halfPath(-1);
const BOTTOM = halfPath(1);

/** `split` 0 = cerrado (logo final), 1 = mitades separadas fuera de cuadro. */
export const Iso: React.FC<{size: number; split?: number; light?: boolean; style?: React.CSSProperties}> = ({
  size,
  split = 0,
  light = false,
  style,
}) => {
  // las mitades viajan perpendiculares al corte
  const d = split * 120;
  const nx = Math.sin((35 * Math.PI) / 180);
  const ny = Math.cos((35 * Math.PI) / 180);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{overflow: 'visible', ...style}}>
      <path d={TOP} fill={light ? color.ink : color.bone} transform={`translate(${-nx * d} ${-ny * d})`} />
      <path d={BOTTOM} fill={color.red} transform={`translate(${nx * d} ${ny * d})`} />
    </svg>
  );
};

export const Wordmark: React.FC<{size: number; light?: boolean; style?: React.CSSProperties}> = ({size, light, style}) => (
  <div
    style={{
      fontFamily: font.display,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: -size * 0.035,
      color: light ? color.ink : color.bone,
      lineHeight: 1,
      display: 'flex',
      alignItems: 'baseline',
      ...style,
    }}
  >
    CORTE
    <span
      style={{
        display: 'inline-block',
        width: size * 0.19,
        height: size * 0.19,
        borderRadius: '50%',
        background: color.red,
        marginLeft: size * 0.06,
      }}
    />
  </div>
);
