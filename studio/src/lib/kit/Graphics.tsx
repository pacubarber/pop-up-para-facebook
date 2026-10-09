import React from 'react';
import {noise2D} from '@remotion/noise';
import {interpolate, random, Sequence, spring, useCurrentFrame} from 'remotion';
import {font} from '../../brand';
import {clamp, easeInOut, easeOut} from '../core';
import mexico from './mexico.json';

// Gráficos limpios (vectoriales) para acompañar el video real.

type Timed = {from: number; to: number};
const At: React.FC<Timed & {name: string; children: React.ReactNode}> = ({from, to, name, children}) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} layout="none" name={name}>
    {children}
  </Sequence>
);

// ---------------------------------------------------------------- íconos
const ICONS: Record<string, string> = {
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z',
  camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z',
  at: 'M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5',
  comment: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z',
  check: 'M4 12.5l5 5L20 6.5',
  star: 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z',
  heart: 'M12 20s-7-4.4-9-8.6C1.6 8.3 3.6 5 7 5c2 0 3.4 1.1 5 3c1.6-1.9 3-3 5-3c3.4 0 5.4 3.3 4 6.4C19 15.6 12 20 12 20z',
  pin: 'M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z M12 6.8a2.7 2.7 0 1 0 0 5.4a2.7 2.7 0 1 0 0-5.4z',
  x: 'M6 6l12 12M18 6L6 18',
  question: 'M9 9a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9V15 M12 18.5v.5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
};
export const Icon: React.FC<{name: keyof typeof ICONS | string; size: number; color?: string; fill?: string; stroke?: number; style?: React.CSSProperties}> = ({
  name,
  size,
  color = '#fff',
  fill = 'none',
  stroke = 2,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path d={ICONS[name]} fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Ícono que aparece con rebote (y opcionalmente se rellena). */
export const PopIcon: React.FC<Timed & {name: string; x: number; y: number; size?: number; color?: string; fillAt?: number; fillColor?: string; label?: string}> = ({from, to, ...p}) => (
  <At from={from} to={to} name={`ícono ${p.name}`}>
    <PopIconInner {...p} dur={to - from} />
  </At>
);
const PopIconInner: React.FC<{name: string; x: number; y: number; size?: number; color?: string; fillAt?: number; fillColor?: string; label?: string; dur: number}> = ({
  name,
  x,
  y,
  size = 160,
  color = '#fff',
  fillAt,
  fillColor,
  label,
  dur,
}) => {
  const frame = useCurrentFrame();
  const s = spring({frame, fps: 30, config: {damping: 10, stiffness: 220, mass: 0.6}});
  const filled = fillAt !== undefined && frame >= fillAt;
  const f2 = fillAt !== undefined ? spring({frame: frame - fillAt, fps: 30, config: {damping: 8, stiffness: 300, mass: 0.5}}) : 0;
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, transform: `scale(${s * (1 + 0.15 * Math.sin(f2 * Math.PI))})`, opacity: out, textAlign: 'center'}}>
      <Icon name={name} size={size} color={color} fill={filled ? fillColor ?? color : 'none'} stroke={1.6} style={{filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))'}} />
      {label && <div style={{fontFamily: font.mono, fontWeight: 700, fontSize: size * 0.2, letterSpacing: '0.12em', color, marginTop: 6, textShadow: '0 3px 12px rgba(0,0,0,0.7)'}}>{label}</div>}
    </div>
  );
};

// ---------------------------------------------------------------- estrellas de reseña
export const Stars: React.FC<Timed & {y: number; size?: number; color?: string; stagger?: number}> = ({from, to, ...p}) => (
  <At from={from} to={to} name="estrellas">
    <StarsInner {...p} dur={to - from} />
  </At>
);
const StarsInner: React.FC<{y: number; size?: number; color?: string; stagger?: number; dur: number}> = ({y, size = 140, color = '#FFC93C', stagger = 3, dur}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', gap: size * 0.1, opacity: out}}>
      {[0, 1, 2, 3, 4].map((i) => {
        const s = spring({frame: frame - i * stagger, fps: 30, config: {damping: 9, stiffness: 260, mass: 0.5}});
        const on = frame >= i * stagger + 4;
        return (
          <div key={i} style={{transform: `scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * -40}deg)`, opacity: frame >= i * stagger ? 1 : 0}}>
            <Icon name="star" size={size} color={color} fill={on ? color : 'none'} stroke={1.4} style={{filter: on ? `drop-shadow(0 0 18px ${color}88)` : undefined}} />
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- interfaz de cámara (REC)
export const RecUI: React.FC<Timed & {start?: string}> = ({from, to}) => (
  <At from={from} to={to} name="REC">
    <RecInner dur={to - from} />
  </At>
);
const RecInner: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  const m = 60 + 30 * (1 - p);
  const L = 90;
  const corner = (style: React.CSSProperties) => <div style={{position: 'absolute', width: L, height: L, borderColor: '#fff', borderStyle: 'solid', borderWidth: 0, ...style}} />;
  const s = Math.floor(frame / 30);
  const ff = frame % 30;
  const tc = `00:00:${String(s).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out * p}}>
      {corner({left: m, top: m + 120, borderLeftWidth: 6, borderTopWidth: 6})}
      {corner({right: m, top: m + 120, borderRightWidth: 6, borderTopWidth: 6})}
      {corner({left: m, bottom: m + 120, borderLeftWidth: 6, borderBottomWidth: 6})}
      {corner({right: m, bottom: m + 120, borderRightWidth: 6, borderBottomWidth: 6})}
      <div style={{position: 'absolute', left: m + 30, top: m + 150, display: 'flex', alignItems: 'center', gap: 16, fontFamily: font.mono, fontWeight: 700, fontSize: 36, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>
        <div style={{width: 26, height: 26, borderRadius: '50%', background: '#FF3B1F', opacity: Math.floor(frame / 12) % 2 ? 0.3 : 1}} />
        REC
      </div>
      <div style={{position: 'absolute', right: m + 30, top: m + 150, fontFamily: font.mono, fontWeight: 500, fontSize: 32, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>{tc}</div>
    </div>
  );
};

// ---------------------------------------------------------------- gráfica que cae
export const ChartDown: React.FC<Timed & {y?: number; color?: string; label?: string}> = ({from, to, ...p}) => (
  <At from={from} to={to} name="gráfica">
    <ChartInner {...p} dur={to - from} />
  </At>
);
const ChartInner: React.FC<{y?: number; color?: string; label?: string; dur: number}> = ({y = 1100, color = '#FF3B1F', label, dur}) => {
  const frame = useCurrentFrame();
  const pts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const x = 90 + i * 75;
    const base = 60 + i * i * 2.6;
    pts.push([x, base + (random(`c${i}`) - 0.5) * 70]);
  }
  const d = 'M' + pts.map(([x, yy]) => `${x} ${yy}`).join(' L');
  const len = 1400;
  const p = interpolate(frame, [0, dur * 0.7], [0, 1], {...clamp, easing: easeInOut});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  const idx = Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)));
  const [hx, hy] = pts[idx];
  return (
    <svg width={1080} height={560} viewBox="0 0 1080 560" style={{position: 'absolute', left: 0, top: y, opacity: out, overflow: 'visible'}}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={80} x2={1000} y1={60 + i * 130} y2={60 + i * 130} stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="6 12" />
      ))}
      <path d={d} fill="none" stroke={color} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} style={{filter: `drop-shadow(0 0 16px ${color})`}} />
      <circle cx={hx} cy={hy} r={18} fill="#fff" />
      {label && (
        <text x={hx - 30} y={hy + 80} fill="#fff" fontFamily="JetBrains Mono" fontWeight={700} fontSize={40} textAnchor="end" opacity={p}>
          {label}
        </text>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------- curvas de nivel (mapa)
export const Contours: React.FC<Timed & {color?: string; lines?: number; opacity?: number}> = ({from, to, ...p}) => (
  <At from={from} to={to} name="curvas de nivel">
    <ContoursInner {...p} dur={to - from} />
  </At>
);
const ContoursInner: React.FC<{color?: string; lines?: number; opacity?: number; dur: number}> = ({color = '255,255,255', lines = 14, opacity = 0.55, dur}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 18], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  const paths = new Array(lines).fill(0).map((_, k) => {
    const base = 120 + k * (1700 / lines);
    let d = '';
    for (let x = -20; x <= 1100; x += 30) {
      const yy = base + noise2D('c', x / 380, k * 0.35 + frame / 160) * 140;
      d += `${x === -20 ? 'M' : 'L'}${x} ${yy.toFixed(1)} `;
    }
    return d;
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: out * opacity}}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`rgba(${color},${i % 4 === 0 ? 0.9 : 0.45})`} strokeWidth={i % 4 === 0 ? 3 : 1.6} strokeDasharray={2400} strokeDashoffset={2400 * (1 - draw)} />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------- ruta punteada con contador
export const RoutePath: React.FC<Timed & {d: string; color?: string; len?: number}> = ({from, to, ...p}) => (
  <At from={from} to={to} name="ruta">
    <RouteInner {...p} dur={to - from} />
  </At>
);
const RouteInner: React.FC<{d: string; color?: string; len?: number; dur: number}> = ({d, color = '#fff', len = 2600, dur}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur * 0.85], [0, 1], {...clamp, easing: easeInOut});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: out}}>
      <defs>
        <mask id="routeMask">
          <path d={d} fill="none" stroke="#fff" strokeWidth={30} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray="2 26" mask="url(#routeMask)" style={{filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.6))'}} />
    </svg>
  );
};

// ---------------------------------------------------------------- mapa de México
type PlaceKey = keyof typeof mexico.places;
export const MexicoMap: React.FC<
  Timed & {
    /** lugares ya visitados (en orden) y el frame local en que aparece cada pin */
    pins: {key: PlaceKey; at: number; label?: string}[];
    focus?: PlaceKey;
    mini?: boolean;
    route?: boolean;
    y?: number;
    color?: string;
  }
> = ({from, to, ...p}) => (
  <At from={from} to={to} name="mapa">
    <MapInner {...p} dur={to - from} />
  </At>
);
const MapInner: React.FC<{pins: {key: PlaceKey; at: number; label?: string}[]; focus?: PlaceKey; mini?: boolean; route?: boolean; y?: number; color?: string; dur: number}> = ({
  pins,
  focus,
  mini,
  route,
  y = 560,
  color = '#FF5A36',
  dur,
}) => {
  const frame = useCurrentFrame();
  const W = mexico.width;
  const H = mexico.height;
  const draw = interpolate(frame, [0, mini ? 8 : 22], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  const width = mini ? 330 : 1000;
  const sc = width / W;
  const fp = focus ? mexico.places[focus] : null;
  const fz = interpolate(frame, [4, 20], [1, mini ? 1 : 1.7], {...clamp, easing: easeInOut});
  const cam = fp ? `translate(${(W / 2 - fp[0]) * (fz - 1)}px, ${(H / 2 - fp[1]) * (fz - 1)}px) scale(${fz})` : undefined;
  const pts = pins.map((pin) => mexico.places[pin.key]);
  const routeD = pts.length > 1 ? 'M' + pts.map(([x, yy]) => `${x} ${yy}`).join(' L') : '';
  const routeP = interpolate(frame, [10, dur * 0.7], [0, 1], {...clamp, easing: easeInOut});
  return (
    <div
      style={{
        position: 'absolute',
        left: mini ? 50 : (1080 - width) / 2,
        top: mini ? 150 : y,
        width,
        height: H * sc,
        opacity: out,
        transform: mini ? `scale(${0.8 + 0.2 * draw})` : undefined,
        transformOrigin: 'left top',
      }}
    >
      {mini && <div style={{position: 'absolute', inset: -18, borderRadius: 26, background: 'rgba(10,10,14,0.55)', backdropFilter: 'blur(8px)', opacity: draw}} />}
      <svg width={width} height={H * sc} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', overflow: 'visible'}}>
        <g style={{transform: cam, transformOrigin: '0 0', transformBox: 'view-box'}}>
          {mexico.paths.map((d, i) => (
            <path key={i} d={d} fill={`rgba(255,255,255,${0.12 * draw})`} stroke="#fff" strokeWidth={mini ? 4 : 2.5} strokeDasharray={9000} strokeDashoffset={9000 * (1 - draw)} strokeLinejoin="round" />
          ))}
          {route && routeD && <path d={routeD} fill="none" stroke={color} strokeWidth={mini ? 6 : 4} strokeDasharray="1400" strokeDashoffset={1400 * (1 - routeP)} strokeLinecap="round" />}
          {pins.map((pin, i) => {
            const [px, py] = mexico.places[pin.key];
            const s = spring({frame: frame - pin.at, fps: 30, config: {damping: 9, stiffness: 240, mass: 0.5}});
            const active = focus === pin.key;
            const ring = ((frame - pin.at) % 30) / 30;
            const r = (mini ? 16 : 11) / (fp ? fz : 1);
            return (
              <g key={i} style={{opacity: frame >= pin.at ? 1 : 0}}>
                {active && <circle cx={px} cy={py} r={r * (1 + ring * 3)} fill="none" stroke={color} strokeWidth={3 / (fp ? fz : 1)} opacity={1 - ring} />}
                <circle cx={px} cy={py} r={r * s} fill={active || !focus ? color : '#fff'} stroke="#fff" strokeWidth={3 / (fp ? fz : 1)} />
                {pin.label && !mini && (
                  <text x={px} y={py - r * 2.2} fill="#fff" fontFamily="JetBrains Mono" fontWeight={700} fontSize={22 / (fp ? fz : 1)} textAnchor="middle" opacity={s} letterSpacing="2">
                    {pin.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
