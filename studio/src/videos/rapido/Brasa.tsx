import React from 'react';
import {AbsoluteFill, Audio, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../../brand';
import {clamp, easeIn, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, Vignette, type VoData} from '../../lib/core';
import {Scene} from '../../lib/Whip';
import {Shake} from '../../lib/kit/Fx';
import {Giant, Label, Reveal, Slam} from '../../lib/kit/Type';
import {fr, voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/brasa.json';

// Anuncio vertical de una hamburguesería ficticia: "Brasa" (smash burgers).
// Lenguaje de Grano Alto (ilustración plana + tipografía grande) con cortes cada ~1,3 s.
const vo = voJson as VoData;
const t = voTimeline(vo);
const B = {
  coal: '#141210',
  coal2: '#221D19',
  dull: '#8F8A84',
  fire: '#FF5A1F',
  ember: '#FF8A2A',
  mustard: '#FFB800',
  bun: '#E9A94F',
  bunTop: '#D98F35',
  cheese: '#FFC629',
  meat: '#6B2E1A',
  raw: '#D0505A',
  sauce: '#D7261E',
  cream: '#FFF4E6',
};

// grit_126: el compás 1 (1,905 s) cae en "Brasa." y el último (compás 8) cierra el video.
const DROP = t.ls(1);
const MUSIC_DELAY = DROP - fr(1.905);
const FINAL = MUSIC_DELAY + fr(8 * 1.905);
export const BRASA_DURATION = FINAL + 36;

const S = {
  hook: 0,
  seca: t.w(0, 'seca') - 3,
  logo: DROP,
  plancha: t.w(1, 'smash') + 8,
  carne: t.ls(2),
  smash: t.w(2, 'aplastada') - 4,
  stack: t.ls(3),
  viernes: t.ls(4),
  mitad: t.w(4, 'la') - 2,
  end: t.ls(5),
};

// ---------------------------------------------------------------- ilustraciones
const Patty: React.FC<{w: number; flat?: number; dry?: boolean}> = ({w, flat = 1, dry}) => (
  <svg width={w} height={w * 0.3 * flat + 10} viewBox={`0 0 300 ${90 * flat + 10}`} style={{display: 'block', overflow: 'visible'}}>
    <rect x="6" y="4" width="288" height={84 * flat} rx={40 * flat} fill={dry ? '#8A6A55' : B.meat} />
    {!dry &&
      new Array(14).fill(0).map((_, i) => <circle key={i} cx={30 + ((i * 53) % 250)} cy={14 + ((i * 29) % Math.max(10, 70 * flat))} r="5" fill="#8C3F22" />)}
    {dry && <path d="M60 20 L90 40 L80 60 M200 18 L180 45 L210 66 M140 10 L150 50" stroke="#5E4535" strokeWidth="4" fill="none" />}
    <rect x="6" y="4" width="288" height={18 * flat} rx={10} fill="#ffffff" opacity="0.08" />
  </svg>
);
const Bun: React.FC<{w: number; top?: boolean; pale?: boolean}> = ({w, top, pale}) =>
  top ? (
    <svg width={w} height={w * 0.42} viewBox="0 0 300 126" style={{display: 'block'}}>
      <path d="M10 120 Q10 10 150 8 Q290 10 290 120 Z" fill={pale ? '#CDB48C' : B.bunTop} />
      <path d="M40 100 Q40 30 150 26 Q200 26 230 50" stroke="#fff" strokeOpacity="0.25" strokeWidth="10" fill="none" />
      {!pale && new Array(16).fill(0).map((_, i) => <ellipse key={i} cx={50 + ((i * 47) % 200)} cy={36 + ((i * 23) % 60)} rx="5" ry="3" fill="#FFF1C9" transform={`rotate(${i * 25} ${50 + ((i * 47) % 200)} ${36 + ((i * 23) % 60)})`} />)}
    </svg>
  ) : (
    <svg width={w} height={w * 0.2} viewBox="0 0 300 60" style={{display: 'block'}}>
      <rect x="10" y="4" width="280" height="52" rx="20" fill={pale ? '#CDB48C' : B.bun} />
    </svg>
  );
const Cheese: React.FC<{w: number}> = ({w}) => (
  <svg width={w} height={w * 0.16} viewBox="0 0 300 48" style={{display: 'block', overflow: 'visible'}}>
    <path d="M0 4 L300 4 L300 16 L250 16 L240 44 L226 16 L120 16 L106 38 L94 16 L0 16 Z" fill={B.cheese} />
  </svg>
);
const Sauce: React.FC<{w: number; p: number}> = ({w, p}) => (
  <svg width={w} height={w * 0.2} viewBox="0 0 300 60" style={{display: 'block', overflow: 'visible'}}>
    <path d={`M10 6 L290 6 L290 14 Q270 ${14 + 30 * p} 255 14 Q220 ${14 + 44 * p} 200 14 L120 14 Q100 ${14 + 36 * p} 80 14 L10 14 Z`} fill={B.sauce} />
  </svg>
);

const Embers: React.FC<{count?: number}> = ({count = 34}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {new Array(count).fill(0).map((_, i) => {
        const y = 1960 - ((random(`ey${i}`) * 2000 + frame * (8 + random(`ev${i}`) * 10)) % 2000);
        const x = random(`ex${i}`) * 1080 + Math.sin(frame / 9 + i) * 20;
        const s = 4 + random(`es${i}`) * 9;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: i % 3 ? B.ember : B.mustard, boxShadow: `0 0 ${s * 3}px ${B.fire}`, opacity: 0.85}} />;
      })}
    </AbsoluteFill>
  );
};

const Griddle: React.FC = () => (
  <div style={{position: 'absolute', left: -60, right: -60, top: 1080, height: 900, background: 'linear-gradient(#3A3532, #1A1715)', transform: 'perspective(900px) rotateX(48deg)', transformOrigin: '50% 0%', boxShadow: 'inset 0 30px 60px rgba(255,90,31,0.25)'}}>
    {new Array(8).fill(0).map((_, i) => (
      <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 60 + i * 100, height: 2, background: 'rgba(255,255,255,0.05)'}} />
    ))}
  </div>
);

// ---------------------------------------------------------------- escenas
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: B.dull, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 820, transform: `translateY(${(1 - prog(frame, 0, 10)) * 500}px) rotate(${Math.sin(frame / 6) * 2}deg)`}}>
        <Bun w={800} top pale />
        <Patty w={800} dry />
        <Bun w={800} pale />
      </div>
    </AbsoluteFill>
  );
};

const Seca: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#7A756F'}}>
      {new Array(26).fill(0).map((_, i) => {
        const p = interpolate(frame, [2 + (i % 5), 26 + (i % 7)], [0, 1], {...clamp, easing: easeIn});
        const x0 = 280 + random(`cx${i}`) * 520;
        const y0 = 1060 + random(`cy${i}`) * 150;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x0 + (random(`vx${i}`) - 0.5) * 300 * p,
              top: y0 + 900 * p * p,
              width: 30 + random(`s${i}`) * 70,
              height: 24 + random(`h${i}`) * 50,
              background: i % 4 === 0 ? '#CDB48C' : '#8A6A55',
              borderRadius: 10,
              transform: `rotate(${random(`r${i}`) * 360 + p * 200}deg)`,
            }}
          />
        );
      })}
      {new Array(12).fill(0).map((_, i) => {
        const p = interpolate(frame, [0, 22], [0, 1], {...clamp, easing: easeOut});
        return <div key={`d${i}`} style={{position: 'absolute', left: 540 + (random(`dx${i}`) - 0.5) * 700 * p - 60, top: 1080 - random(`dy${i}`) * 240 * p, width: 120, height: 120, borderRadius: '50%', background: 'rgba(230,220,200,0.35)', filter: 'blur(12px)', opacity: 1 - p}} />;
      })}
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(0, {damping: 10, stiffness: 180});
  const flick = 0.85 + 0.15 * Math.sin(frame * 1.7) * Math.sin(frame * 0.6);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 70%, #5A1D08 0%, ${B.coal} 65%)`, alignItems: 'center', justifyContent: 'center'}}>
      <Embers />
      <div style={{transform: `scale(${0.6 + 0.4 * s})`, filter: `drop-shadow(0 0 ${40 * flick}px rgba(255,90,31,0.7))`, marginTop: -120}}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: font.impact,
            fontSize: 400,
            lineHeight: 1,
            letterSpacing: -4,
            backgroundImage: `linear-gradient(0deg, ${B.fire} 0%, ${B.mustard} ${55 + 10 * flick}%, #FFF3C4 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          BRASA
        </span>
      </div>
    </AbsoluteFill>
  );
};

const Plancha: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: B.coal}}>
      <Griddle />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 90 + i * 320, top: 1150 + (i % 2) * 120, transform: `scale(${0.95 + 0.03 * Math.sin(frame / 3 + i)})`}}>
          <Patty w={280} flat={0.7} />
        </div>
      ))}
      <Embers count={20} />
      {new Array(5).fill(0).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 220 + i * 150, top: 1050 - ((frame * 6 + i * 70) % 360), width: 90, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', filter: 'blur(26px)'}} />
      ))}
    </AbsoluteFill>
  );
};

const Carne: React.FC<{smashAt?: number}> = ({smashAt}) => {
  const frame = useCurrentFrame();
  const roll = interpolate(frame, [0, 14], [-700, 0], {...clamp, easing: easeOut});
  const press = smashAt !== undefined ? interpolate(frame, [smashAt - 6, smashAt], [0, 1], {...clamp, easing: easeIn}) : 0;
  const flat = smashAt !== undefined && frame >= smashAt;
  const sp = smashAt !== undefined ? spring({frame: frame - smashAt, fps: 30, config: {damping: 9, stiffness: 300, mass: 0.5}}) : 0;
  return (
    <AbsoluteFill style={{background: B.coal}}>
      <Griddle />
      {/* bola de carne → patty aplastada */}
      <div style={{position: 'absolute', left: 540 - (flat ? 360 : 230), top: flat ? 1000 : 720, transform: `translateX(${smashAt === undefined ? roll : 0}px)`}}>
        {flat ? (
          <div style={{transform: `scale(${1 + 0.12 * (1 - sp)}, ${1 - 0.3 * (1 - sp)})`}}>
            <Patty w={720} flat={0.7} />
          </div>
        ) : (
          <div style={{width: 460, height: 400, borderRadius: '48% 52% 46% 54%', background: `radial-gradient(circle at 35% 30%, #F07C84, ${B.raw} 55%, #9E2E38)`, transform: `rotate(${roll / 3}deg) scale(${1 + 0.15 * press}, ${1 - 0.3 * press})`, transformOrigin: '50% 100%'}} />
        )}
      </div>
      {/* espátula */}
      {smashAt !== undefined && (
        <div style={{position: 'absolute', left: 180, width: 720, height: 70, borderRadius: 12, background: 'linear-gradient(#E6E6E6, #9C9C9C)', top: interpolate(press, [0, 1], [380, 830]) - (flat ? interpolate(frame - smashAt, [4, 14], [0, 500], clamp) : 0), boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
          <div style={{position: 'absolute', left: 300, top: -330, width: 120, height: 340, borderRadius: 30, background: '#2A2A2A'}} />
        </div>
      )}
      {flat &&
        new Array(18).fill(0).map((_, i) => {
          const a = Math.PI + (i / 17) * Math.PI;
          const p = interpolate(frame - smashAt!, [0, 14], [0, 1], {...clamp, easing: easeOut});
          return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 520 * p, top: 1060 + Math.sin(a) * 300 * p, width: 16, height: 16, borderRadius: '50%', background: i % 2 ? B.mustard : B.ember, boxShadow: `0 0 18px ${B.fire}`, opacity: 1 - p}} />;
        })}
    </AbsoluteFill>
  );
};

const Stack: React.FC<{at: number[]}> = ({at}) => {
  const frame = useCurrentFrame();
  const layer = (i: number, node: React.ReactNode) => {
    const s = spring({frame: frame - at[i], fps: 30, config: {damping: 11, stiffness: 260, mass: 0.6}});
    return (
      <div style={{transform: `translateY(${(1 - s) * -1400}px)`, opacity: frame >= at[i] ? 1 : 0, marginTop: i === 0 ? 0 : -8}}>
        {node}
      </div>
    );
  };
  const sauceP = interpolate(frame, [at[6], at[6] + 20], [0, 1], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{background: B.cream}}>
      <div style={{position: 'absolute', left: 190, bottom: 300, width: 700, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center'}}>
        {layer(0, <Bun w={700} />)}
        {layer(1, <Patty w={720} flat={0.6} />)}
        {layer(2, <Cheese w={750} />)}
        {layer(3, <Patty w={720} flat={0.6} />)}
        {layer(4, <Cheese w={750} />)}
        {layer(6, <Sauce w={720} p={sauceP} />)}
        {layer(5, <Bun w={700} top />)}
      </div>
    </AbsoluteFill>
  );
};

const Viernes: React.FC = () => {
  const frame = useCurrentFrame();
  const days = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
  return (
    <AbsoluteFill style={{background: B.fire, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap: 18, marginTop: 200}}>
        {days.map((d, i) => {
          const on = i === 4;
          const s = interpolate(frame, [i * 2, i * 2 + 6], [0, 1], {...clamp, easing: easeOut});
          const hi = on ? spring({frame: frame - 12, fps: 30, config: {damping: 9, stiffness: 260}}) : 0;
          return (
            <div key={d} style={{width: 170, height: 230, borderRadius: 26, background: on ? B.coal : 'rgba(0,0,0,0.18)', color: on ? B.mustard : B.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.impact, fontSize: 70, transform: `translateY(${(1 - s) * 200}px) scale(${1 + 0.25 * hi})`, opacity: s, boxShadow: on ? '0 30px 60px rgba(0,0,0,0.35)' : undefined}}>
              {d}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Mitad: React.FC<{halfAt: number}> = ({halfAt}) => {
  const frame = useCurrentFrame();
  const a = useSpring(0, {damping: 11});
  const b = useSpring(4, {damping: 11});
  const tag = useSpring(halfAt, {damping: 8, stiffness: 260, mass: 0.6});
  const burger = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Bun w={380} top />
      <Cheese w={400} />
      <Patty w={390} flat={0.55} />
      <Bun w={380} />
    </div>
  );
  return (
    <AbsoluteFill style={{background: B.coal}}>
      <Embers count={16} />
      <div style={{position: 'absolute', left: 60, top: 960, transform: `translateX(${(1 - a) * -700}px)`}}>{burger}</div>
      <div style={{position: 'absolute', right: 60, top: 960, transform: `translateX(${(1 - b) * 700}px)`}}>
        {burger}
        <div style={{position: 'absolute', right: -10, top: -170, width: 260, height: 260, borderRadius: '50%', background: B.fire, color: B.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.impact, fontSize: 120, transform: `scale(${tag}) rotate(${(1 - tag) * 90 - 10}deg)`, opacity: frame >= halfAt ? 1 : 0}}>
          50%
        </div>
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC<{tagAt: number}> = ({tagAt}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0);
  return (
    <AbsoluteFill style={{background: B.coal, alignItems: 'center'}}>
      <Embers count={24} />
      <div style={{position: 'absolute', top: 520, fontFamily: font.impact, fontSize: 330, lineHeight: 1, color: B.mustard, transform: `scale(${0.8 + 0.2 * s})`, opacity: s, textShadow: `0 0 50px rgba(255,90,31,0.6)`}}>BRASA</div>
      {/* onda de sonido: "sabor que se escucha" */}
      <div style={{position: 'absolute', top: 980, display: 'flex', gap: 12, alignItems: 'center', height: 260}}>
        {new Array(23).fill(0).map((_, i) => {
          const env = Math.sin((i / 22) * Math.PI);
          const h = 20 + env * 220 * (0.4 + 0.6 * Math.abs(Math.sin(frame / 3 + i * 0.9) * Math.cos(frame / 7 + i * 0.4))) * prog(frame, tagAt - 6, 10);
          return <div key={i} style={{width: 22, height: h, borderRadius: 11, background: i % 2 ? B.fire : B.mustard}} />;
        })}
      </div>
      <div style={{position: 'absolute', top: 1340, fontFamily: font.serif, fontStyle: 'italic', fontSize: 96, color: B.cream, clipPath: `inset(0 ${(1 - prog(frame, tagAt, 14)) * 100}% 0 0)`}}>Sabor que se escucha.</div>
    </AbsoluteFill>
  );
};

export const Brasa: React.FC = () => {
  const W = 7;
  const SMASH_AT = t.w(2, 'aplastada') + 2;
  const stackAt = [0, 3, t.w(3, 'queso') - S.stack, 9, t.w(3, 'doble') - S.stack, t.w(3, 'pan') - S.stack, t.w(3, 'salsa') - S.stack];
  return (
    <AbsoluteFill style={{background: B.coal}}>
      <Shake hits={[DROP, SMASH_AT, t.w(4, 'mitad'), FINAL]} amp={16}>
        <Scene from={S.hook} to={S.seca} exit="up" dur={W} name="Gancho">
          <Hook />
        </Scene>
        <Scene from={S.seca} to={S.logo} enter="up" exit="up" dur={W} name="Seca">
          <Seca />
        </Scene>
        <Scene from={S.logo} to={S.plancha} enter="up" exit="left" dur={W} name="Logo">
          <Logo />
        </Scene>
        <Scene from={S.plancha} to={S.carne} enter="left" dur={W} name="Plancha">
          <Plancha />
        </Scene>
        <Scene from={S.carne} to={S.smash} name="Carne">
          <Carne />
        </Scene>
        <Scene from={S.smash} to={S.stack} exit="up" dur={W} name="Smash">
          <Carne smashAt={SMASH_AT - S.smash} />
        </Scene>
        <Scene from={S.stack} to={S.viernes} enter="up" exit="left" dur={W} name="Armado">
          <Stack at={stackAt} />
        </Scene>
        <Scene from={S.viernes} to={S.mitad} enter="left" exit="up" dur={W} name="Viernes">
          <Viernes />
        </Scene>
        <Scene from={S.mitad} to={S.end} enter="up" exit="up" dur={W} name="Mitad de precio">
          <Mitad halfAt={t.w(4, 'mitad') - S.mitad - 2} />
        </Scene>
        <Scene from={S.end} enter="up" dur={W} name="Cierre">
          <End tagAt={t.w(5, 'sabor') - S.end} />
        </Scene>

        {/* ---------- tipografía ---------- */}
        <Slam from={S.hook} to={S.seca} y={260} size={150} face="anton" color={B.coal} shadow={false} words={[{text: '¿OTRA', at: 0}, {text: 'HAMBURGUESA', at: t.w(0, 'hamburguesa') - 2, br: true}]} />
        <Giant from={S.seca} to={S.logo} text="SECA" y={500} width={700} enter="scale" color={B.cream} />
        <Reveal from={t.w(0, 'sin') - 2} to={S.logo} lines={['y sin sabor?']} y={720} size={130} face="serif" color={B.cream} shadow={false} />
        <Reveal from={S.plancha} to={S.carne} lines={['SMASH BURGERS', 'A LA PLANCHA']} y={420} size={140} face="anton" color={[B.cream, B.fire]} stagger={4} />
        <Reveal from={S.carne + 2} to={S.smash + 4} lines={['CARNE FRESCA']} y={420} size={150} face="anton" color={B.cream} />
        <Giant from={SMASH_AT} to={S.stack} text="¡SMASH!" y={460} width={900} enter="scale" enterDur={5} color={B.mustard} rotate={-6} />
        <Label from={SMASH_AT + 6} to={S.stack} text="AL MOMENTO" y={640} align="center" size={50} dot={B.fire} />
        <Label from={t.w(3, 'queso') - 2} to={S.viernes} text="QUESO ×2" y={300} align="left" x={80} size={56} color={B.fire} />
        <Label from={t.w(3, 'pan') - 2} to={S.viernes} text="PAN BRIOCHE" y={385} align="left" x={80} size={56} color={B.fire} />
        <Label from={t.w(3, 'salsa') - 2} to={S.viernes} text="SALSA DE LA CASA" y={470} align="left" x={80} size={56} color={B.fire} />
        <Reveal from={S.viernes + 2} to={S.mitad} lines={['ESTE', 'VIERNES']} y={300} size={200} face="anton" color={[B.cream, B.coal]} stagger={4} shadow={false} />
        <Reveal from={S.mitad + 2} to={S.end} lines={['LA SEGUNDA', 'A MITAD DE PRECIO']} y={330} size={110} face="anton" color={[B.cream, B.mustard]} stagger={4} />
      </Shake>

      <Flash at={DROP} max={0.6} color="#FFD9A8" />
      <Flash at={SMASH_AT} max={0.5} color="#FFD9A8" />
      <Flash at={FINAL} max={0.5} color="#FFD9A8" />
      <Vignette strength={0.3} />
      <Grain opacity={0.07} />

      <Audio src={staticFile('voz/brasa.wav')} />
      <Music name="grit_126" volume={0.5} duration={BRASA_DURATION} vo={vo} duck={0.6} delay={MUSIC_DELAY} fadeIn={3} fadeOut={14} />
      <Sfx name="swish" at={2} volume={0.4} />
      <Sfx name="whoosh_short" at={S.seca - 4} volume={0.4} />
      <Sfx name="glitch" at={S.seca + 2} volume={0.3} />
      <Sfx name="riser" at={DROP - 40} volume={0.3} />
      <Sfx name="impact" at={DROP} volume={0.5} />
      <Sfx name="sizzle" at={S.plancha} volume={0.5} />
      <Sfx name="whoosh_short" at={S.carne - 2} volume={0.4} />
      <Sfx name="hit" at={SMASH_AT} volume={0.5} />
      <Sfx name="sizzle" at={SMASH_AT} volume={0.7} />
      {stackAt.map((a, i) => (
        <Sfx key={i} name="pop" at={S.stack + a + 4} volume={0.35} />
      ))}
      <Sfx name="whoosh_short" at={S.viernes - 4} volume={0.4} />
      <Sfx name="click" at={S.viernes + 12} volume={0.5} />
      <Sfx name="whoosh_short" at={S.mitad - 4} volume={0.4} />
      <Sfx name="cash" at={t.w(4, 'mitad')} volume={0.4} />
      <Sfx name="whoosh_short" at={S.end - 4} volume={0.4} />
      <Sfx name="sizzle" at={t.w(5, 'sabor')} volume={0.55} />
    </AbsoluteFill>
  );
};
