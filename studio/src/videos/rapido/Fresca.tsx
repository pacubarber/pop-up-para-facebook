import React from 'react';
import {AbsoluteFill, Audio, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../../brand';
import {clamp, easeIn, easeInOut, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, Vignette, type VoData} from '../../lib/core';
import {Scene} from '../../lib/Whip';
import {Shake} from '../../lib/kit/Fx';
import {Count, Reveal, Slam} from '../../lib/kit/Type';
import {fr, voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/fresca.json';

// Anuncio vertical de una marca ficticia de jugos prensados en frío: "Fresca".
// Mismo lenguaje que Grano Alto (ilustración plana + tipografía grande), al doble de ritmo.
const vo = voJson as VoData;
const t = voTimeline(vo);
const K = {
  cream: '#F6F1E3',
  dull: '#D9D1BF',
  dull2: '#BDB4A0',
  green: '#0F3D2E',
  lime: '#B9E23A',
  orange: '#FF7A1A',
  pink: '#FF4F7B',
  yellow: '#FFD23F',
  red: '#E8362B',
  ink: '#1B1B1B',
};

// drive_128: el primer compás completo (1,875 s) cae en "Fresca."; el golpe final, en "verdad".
const DROP = t.ls(1);
const MUSIC_DELAY = DROP - fr(1.875);
const FINAL = MUSIC_DELAY + fr(7 * 1.875);
export const FRESCA_DURATION = FINAL + 36;

const S = {
  hook: 0,
  sugar: t.w(0, 'es') - 2,
  reveal: DROP,
  frio: DROP + 27,
  zero: t.w(1, 'sin') - 3,
  six: t.ls(2),
  bottle: t.w(2, 'en') - 3,
  hoy: t.ls(3),
  puerta: t.w(3, 'en') - 3,
  offer: t.ls(4),
  end: t.ls(5),
};

// ---------------------------------------------------------------- ilustraciones
const JuiceBox: React.FC<{frame: number}> = ({frame}) => (
  <svg width={600} height={857} viewBox="0 0 210 300" style={{transform: `rotate(${Math.sin(frame / 7) * 2}deg)`}}>
    <rect x="96" y="0" width="10" height="70" rx="4" fill="#E9E4D8" transform="rotate(14 101 70)" />
    <path d="M40 60 L170 60 L170 290 L40 290 Z" fill="#EFE6CF" />
    <path d="M40 60 L105 30 L170 60 Z" fill="#E2D6B8" />
    <rect x="40" y="120" width="130" height="110" fill="#F5A04A" opacity="0.85" />
    <text x="105" y="165" textAnchor="middle" fontFamily="Inter Tight" fontWeight="900" fontSize="26" fill="#fff">100%</text>
    <text x="105" y="195" textAnchor="middle" fontFamily="Inter Tight" fontWeight="800" fontSize="20" fill="#fff">JUGO*</text>
    <text x="105" y="270" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#8A7F68">*con azúcar añadida</text>
    <circle cx="82" cy="250" r="4" fill={K.ink} />
    <circle cx="128" cy="250" r="4" fill={K.ink} />
  </svg>
);

const Cube: React.FC<{size: number; rot: number; style?: React.CSSProperties}> = ({size, rot, style}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{transform: `rotate(${rot}deg)`, ...style}}>
    <rect x="3" y="3" width="34" height="34" rx="6" fill="#FFFFFF" />
    <rect x="3" y="26" width="34" height="11" rx="5" fill="#E7E2D8" />
    {[8, 18, 28].map((x) => [10, 20].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#DAD3C4" />))}
  </svg>
);

export const Bottle: React.FC<{width: number; fill?: number; liquid?: string; style?: React.CSSProperties}> = ({width, fill = 1, liquid = K.orange, style}) => {
  const top = 120 + (1 - fill) * 330;
  return (
    <svg width={width} height={width * 2.3} viewBox="0 0 200 460" style={style}>
      <defs>
        <clipPath id="bottleShape">
          <path d="M70 20 L130 20 L130 80 Q180 110 180 170 L180 430 Q180 455 155 455 L45 455 Q20 455 20 430 L20 170 Q20 110 70 80 Z" />
        </clipPath>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g clipPath="url(#bottleShape)">
        <rect x="0" y="0" width="200" height="460" fill="rgba(255,255,255,0.35)" />
        <rect x="0" y={top} width="200" height="460" fill={liquid} />
        <rect x="0" y={top} width="200" height="10" fill="#fff" opacity="0.35" />
        <rect x="0" y="0" width="200" height="460" fill="url(#glass)" />
      </g>
      <rect x="62" y="0" width="76" height="34" rx="8" fill={K.green} />
      <rect x="34" y="230" width="132" height="130" rx="14" fill={K.cream} />
      <text x="100" y="292" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="46" fill={K.green}>
        Fresca
      </text>
      <text x="100" y="324" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" letterSpacing="1.4" fill={K.green}>
        PRENSADO EN FRÍO
      </text>
    </svg>
  );
};

const FRUITS: Array<{c: string; c2: string; shape: 'round' | 'oval' | 'heart' | 'pine'}> = [
  {c: K.orange, c2: '#FFB060', shape: 'round'},
  {c: K.yellow, c2: '#FFF0A0', shape: 'oval'},
  {c: K.red, c2: '#FF8A7A', shape: 'heart'},
  {c: '#F5B800', c2: '#FFDF6A', shape: 'pine'},
  {c: K.lime, c2: '#E3F7A0', shape: 'round'},
  {c: K.pink, c2: '#FF9AB5', shape: 'heart'},
];
const Fruit: React.FC<{i: number; size: number; style?: React.CSSProperties}> = ({i, size, style}) => {
  const f = FRUITS[i % FRUITS.length];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {f.shape === 'round' && (
        <>
          <circle cx="50" cy="54" r="40" fill={f.c} />
          <circle cx="50" cy="54" r="30" fill={f.c2} opacity="0.6" />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <line key={k} x1="50" y1="54" x2={50 + 30 * Math.cos((k * Math.PI) / 3)} y2={54 + 30 * Math.sin((k * Math.PI) / 3)} stroke={f.c} strokeWidth="3" />
          ))}
        </>
      )}
      {f.shape === 'oval' && <ellipse cx="50" cy="54" rx="42" ry="30" fill={f.c} />}
      {f.shape === 'heart' && (
        <>
          <path d="M50 92 C 10 60, 12 22, 50 30 C 88 22, 90 60, 50 92 Z" fill={f.c} />
          {[
            [40, 50],
            [58, 46],
            [50, 64],
            [36, 66],
            [62, 66],
          ].map(([x, y], k) => (
            <ellipse key={k} cx={x} cy={y} rx="2" ry="3" fill="#FFE9A8" />
          ))}
        </>
      )}
      {f.shape === 'pine' && (
        <>
          <ellipse cx="50" cy="62" rx="30" ry="34" fill={f.c} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M${26 + k * 14} 36 L${40 + k * 14} 92`} stroke="#C98A00" strokeWidth="2.5" />
          ))}
        </>
      )}
      <path d="M50 26 C 46 12, 58 6, 64 8 C 62 18, 56 24, 50 26 Z" fill="#2E8B3A" />
    </svg>
  );
};

// ---------------------------------------------------------------- escenas
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: K.dull, alignItems: 'center'}}>
      <div style={{position: 'absolute', bottom: 180, transform: `translateY(${(1 - prog(frame, 0, 10)) * 300}px)`}}>
        <JuiceBox frame={frame} />
      </div>
    </AbsoluteFill>
  );
};

const Sugar: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: K.dull2, overflow: 'hidden'}}>
      {new Array(46).fill(0).map((_, i) => {
        const delay = random(`d${i}`) * 26;
        const land = 1500 + random(`l${i}`) * 300 - (i % 9) * 26;
        const p = interpolate(frame, [delay, delay + 16], [0, 1], {...clamp, easing: easeIn});
        const y = -200 + (land + 200) * p;
        return (
          <Cube
            key={i}
            size={90 + random(`s${i}`) * 70}
            rot={random(`r${i}`) * 90 + p * 40}
            style={{position: 'absolute', left: random(`x${i}`) * 1000 - 20, top: y, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.18))'}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Reveal1: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useSpring(0, {damping: 11, stiffness: 140});
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, #D7F56A 0%, ${K.lime} 60%, #94C21E 100%)`, alignItems: 'center'}}>
      {FRUITS.map((_, i) =>
        [0, 1].map((k) => {
          const a = ((i * 2 + k) / 12) * Math.PI * 2 + 0.3;
          const p = interpolate(frame, [2, 20], [0, 1], {...clamp, easing: easeOut});
          const r = 120 + p * (430 + k * 90);
          return <Fruit key={`${i}${k}`} i={i + k} size={150 - k * 30} style={{position: 'absolute', left: 540 + Math.cos(a) * r - 75, top: 1080 + Math.sin(a) * r - 75, transform: `rotate(${p * 200 + i * 40}deg) scale(${0.4 + 0.6 * p})`}} />;
        }),
      )}
      <div style={{position: 'absolute', top: 190, fontFamily: font.serif, fontStyle: 'italic', fontSize: 250, color: K.green, lineHeight: 1, transform: `scale(${0.7 + 0.3 * prog(frame, 0, 8)})`, opacity: prog(frame, 0, 5)}}>Fresca</div>
      <div style={{position: 'absolute', top: 640, transform: `translateY(${(1 - b) * 1100}px) rotate(${(1 - b) * 20}deg)`}}>
        <Bottle width={380} />
      </div>
    </AbsoluteFill>
  );
};

const Frio: React.FC = () => {
  const frame = useCurrentFrame();
  const press = interpolate(frame, [4, 12], [0, 1], {...clamp, easing: easeIn});
  return (
    <AbsoluteFill style={{background: K.green, alignItems: 'center', overflow: 'hidden'}}>
      {new Array(30).fill(0).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: random(`fx${i}`) * 1080, top: ((random(`fy${i}`) * 1920 + frame * (4 + random(`fv${i}`) * 6)) % 1920) - 40, fontSize: 30 + random(`fs${i}`) * 40, color: 'rgba(255,255,255,0.6)'}}>
          ✻
        </div>
      ))}
      <div style={{position: 'absolute', top: 360 + press * 150, width: 560, height: 70, borderRadius: 18, background: K.cream, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'}} />
      <div style={{position: 'absolute', top: 440 + press * 150, transform: `scale(${1 + 0.35 * press}, ${1 - 0.45 * press})`, transformOrigin: '50% 100%'}}>
        <Fruit i={0} size={380} />
      </div>
      {press > 0.95 &&
        new Array(14).fill(0).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const p = interpolate(frame, [12, 24], [0, 1], {...clamp, easing: easeOut});
          return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 320 * p - 14, top: 760 + Math.sin(a) * 160 * p - 14, width: 28, height: 28, borderRadius: '50%', background: K.orange, opacity: 1 - p}} />;
        })}
    </AbsoluteFill>
  );
};

const Zero: React.FC = () => (
  <AbsoluteFill style={{background: K.cream}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1220, display: 'flex', justifyContent: 'center', gap: 40}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'relative'}}>
          <Cube size={150} rot={-8 + i * 8} />
          <div style={{position: 'absolute', left: -10, right: -10, top: '48%', height: 16, background: K.red, transform: 'rotate(-20deg)', borderRadius: 8}} />
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

const Six: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: K.yellow}}>
      {FRUITS.map((_, i) => {
        const s = interpolate(frame, [2 + i * 4, 10 + i * 4], [0, 1], {...clamp, easing: easeOut});
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <div key={i} style={{position: 'absolute', left: 90 + col * 310, top: 760 + row * 330, transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`}}>
            <Fruit i={i} size={280} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const IntoBottle: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [6, 26], [0.05, 1], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{background: K.yellow, alignItems: 'center'}}>
      {FRUITS.map((_, i) => {
        const p = interpolate(frame, [i * 2, i * 2 + 14], [0, 1], {...clamp, easing: easeIn});
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x0 = 90 + col * 310;
        const y0 = 760 + row * 330;
        return (
          <div key={i} style={{position: 'absolute', left: x0 + (400 - x0) * p, top: y0 + (900 - y0) * p, transform: `scale(${1 - 0.8 * p}) rotate(${p * 300}deg)`, opacity: p > 0.95 ? 0 : 1}}>
            <Fruit i={i} size={280} />
          </div>
        );
      })}
      <div style={{position: 'absolute', top: 760}}>
        <Bottle width={330} fill={fill} />
      </div>
    </AbsoluteFill>
  );
};

const Hoy: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = interpolate(frame, [4, 12], [0, 180], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{background: K.pink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{perspective: 1400}}>
        <div style={{width: 560, height: 600, borderRadius: 40, background: K.cream, boxShadow: '0 40px 80px rgba(0,0,0,0.25)', position: 'relative', overflow: 'hidden', marginTop: 260}}>
          <div style={{height: 150, background: K.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.mono, fontWeight: 700, fontSize: 44, letterSpacing: 6, color: K.cream}}>RECIÉN HECHO</div>
          <div style={{position: 'absolute', top: 150, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 230, color: K.green, letterSpacing: -10}}>
            {flip > 90 ? 'HOY' : '12'}
          </div>
          <div style={{position: 'absolute', top: 150, left: 0, right: 0, height: 225, background: K.cream, transformOrigin: '50% 100%', transform: `rotateX(${flip}deg)`, backfaceVisibility: 'hidden', borderBottom: '3px solid #E3DCC9'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Puerta: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [2, 14], [0, 70], {...clamp, easing: easeOut});
  const box = interpolate(frame, [8, 20], [600, 0], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{background: K.orange}}>
      <div style={{position: 'absolute', left: 260, top: 640, width: 560, height: 900, background: '#7A3A10', borderRadius: '20px 20px 0 0', perspective: 1800}}>
        <div style={{position: 'absolute', inset: 0, background: '#FFF5E1'}} />
        <div style={{position: 'absolute', inset: 0, background: K.green, borderRadius: '20px 20px 0 0', transformOrigin: 'left center', transform: `rotateY(-${open}deg)`, boxShadow: 'inset 0 0 0 18px #0B2E22'}}>
          <div style={{position: 'absolute', right: 50, top: 450, width: 36, height: 36, borderRadius: '50%', background: K.yellow}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 330, top: 1170, transform: `translateX(${box}px)`, display: 'flex', gap: 10}}>
        {[0, 1, 2].map((i) => (
          <Bottle key={i} width={130} liquid={[K.orange, K.lime, K.pink][i]} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1560, height: 30, background: 'rgba(0,0,0,0.15)'}} />
    </AbsoluteFill>
  );
};

const Offer: React.FC<{dosAt: number}> = ({dosAt}) => {
  const frame = useCurrentFrame();
  const pop = useSpring(dosAt, {damping: 8, stiffness: 240, mass: 0.6});
  const cta = useSpring(dosAt + 12);
  const tap = frame - (dosAt + 26);
  const hue = frame >= dosAt ? [K.lime, K.pink, K.yellow, K.orange][Math.floor((frame - dosAt) / 8) % 4] : K.cream;
  const packOut = interpolate(frame, [dosAt - 4, dosAt + 2], [0, 1], {...clamp, easing: easeIn});
  return (
    <AbsoluteFill style={{background: hue, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 1060, display: 'flex', gap: 30, alignItems: 'flex-end', opacity: 1 - packOut, transform: `scale(${1 - 0.3 * packOut})`}}>
        {[K.lime, K.orange, K.pink].map((c, i) => (
          <div key={i} style={{transform: `translateY(${(1 - prog(frame, i * 3, 10)) * 900}px) rotate(${(i - 1) * 7}deg)`}}>
            <Bottle width={i === 1 ? 250 : 210} liquid={c} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 640, fontFamily: font.display, fontWeight: 900, fontStyle: 'italic', fontSize: 470, letterSpacing: -24, color: K.green, transform: `scale(${pop}) rotate(${(1 - pop) * -25}deg)`, opacity: frame >= dosAt ? 1 : 0, lineHeight: 1}}>
        2×1
      </div>
      <div style={{position: 'absolute', top: 1260, transform: `scale(${cta * (tap >= 0 && tap < 6 ? 0.93 : 1)})`}}>
        <div style={{background: K.green, color: K.cream, fontFamily: font.display, fontWeight: 800, fontSize: 64, padding: '34px 74px', borderRadius: 999}}>Pide en fresca.co →</div>
      </div>
      {frame >= dosAt &&
        new Array(16).fill(0).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const p = interpolate(frame - dosAt, [0, 18], [0, 1], {...clamp, easing: easeOut});
          return <Fruit key={i} i={i} size={110} style={{position: 'absolute', left: 540 + Math.cos(a) * 520 * p - 55, top: 900 + Math.sin(a) * 700 * p - 55, transform: `rotate(${p * 360}deg)`, opacity: 1 - interpolate(p, [0.7, 1], [0, 1], clamp)}} />;
        })}
    </AbsoluteFill>
  );
};

const End: React.FC<{tagAt: number}> = ({tagAt}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0);
  return (
    <AbsoluteFill style={{background: K.green, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 300, fontFamily: font.serif, fontStyle: 'italic', fontSize: 270, color: K.cream, lineHeight: 1, transform: `scale(${0.8 + 0.2 * s})`, opacity: s}}>Fresca</div>
      <div style={{position: 'absolute', top: 620, display: 'flex', gap: 24, alignItems: 'flex-end'}}>
        {[K.lime, K.orange, K.pink].map((c, i) => (
          <div key={i} style={{transform: `translateY(${(1 - prog(frame, 4 + i * 3, 12)) * 700}px) rotate(${(i - 1) * 6}deg)`}}>
            <Bottle width={i === 1 ? 260 : 210} liquid={c} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1500, fontFamily: font.serif, fontStyle: 'italic', fontSize: 92, color: K.lime, clipPath: `inset(0 ${(1 - prog(frame, tagAt, 14)) * 100}% 0 0)`}}>Toma algo de verdad.</div>
    </AbsoluteFill>
  );
};

export const Fresca: React.FC = () => {
  const W = 7; // duración de los barridos (más cortos que en Grano Alto)
  return (
    <AbsoluteFill style={{background: K.green}}>
      <Shake hits={[DROP, t.w(4, 'dos'), FINAL]} amp={12}>
        <Scene from={S.hook} to={S.sugar} exit="up" dur={W} name="Gancho">
          <Hook />
        </Scene>
        <Scene from={S.sugar} to={S.reveal} enter="up" exit="up" dur={W} name="Azúcar">
          <Sugar />
        </Scene>
        <Scene from={S.reveal} to={S.frio} enter="up" exit="left" dur={W} name="Producto">
          <Reveal1 />
        </Scene>
        <Scene from={S.frio} to={S.zero} enter="left" exit="up" dur={W} name="Frío">
          <Frio />
        </Scene>
        <Scene from={S.zero} to={S.six} enter="up" exit="left" dur={W} name="Cero azúcar">
          <Zero />
        </Scene>
        <Scene from={S.six} to={S.bottle} enter="left" dur={W} name="Seis frutas">
          <Six />
        </Scene>
        <Scene from={S.bottle} to={S.hoy} exit="down" dur={W} name="A la botella">
          <IntoBottle />
        </Scene>
        <Scene from={S.hoy} to={S.puerta} enter="down" exit="left" dur={W} name="Hoy">
          <Hoy />
        </Scene>
        <Scene from={S.puerta} to={S.offer} enter="left" exit="up" dur={W} name="Mañana">
          <Puerta />
        </Scene>
        <Scene from={S.offer} to={S.end} enter="up" exit="left" dur={W} name="Oferta">
          <Offer dosAt={t.w(4, 'dos') - S.offer - 2} />
        </Scene>
        <Scene from={S.end} enter="left" dur={W} name="Cierre">
          <End tagAt={t.w(5, 'toma') - S.end - 2} />
        </Scene>

        {/* ---------- tipografía ---------- */}
        <Slam from={S.hook} to={S.sugar} y={240} size={170} words={[{text: '¿TU JUGO', at: 0}, {text: 'DE CAJA', at: t.w(0, 'de') - 2, br: true}]} color={K.ink} shadow={false} />
        <Slam from={S.sugar} to={S.reveal} y={330} size={120} words={[{text: 'ES PURO', at: 0}]} color={K.ink} shadow={false} />
        <Slam from={t.w(0, 'azúcar') - 2} to={S.reveal} y={460} size={330} face="serif" words={[{text: 'azúcar?', at: 0, color: K.pink}]} shadow={false} />
        <Reveal from={S.frio + 2} to={S.zero} lines={['PRENSADO', 'EN FRÍO']} y={1240} size={190} face="display" color={[K.cream, K.lime]} stagger={4} shadow={false} />
        <Count from={S.zero} to={S.six} value={[32, 0]} suffix="g" roll={t.w(1, 'añadida') - S.zero} y={300} size={420} face="display" color={K.green} />
        <Reveal from={t.w(1, 'azúcar') - 2} to={S.six} lines={['DE AZÚCAR', 'AÑADIDA']} y={800} size={130} face="display" color={[K.green, K.red]} stagger={4} shadow={false} />
        <Slam from={S.six} to={S.bottle} y={260} size={300} face="display" words={[{text: '6', at: 0, color: K.green}, {text: 'FRUTAS', at: t.w(2, 'frutas') - S.six - 2, size: 190, color: K.green}]} shadow={false} />
        <Reveal from={S.bottle + 2} to={S.hoy} lines={['en cada', 'botella.']} y={250} size={150} face="serif" color={K.green} stagger={4} shadow={false} />
        <Reveal from={S.hoy + 2} to={S.puerta} lines={['HECHO']} y={280} size={200} face="display" color={K.cream} shadow={false} />
        <Reveal from={S.puerta + 2} to={S.offer} lines={['EN TU PUERTA', 'MAÑANA.']} y={230} size={140} face="display" color={[K.cream, K.green]} stagger={4} shadow={false} />
        <Reveal from={S.offer + 2} to={t.w(4, 'dos') - 2} lines={['TU PRIMER', 'PACK']} y={360} size={200} face="display" color={K.green} stagger={4} shadow={false} />
      </Shake>

      <Flash at={DROP} max={0.6} color={K.cream} />
      <Flash at={FINAL} max={0.5} color={K.cream} />
      <Vignette strength={0.18} />
      <Grain opacity={0.06} />

      <Audio src={staticFile('voz/fresca.wav')} />
      <Music name="drive_128" volume={0.5} duration={FRESCA_DURATION} vo={vo} duck={0.6} delay={MUSIC_DELAY} fadeIn={3} fadeOut={14} />
      <Sfx name="swish" at={2} volume={0.4} />
      <Sfx name="whoosh_short" at={S.sugar - 4} volume={0.4} />
      {[0, 6, 12, 18].map((d) => (
        <Sfx key={d} name="click" at={S.sugar + 6 + d} volume={0.35} />
      ))}
      <Sfx name="riser" at={DROP - 40} volume={0.3} />
      <Sfx name="impact" at={DROP} volume={0.5} />
      <Sfx name="whoosh_short" at={S.frio - 4} volume={0.4} />
      <Sfx name="pop" at={S.frio + 12} volume={0.5} />
      <Sfx name="whoosh_short" at={S.zero - 4} volume={0.4} />
      <Sfx name="glitch" at={t.w(1, 'añadida')} volume={0.3} />
      {FRUITS.map((_, i) => (
        <Sfx key={i} name="pop" at={S.six + 2 + i * 4} volume={0.35} />
      ))}
      <Sfx name="whoosh" at={S.bottle} volume={0.35} />
      <Sfx name="whoosh_short" at={S.hoy - 4} volume={0.4} />
      <Sfx name="click" at={S.hoy + 8} volume={0.5} />
      <Sfx name="whoosh_short" at={S.puerta - 4} volume={0.4} />
      <Sfx name="whoosh_short" at={S.offer - 4} volume={0.4} />
      <Sfx name="impact" at={t.w(4, 'dos') - 2} volume={0.4} />
      <Sfx name="cash" at={t.w(4, 'dos') + 8} volume={0.35} />
      <Sfx name="click" at={t.w(4, 'dos') + 24} volume={0.5} />
      <Sfx name="whoosh_short" at={S.end - 4} volume={0.4} />
      <Sfx name="ding" at={t.w(5, 'toma')} volume={0.3} />
    </AbsoluteFill>
  );
};

