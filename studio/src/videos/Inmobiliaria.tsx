import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {getLength} from '@remotion/paths';
import {font} from '../brand';
import {Captions} from '../lib/Captions';
import {clamp, easeInOut, easeOut, Grain, Music, prog, Sfx, useSpring, VoData} from '../lib/core';
import {Scene} from '../lib/Whip';
import voJson from '../../public/vo/inmobiliaria.json';

// Video de propiedad para una inmobiliaria ficticia: "Casa Alameda" · Roble Inmobiliaria.
const vo = voJson as VoData;
const K = {
  bone: '#F4F1EC',
  paper: '#EAE4DA',
  ink: '#1E1F22',
  soft: '#6B6A66',
  sage: '#7E9579',
  sageLight: '#C9D4C3',
  bath: '#C7D3DC',
  sun1: '#F2A65A',
  sun2: '#E2725B',
};

const f = (s: number) => Math.round(s * 30);
const wordAt = (line: number, prefix: string) => f(vo.lines[line].words.find((w) => w.text.toLowerCase().startsWith(prefix))!.start);

const S2 = f(vo.lines[1].start) - 10;
const S3 = f(vo.lines[2].start) - 8;
const S4 = f(vo.lines[3].start) - 8;
export const INMO_DURATION = f(vo.duration) + 50;

const HAB_AT = wordAt(1, 'tres');
const BANO_AT = wordAt(1, 'dos');
const TERRAZA_AT = wordAt(1, 'terraza');
const M2_AT = wordAt(2, 'ciento');
const PARQUE_AT = wordAt(2, 'a') - 4;

// ---------------------------------------------------------------- fachada
const facade = [
  'M90 760 L990 760',
  'M160 760 L160 420 L620 420 L620 760',
  'M620 760 L620 300 L930 300 L930 760',
  'M120 420 L660 420',
  'M590 300 L970 300',
  'M200 470 L580 470 L580 700 L200 700 Z',
  'M390 470 L390 700',
  'M660 360 L890 360 L890 560 L660 560 Z',
  'M775 360 L775 560',
  'M690 610 L790 610 L790 760',
  'M690 610 L690 760',
  'M85 760 L85 690',
  'M40 650 a45 45 0 1 0 90 0 a45 45 0 1 0 -90 0',
].join(' ');

const Facade: React.FC = () => {
  const frame = useCurrentFrame();
  const len = React.useMemo(() => getLength(facade), []);
  const draw = prog(frame, 0, 60, easeInOut);
  const title = prog(frame, 22, 18);
  return (
    <AbsoluteFill style={{background: K.bone}}>
      <div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 8, color: K.sage, opacity: prog(frame, 10, 12)}}>EN VENTA · ALAMEDA NORTE</div>
        <div style={{fontFamily: font.serif, fontSize: 210, lineHeight: 0.95, color: K.ink, marginTop: 30, opacity: title, transform: `translateY(${(1 - title) * 40}px)`}}>
          Casa
          <br />
          <i>Alameda</i>
        </div>
      </div>
      <svg viewBox="0 0 1080 800" style={{position: 'absolute', top: 900, width: 1080, transform: `scale(${1 + frame * 0.0008})`}}>
        <path d={facade} fill="none" stroke={K.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <rect x="200" y="470" width="380" height="230" fill={K.sun1} opacity={0.25 * prog(frame, 50, 20)} />
        <rect x="660" y="360" width="230" height="200" fill={K.sun1} opacity={0.25 * prog(frame, 55, 20)} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- plano
const walls = [
  'M0 180 L900 180',
  'M0 180 L0 1000 L900 1000 L900 180',
  'M560 180 L560 470',
  'M560 540 L560 1000',
  'M560 520 L900 520',
  'M560 680 L900 680',
  'M0 560 L250 560',
  'M320 560 L560 560',
  'M340 560 L340 860',
  'M0 860 L340 860',
].join(' ');

type Room = {x: number; y: number; w: number; h: number; label: string; kind: 'hab' | 'bath' | 'terraza' | 'common'};
const rooms: Room[] = [
  {x: 0, y: 0, w: 900, h: 180, label: 'TERRAZA', kind: 'terraza'},
  {x: 0, y: 180, w: 560, h: 380, label: 'SALA · COCINA', kind: 'common'},
  {x: 560, y: 180, w: 340, h: 340, label: 'HAB. 1', kind: 'hab'},
  {x: 560, y: 520, w: 340, h: 160, label: 'BAÑO', kind: 'bath'},
  {x: 0, y: 560, w: 340, h: 300, label: 'HAB. 2', kind: 'hab'},
  {x: 560, y: 680, w: 340, h: 320, label: 'HAB. 3', kind: 'hab'},
  {x: 0, y: 860, w: 340, h: 140, label: 'BAÑO', kind: 'bath'},
];

const Chip: React.FC<{at: number; children: React.ReactNode; color: string; top: number}> = ({at, children, color, top}) => {
  const s = useSpring(at);
  return (
    <div style={{position: 'absolute', left: 90, top, transform: `translateX(${(1 - s) * -80}px)`, opacity: s, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{width: 26, height: 26, borderRadius: 8, background: color}} />
      <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 52, color: K.ink}}>{children}</div>
    </div>
  );
};

const Plan: React.FC = () => {
  const frame = useCurrentFrame();
  const len = React.useMemo(() => getLength(walls), []);
  const draw = prog(frame, 0, 34, easeInOut);
  const local = (abs: number) => abs - S2;
  const fill = (r: Room) => {
    const at = local(r.kind === 'hab' ? HAB_AT : r.kind === 'bath' ? BANO_AT : r.kind === 'terraza' ? TERRAZA_AT : 10);
    return prog(frame, at, 12);
  };
  const zoom = interpolate(frame, [local(TERRAZA_AT), local(TERRAZA_AT) + 50], [1, 1.12], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{background: K.bone}}>
      <div style={{position: 'absolute', top: 150, left: 90, fontFamily: font.mono, fontSize: 28, letterSpacing: 6, color: K.soft}}>PLANTA · 145 M²</div>
      <Chip at={local(HAB_AT)} color={K.sage} top={210}>3 habitaciones</Chip>
      <Chip at={local(BANO_AT)} color={K.bath} top={290}>2 baños</Chip>
      <Chip at={local(TERRAZA_AT)} color={K.sun1} top={370}>Terraza al atardecer</Chip>
      <div style={{position: 'absolute', left: 90, top: 520, width: 900, height: 1000, transform: `scale(${zoom})`, transformOrigin: '50% 0%'}}>
        <svg viewBox="-12 -12 924 1024" width="900" height="1000" style={{overflow: 'visible'}}>
          <defs>
            <linearGradient id="sunset" x1="0" x2="1">
              <stop offset="0" stopColor={K.sun1} />
              <stop offset="1" stopColor={K.sun2} />
            </linearGradient>
          </defs>
          {rooms.map((r, i) => {
            const p = fill(r);
            const color = r.kind === 'hab' ? K.sage : r.kind === 'bath' ? K.bath : r.kind === 'terraza' ? 'url(#sunset)' : K.paper;
            return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={color} opacity={(r.kind === 'hab' ? 0.55 : 0.9) * p} />;
          })}
          <path d="M0 0 L900 0 M0 0 L0 180 M900 0 L900 180" stroke={K.ink} strokeWidth="4" strokeDasharray="14 12" fill="none" opacity={draw} />
          <path d={walls} fill="none" stroke={K.ink} strokeWidth="12" strokeLinecap="square" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
          {/* puertas */}
          <path d="M560 470 A70 70 0 0 1 630 540" fill="none" stroke={K.ink} strokeWidth="3" opacity={draw} />
          <path d="M250 560 A70 70 0 0 0 320 630" fill="none" stroke={K.ink} strokeWidth="3" opacity={draw} />
          {rooms.map((r, i) => (
            <text key={`t${i}`} x={r.x + r.w / 2} y={r.y + r.h / 2 + 12} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="30" letterSpacing="3" fill={K.ink} opacity={prog(frame, 20 + i * 2, 10)}>
              {r.label}
            </text>
          ))}
          {/* sol del atardecer sobre la terraza */}
          <g opacity={prog(frame, local(TERRAZA_AT) + 6, 14)} transform={`translate(780 ${90 - prog(frame, local(TERRAZA_AT) + 6, 40) * 20})`}>
            <circle r="44" fill="#FFF3E0" />
            {new Array(8).fill(0).map((_, i) => (
              <rect key={i} x="-4" y="-78" width="8" height="20" rx="4" fill="#FFF3E0" transform={`rotate(${i * 45 + frame})`} />
            ))}
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- metros + mapa
const Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const local = (abs: number) => abs - S3;
  const m2 = Math.round(interpolate(frame, [local(M2_AT), local(M2_AT) + 40], [0, 145], {...clamp, easing: easeOut}));
  const mapIn = prog(frame, local(M2_AT) + 26, 16);
  const route = prog(frame, local(PARQUE_AT), 36, easeInOut);
  const pin = useSpring(local(M2_AT) + 36, {damping: 9});
  const routePath = 'M300 420 L300 300 L620 300 L620 160 L760 160';
  return (
    <AbsoluteFill style={{background: K.ink}}>
      <div style={{position: 'absolute', top: 200, left: 90, color: K.bone}}>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 330, letterSpacing: -16, lineHeight: 0.9}}>
          {m2}
          <span style={{fontSize: 140, letterSpacing: -4, color: K.sun1}}>m²</span>
        </div>
        <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 80, color: K.sageLight, marginTop: 10}}>de luz natural</div>
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 860, height: 760, borderRadius: 40, overflow: 'hidden', background: '#2A2B2F', opacity: mapIn, transform: `translateY(${(1 - mapIn) * 80}px)`}}>
        <svg viewBox="0 0 960 760" width="960" height="760">
          {/* manzanas */}
          {new Array(5).fill(0).map((_, i) =>
            new Array(4).fill(0).map((__, j) => (
              <rect key={`${i}${j}`} x={40 + i * 190} y={40 + j * 180} width="150" height="140" rx="14" fill="#34353A" />
            )),
          )}
          {/* parque */}
          <rect x="610" y="40" width="300" height="280" rx="24" fill={K.sage} />
          {[
            [670, 110],
            [760, 90],
            [840, 140],
            [700, 230],
            [820, 250],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="26" fill="#5F7A5A" />
          ))}
          <text x="760" y="300" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="24" letterSpacing="4" fill={K.bone}>
            PARQUE
          </text>
          <path d={routePath} fill="none" stroke={K.sun1} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset={1000 * (1 - route)} />
          {/* pin de la casa */}
          <g transform={`translate(300 440) scale(${pin})`}>
            <path d="M0 0 C -40 -50 -40 -110 0 -110 C 40 -110 40 -50 0 0 Z" fill={K.bone} />
            <path d="M-18 -64 L0 -82 L18 -64 L18 -46 L-18 -46 Z" fill={K.ink} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: 40, bottom: 36, display: 'flex', alignItems: 'baseline', gap: 16, opacity: prog(frame, local(PARQUE_AT) + 24, 10)}}>
          <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 110, color: K.sun1}}>5 min</div>
          <div style={{fontFamily: font.display, fontWeight: 600, fontSize: 44, color: K.bone}}>a pie del parque</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cierre
const Visit: React.FC = () => {
  const frame = useCurrentFrame();
  const card = useSpring(6);
  const pick = prog(frame, 30, 10);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <AbsoluteFill style={{background: K.sage, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 200, textAlign: 'center', color: K.bone}}>
        <div style={{fontFamily: font.serif, fontSize: 170, lineHeight: 0.95, opacity: prog(frame, 0, 12)}}>
          Agenda
          <br />
          <i>tu visita</i>
        </div>
      </div>
      <div style={{position: 'absolute', top: 700, width: 820, background: K.bone, borderRadius: 40, padding: '44px 50px', transform: `translateY(${(1 - card) * 200}px)`, opacity: card, boxShadow: '0 30px 60px rgba(0,0,0,0.18)'}}>
        <div style={{fontFamily: font.mono, fontSize: 28, letterSpacing: 5, color: K.soft}}>ESTA SEMANA</div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30}}>
          {days.map((d, i) => {
            const active = i === 3;
            return (
              <div key={i} style={{width: 88, textAlign: 'center'}}>
                <div style={{fontFamily: font.display, fontWeight: 600, fontSize: 30, color: K.soft}}>{d}</div>
                <div
                  style={{
                    marginTop: 12,
                    height: 88,
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: font.display,
                    fontWeight: 800,
                    fontSize: 40,
                    background: active ? (pick > 0 ? K.ink : K.paper) : K.paper,
                    color: active && pick > 0 ? K.bone : K.ink,
                    transform: active ? `scale(${1 + 0.12 * Math.sin(pick * Math.PI)})` : undefined,
                  }}
                >
                  {12 + i}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, opacity: prog(frame, 34, 10)}}>
          <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 44, color: K.ink}}>Jueves · 17:30</div>
          <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 36, color: K.bone, background: K.sage, borderRadius: 999, padding: '14px 30px'}}>Confirmar</div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 300, textAlign: 'center', color: K.ink, opacity: prog(frame, 40, 12)}}>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 96, letterSpacing: -3}}>USD 285.000</div>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 6, marginTop: 14}}>ROBLE INMOBILIARIA</div>
      </div>
    </AbsoluteFill>
  );
};

export const Inmobiliaria: React.FC = () => (
  <AbsoluteFill style={{background: K.bone}}>
    <Scene from={0} to={S2} exit="left" name="Fachada">
      <Facade />
    </Scene>
    <Scene from={S2} to={S3} enter="left" exit="up" name="Plano">
      <Plan />
    </Scene>
    <Scene from={S3} to={S4} enter="up" exit="left" name="Metros y mapa">
      <Stats />
    </Scene>
    <Scene from={S4} enter="left" name="Visita">
      <Visit />
    </Scene>
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 110}}>
      <Captions
        vo={vo}
        fontFamily={font.display}
        fontSize={50}
        color={K.bone}
        activeColor={K.sun1}
        stroke=""
        uppercase={false}
        maxWords={6}
        maxChars={30}
        activeScale={0}
        style={{fontWeight: 700, background: 'rgba(30,31,34,0.82)', borderRadius: 22, padding: '14px 26px', width: 'fit-content', margin: '0 auto'}}
      />
    </div>
    <Grain opacity={0.05} />

    <Audio src={staticFile('vo/inmobiliaria.wav')} />
    <Music name="chill_88" volume={0.5} duration={INMO_DURATION} vo={vo} duck={0.45} fadeIn={20} />
    <Sfx name="whoosh_short" at={S2} volume={0.4} />
    <Sfx name="whoosh_short" at={S3} volume={0.4} />
    <Sfx name="whoosh_short" at={S4} volume={0.4} />
    <Sfx name="pop" at={HAB_AT} volume={0.5} />
    <Sfx name="pop" at={BANO_AT} volume={0.5} />
    <Sfx name="pop" at={TERRAZA_AT} volume={0.5} />
    <Sfx name="click" at={S4 + 30} volume={0.6} />
    <Sfx name="ding" at={S4 + 34} volume={0.4} />
  </AbsoluteFill>
);
