import React from 'react';
import {AbsoluteFill, Audio, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../brand';
import {clamp, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, Vignette, VoData} from '../lib/core';
import {Scene} from '../lib/Whip';
import voJson from '../../public/voz/cafe.json';

// Anuncio vertical para una marca ficticia de café de especialidad: "Grano Alto".
const vo = voJson as VoData;
const C = {
  cream: '#F3E7D3',
  paper: '#EADAC0',
  espresso: '#21140D',
  roast: '#3A2417',
  bean: '#5B3721',
  terra: '#D2603A',
  sage: '#9DAA80',
  kraft: '#C79A63',
  kraftDark: '#A67C48',
};

const f = (s: number) => Math.round(s * 30);
// La música entra a mitad de la intro para que el "drop" caiga en la revelación del producto.
const DROP = f(vo.lines[1].start);
// Las escenas siguen a la locución (voz OpenAI sin silencios), no a un número fijo de tiempos.
const S2 = DROP;
const S3 = f(vo.lines[2].start) - 6;
const S4 = f(vo.lines[3].start) - 6;
const S5 = f(vo.lines[3].end) + 10;
export const CAFE_DURATION = S5 + 60;
const wordAt = (line: number, prefix: string) => f(vo.lines[line].words.find((w) => w.text.startsWith(prefix))!.start);
const TOSTADO_AT = wordAt(1, 'tostado');
const PCT_AT = wordAt(3, 'treinta') - 3;

const Mountain: React.FC<{size: number; color?: string; sun?: string}> = ({size, color = C.espresso, sun = C.terra}) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 100 62">
    <circle cx="66" cy="22" r="13" fill={sun} />
    <path d="M0 62 L36 12 L56 40 L68 26 L100 62 Z" fill={color} />
    <path d="M36 12 L44 23 L38 21 L33 26 L30 20 Z" fill={C.cream} opacity="0.9" />
  </svg>
);

const Bean: React.FC<{size: number; rot: number; style?: React.CSSProperties}> = ({size, rot, style}) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 40 52" style={{transform: `rotate(${rot}deg)`, ...style}}>
    <ellipse cx="20" cy="26" rx="18" ry="24" fill={C.bean} />
    <ellipse cx="15" cy="18" rx="6" ry="10" fill="#7A4E31" opacity="0.6" />
    <path d="M20 4 C 12 18, 28 32, 20 48" stroke={C.espresso} strokeWidth="3.2" fill="none" strokeLinecap="round" />
  </svg>
);

const Bag: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <svg viewBox="0 0 400 560" style={style}>
    <defs>
      <linearGradient id="kraft" x1="0" x2="1">
        <stop offset="0" stopColor={C.kraftDark} />
        <stop offset="0.35" stopColor={C.kraft} />
        <stop offset="0.8" stopColor="#D4AA74" />
        <stop offset="1" stopColor={C.kraftDark} />
      </linearGradient>
    </defs>
    <ellipse cx="200" cy="545" rx="170" ry="16" fill="rgba(0,0,0,0.18)" />
    <path d="M40 70 L360 70 L372 530 Q200 548 28 530 Z" fill="url(#kraft)" />
    <path d="M40 70 L360 70 L352 18 L48 18 Z" fill={C.kraftDark} />
    <rect x="48" y="40" width="304" height="10" fill="#8D6539" opacity="0.6" />
    {/* etiqueta */}
    <rect x="78" y="170" width="244" height="290" rx="12" fill={C.cream} />
    <rect x="90" y="182" width="220" height="266" rx="8" fill="none" stroke={C.espresso} strokeWidth="2" />
    <g transform="translate(150 205)">
      <circle cx="66" cy="22" r="13" fill={C.terra} />
      <path d="M0 62 L36 12 L56 40 L68 26 L100 62 Z" fill={C.espresso} />
    </g>
    <text x="200" y="320" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontSize="50" fill={C.espresso}>
      Grano Alto
    </text>
    <text x="200" y="352" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="12" letterSpacing="1.2" fill={C.espresso}>
      CAFÉ DE ESPECIALIDAD
    </text>
    <line x1="120" y1="372" x2="280" y2="372" stroke={C.espresso} strokeWidth="1.5" />
    <text x="200" y="400" textAnchor="middle" fontFamily="Inter Tight" fontWeight="700" fontSize="17" fill={C.espresso}>
      Huila · Colombia
    </text>
    <text x="200" y="425" textAnchor="middle" fontFamily="Inter Tight" fontSize="15" fill={C.roast}>
      Tueste medio · 340 g
    </text>
  </svg>
);

const Mug: React.FC<{sad?: boolean; frame: number}> = ({sad, frame}) => (
  <svg width="420" height="420" viewBox="0 0 200 200">
    {[0, 1, 2].map((i) => {
      const y = Math.sin(frame / 8 + i) * 3;
      return (
        <path
          key={i}
          d={sad ? `M${70 + i * 25} ${70 + y} q 6 -12 0 -22 q -6 -10 0 -18` : `M${70 + i * 25} ${70 + y} q 8 -12 0 -24 q -8 -12 0 -24`}
          stroke={C.cream}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity={sad ? 0.35 : 0.8}
        />
      );
    })}
    <path d="M45 85 L155 85 L145 175 Q100 185 55 175 Z" fill={C.cream} />
    <path d="M155 100 q 30 0 28 28 q -2 26 -34 24" stroke={C.cream} strokeWidth="10" fill="none" />
    <ellipse cx="100" cy="88" rx="55" ry="8" fill={sad ? '#7C7068' : C.bean} />
    {sad && (
      <>
        <circle cx="82" cy="125" r="5" fill={C.espresso} />
        <circle cx="118" cy="125" r="5" fill={C.espresso} />
        <path d="M84 152 q 16 -12 32 0" stroke={C.espresso} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const FallingBeans: React.FC<{count: number; speed?: number}> = ({count, speed = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {new Array(count).fill(0).map((_, i) => {
        const depth = 0.4 + random(`d${i}`) * 0.9;
        const x = random(`x${i}`) * 1080;
        const y = ((random(`y${i}`) * 2400 + frame * 14 * depth * speed) % 2300) - 250;
        const rot = random(`r${i}`) * 360 + frame * (random(`s${i}`) - 0.5) * 8;
        return (
          <Bean
            key={i}
            size={36 + 60 * depth}
            rot={rot}
            style={{position: 'absolute', left: x, top: y, filter: depth < 0.7 ? `blur(${(0.7 - depth) * 10}px)` : undefined, opacity: 0.9}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- escenas
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const words = vo.lines[0].words;
  const big = (i: number) => {
    const at = f(words[i].start) - 2;
    const p = prog(frame, at, 8);
    return {opacity: p, transform: `scale(${1.5 - 0.5 * p})`, display: 'inline-block'};
  };
  return (
    <AbsoluteFill style={{background: C.espresso, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 260, textAlign: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 168, lineHeight: 0.95, color: C.cream, letterSpacing: -6}}>
        <span style={big(0)}>¿TU&nbsp;</span>
        <span style={big(1)}>CAFÉ</span>
        <br />
        <span style={big(2)}>SABE&nbsp;</span>
        <span style={big(3)}>A</span>
        <br />
        <span style={{...big(4), color: C.terra, fontFamily: font.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 230, letterSpacing: -2}}>lunes?</span>
      </div>
      <div style={{position: 'absolute', bottom: 260, transform: `rotate(${Math.sin(frame / 6) * 3}deg)`}}>
        <Mug sad frame={frame} />
      </div>
    </AbsoluteFill>
  );
};

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const bag = useSpring(0, {damping: 11, stiffness: 120});
  const tostadoAt = TOSTADO_AT - S2;
  const espAt = wordAt(1, 'Café') - S2;
  const stamp = useSpring(tostadoAt, {damping: 10, stiffness: 200});
  const float = Math.sin(frame / 14) * 10;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, ${C.cream} 0%, ${C.paper} 70%)`}}>
      <FallingBeans count={22} speed={0.8} />
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 190, color: C.espresso, lineHeight: 1, opacity: prog(frame, 2, 10), transform: `translateY(${(1 - prog(frame, 2, 14)) * 50}px)`}}>
          Grano Alto
        </div>
        <div style={{fontFamily: font.mono, fontSize: 34, letterSpacing: 8, color: C.roast, marginTop: 16, opacity: prog(frame, espAt, 10)}}>CAFÉ DE ESPECIALIDAD</div>
      </div>
      <div style={{position: 'absolute', left: '50%', top: 560, width: 640, marginLeft: -320, transform: `translateY(${(1 - bag) * 900 + float}px) rotate(${(1 - bag) * 25 - 3}deg) scale(${0.9 + 0.1 * bag})`}}>
        <Bag style={{width: 640, filter: 'drop-shadow(0 40px 50px rgba(33,20,13,0.35))'}} />
      </div>
      {frame >= tostadoAt && (
        <div
          style={{
            position: 'absolute',
            right: 70,
            top: 1300,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: C.terra,
            color: C.cream,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: font.display,
            fontWeight: 900,
            fontSize: 44,
            lineHeight: 1.05,
            transform: `scale(${stamp}) rotate(${-14 + (1 - stamp) * 60}deg)`,
            boxShadow: `0 0 0 10px ${C.cream}, 0 0 0 14px ${C.terra}`,
          }}
        >
          TOSTADO
          <br />
          ESTA
          <br />
          SEMANA
        </div>
      )}
    </AbsoluteFill>
  );
};

const Route: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = prog(frame, 6, 40);
  const hours = Math.round(interpolate(frame, [8, 50], [0, 48], {...clamp, easing: easeOut}));
  const path = 'M220 520 C 620 520, 960 640, 910 900 S 800 1250, 880 1390';
  const len = 1500;
  return (
    <AbsoluteFill style={{background: C.terra}}>
      <svg width="1080" height="1920" style={{position: 'absolute'}}>
        <path d={path} stroke="rgba(243,231,211,0.25)" strokeWidth="14" fill="none" strokeDasharray="4 26" strokeLinecap="round" />
        <path d={path} stroke={C.cream} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      </svg>
      <div style={{position: 'absolute', left: 90, top: 380, display: 'flex', alignItems: 'center', gap: 24, opacity: prog(frame, 0, 8)}}>
        <div style={{background: C.cream, borderRadius: 28, padding: 18}}>
          <Mountain size={110} />
        </div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 64, color: C.cream, lineHeight: 1}}>
          Finca
          <div style={{fontFamily: font.mono, fontWeight: 400, fontSize: 28, letterSpacing: 3, marginTop: 6}}>HUILA, COLOMBIA</div>
        </div>
      </div>
      <div style={{position: 'absolute', right: 90, top: 1380, display: 'flex', alignItems: 'center', gap: 24, flexDirection: 'row-reverse', opacity: prog(frame, 40, 8)}}>
        <div style={{background: C.cream, borderRadius: 28, padding: 14, transform: `scale(${0.5 + 0.5 * prog(frame, 40, 12)})`}}>
          <svg width="120" height="120" viewBox="0 0 200 200">
            <path d="M45 85 L155 85 L145 175 Q100 185 55 175 Z" fill={C.espresso} />
            <path d="M155 100 q 30 0 28 28 q -2 26 -34 24" stroke={C.espresso} strokeWidth="12" fill="none" />
            <ellipse cx="100" cy="88" rx="55" ry="8" fill={C.bean} />
          </svg>
        </div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 64, color: C.cream, textAlign: 'right'}}>Tu taza</div>
      </div>
      <div style={{position: 'absolute', left: 80, top: 980, fontFamily: font.display, fontWeight: 900, color: C.espresso, lineHeight: 0.85}}>
        <div style={{fontSize: 330, letterSpacing: -14}}>{hours}h</div>
        <div style={{fontSize: 52, color: C.cream, letterSpacing: 1, marginTop: 10}}>DE LA FINCA A TU PUERTA</div>
      </div>
    </AbsoluteFill>
  );
};

const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const pctAt = PCT_AT - S4;
  const pct = useSpring(pctAt, {damping: 8, stiffness: 220, mass: 0.6});
  const strike = prog(frame, pctAt + 12, 10);
  const cta = useSpring(pctAt + 22);
  const tap = frame - (pctAt + 48);
  const away = prog(frame, pctAt - 4, 16);
  const bagIn = useSpring(4, {damping: 12, stiffness: 120});
  return (
    <AbsoluteFill style={{background: C.cream, alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          width: 560,
          left: interpolate(away, [0, 1], [260, -170]),
          top: interpolate(away, [0, 1], [520, 1360]),
          transform: `scale(${interpolate(away, [0, 1], [1, 0.62]) * (0.7 + 0.3 * bagIn)}) rotate(${interpolate(away, [0, 1], [-4, 14]) + Math.sin(frame / 12) * 2}deg)`,
          transformOrigin: '50% 50%',
          opacity: bagIn,
        }}
      >
        <Bag style={{width: 560, filter: 'drop-shadow(0 30px 40px rgba(33,20,13,0.3))'}} />
      </div>
      <div style={{position: 'absolute', top: 230, fontFamily: font.serif, fontStyle: 'italic', fontSize: 110, color: C.espresso, opacity: prog(frame, 0, 10)}}>Tu primera bolsa</div>
      <div
        style={{
          position: 'absolute',
          top: 400,
          fontFamily: font.display,
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 360,
          letterSpacing: -18,
          color: C.terra,
          lineHeight: 1,
          transform: `scale(${pct}) rotate(${(1 - pct) * -20}deg)`,
          opacity: frame >= pctAt ? 1 : 0,
        }}
      >
        -30%
      </div>
      <div style={{position: 'absolute', top: 980, display: 'flex', alignItems: 'baseline', gap: 40, opacity: prog(frame, pctAt + 8, 8)}}>
        <div style={{position: 'relative', fontFamily: font.display, fontWeight: 600, fontSize: 84, color: C.roast, opacity: 0.6}}>
          $18.00
          <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 8, background: C.terra, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
        </div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 150, color: C.espresso, letterSpacing: -4}}>$12.60</div>
      </div>
      <div style={{position: 'absolute', top: 1260, transform: `scale(${cta * (tap >= 0 && tap < 8 ? 0.94 : 1)})`}}>
        <div style={{background: C.espresso, color: C.cream, fontFamily: font.display, fontWeight: 800, fontSize: 60, padding: '36px 70px', borderRadius: 999, position: 'relative', overflow: 'hidden'}}>
          Pide en granoalto.co →
          {tap >= 0 && (
            <div style={{position: 'absolute', left: '62%', top: '50%', width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', background: 'rgba(243,231,211,0.35)', transform: `scale(${interpolate(tap, [0, 18], [0, 24], clamp)})`, opacity: interpolate(tap, [0, 18], [1, 0], clamp)}} />
          )}
        </div>
      </div>
      {/* dedo que toca el botón */}
      <div style={{position: 'absolute', top: 1340, left: 640, fontSize: 120, transform: `translate(${interpolate(frame, [pctAt + 30, pctAt + 46], [260, 0], {...clamp, easing: easeOut})}px, ${interpolate(frame, [pctAt + 30, pctAt + 46], [300, 0], {...clamp, easing: easeOut})}px)`, opacity: prog(frame, pctAt + 30, 6)}}>
        👆
      </div>
      <div style={{position: 'absolute', bottom: 150, fontFamily: font.mono, fontSize: 30, letterSpacing: 4, color: C.roast, opacity: prog(frame, pctAt + 30, 10)}}>ENVÍO GRATIS · PRIMER PEDIDO</div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(0);
  return (
    <AbsoluteFill style={{background: C.espresso, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${0.8 + 0.2 * s})`, opacity: s, textAlign: 'center'}}>
        <Mountain size={220} color={C.cream} />
        <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 160, color: C.cream, lineHeight: 1, marginTop: 20}}>Grano Alto</div>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 6, color: C.sage, marginTop: 24, opacity: prog(frame, 8, 12)}}>TOSTADO CADA SEMANA</div>
      </div>
    </AbsoluteFill>
  );
};

export const Cafe: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.espresso}}>
      <Scene from={0} to={S2} exit="up" name="Gancho">
        <Hook />
      </Scene>
      <Scene from={S2} to={S3} enter="up" exit="left" name="Producto">
        <Reveal />
      </Scene>
      <Scene from={S3} to={S4} enter="left" exit="left" name="Ruta">
        <Route />
      </Scene>
      <Scene from={S4} to={S5} enter="left" exit="up" name="Oferta">
        <Offer />
      </Scene>
      <Scene from={S5} enter="up" name="Cierre">
        <EndCard />
      </Scene>
      <Flash at={S2} max={0.6} color={C.cream} />
      <Vignette strength={0.25} />
      <Grain opacity={0.07} />

      <Audio src={staticFile('voz/cafe.wav')} />
      <Music name="pulse_120" volume={0.55} duration={CAFE_DURATION} vo={vo} duck={0.5} startFrom={120 - DROP} fadeIn={4} />
      <Sfx name="riser" at={S2 - 40} volume={0.35} />
      <Sfx name="impact" at={S2} volume={0.55} />
      <Sfx name="whoosh" at={S3 - 8} volume={0.5} />
      <Sfx name="whoosh" at={S4 - 8} volume={0.5} />
      <Sfx name="whoosh_short" at={S5 - 6} volume={0.5} />
      <Sfx name="pop" at={TOSTADO_AT} volume={0.6} />
      <Sfx name="impact" at={PCT_AT} volume={0.35} />
      <Sfx name="cash" at={PCT_AT + 14} volume={0.4} />
      <Sfx name="click" at={PCT_AT + 48} volume={0.6} />
    </AbsoluteFill>
  );
};
