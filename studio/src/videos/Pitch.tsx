import React from 'react';
import {AbsoluteFill, Audio, CalculateMetadataFunction, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {brand, color, font} from '../brand';
import {Captions} from '../lib/Captions';
import {clamp, easeOut, Grain, Music, prog, Sfx, useSpring, Vignette, VoData} from '../lib/core';
import {Iso, Wordmark} from '../lib/Iso';
import {Scene} from '../lib/Whip';
import nichos from '../data/nichos.json';
import ejemploVo from '../../public/vo/pitch-ejemplo.json';

// Video de prospección personalizado: se genera uno por cliente con `npm run pitch`.
export type PitchProps = {
  nombre: string;
  negocio: string;
  handle: string;
  nicho: string;
  colorMarca: string;
  ciudad?: string;
  firma?: string;
  ideas?: string[];
  vo: VoData;
};

export const pitchDefaults: PitchProps = {
  nombre: 'Laura',
  negocio: 'Panadería La Espiga',
  handle: '@laespiga.pan',
  nicho: 'restaurante',
  colorMarca: '#D9822B',
  ciudad: 'Guadalajara',
  firma: 'el equipo de CORTE',
  vo: ejemploVo as VoData,
};

export const calculatePitchMetadata: CalculateMetadataFunction<PitchProps> = ({props}) => ({
  durationInFrames: Math.ceil((props.vo.duration + 1.6) * 30),
});

const f = (s: number) => Math.round(s * 30);

const luminance = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.04) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const onColor = (hex: string) => (luminance(hex) > 0.4 ? color.ink : color.bone);
const initials = (s: string) =>
  s
    .replace(/^(dr|dra|lic)\.?\s+/i, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// ---------------------------------------------------------------- 1. saludo + perfil
const Hello: React.FC<PitchProps & {line1: number}> = ({nombre, negocio, handle, ciudad, nicho, colorMarca, line1}) => {
  const frame = useCurrentFrame();
  const card = useSpring(line1 - 6, {damping: 15});
  const badge = useSpring(line1 + 30, {damping: 10});
  const wave = Math.sin(frame / 4) * 18 * Math.exp(-frame / 50);
  const fg = onColor(colorMarca);
  const n = (nichos as Record<string, {nombre: string}>)[nicho]?.nombre ?? 'negocio';
  return (
    <AbsoluteFill style={{background: color.ink}}>
      <div style={{position: 'absolute', top: 150, left: 90, right: 90}}>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 5, color: color.red, opacity: prog(frame, 0, 10)}}>PREPARADO PARA {handle.toUpperCase()}</div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 170, letterSpacing: -8, color: color.bone, lineHeight: 1, marginTop: 30, opacity: prog(frame, 4, 10)}}>
          Hola, <span style={{display: 'inline-block', transform: `rotate(${wave}deg)`, transformOrigin: '70% 80%'}}>👋</span>
        </div>
        <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 200, color: colorMarca, lineHeight: 1.05, opacity: prog(frame, 10, 12), transform: `translateY(${(1 - prog(frame, 10, 16)) * 40}px)`, overflowWrap: 'anywhere'}}>
          {nombre}.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: 820,
          background: color.bone,
          borderRadius: 44,
          padding: 44,
          transform: `translateY(${(1 - card) * 1200}px)`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          <div style={{width: 150, height: 150, borderRadius: '50%', background: colorMarca, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 64, boxShadow: `0 0 0 6px ${color.bone}, 0 0 0 10px ${colorMarca}`}}>
            {initials(negocio)}
          </div>
          <div style={{minWidth: 0}}>
            <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 52, color: color.ink, lineHeight: 1.05}}>{negocio}</div>
            <div style={{fontFamily: font.display, fontWeight: 500, fontSize: 36, color: color.muted, marginTop: 6}}>{handle}</div>
            <div style={{fontFamily: font.mono, fontSize: 24, letterSpacing: 2, color: color.muted, marginTop: 10}}>
              {n.toUpperCase()}
              {ciudad ? ` · ${ciudad.toUpperCase()}` : ''}
            </div>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 40}}>
          {[0.25, 0.55, 0.35].map((o, i) => (
            <div key={i} style={{position: 'relative', aspectRatio: '9 / 16', borderRadius: 18, background: colorMarca, opacity: i === 1 ? 1 : 0.3 + o}}>
              <svg width="56" height="56" viewBox="0 0 24 24" style={{position: 'absolute', left: '50%', top: '50%', marginLeft: -28, marginTop: -28, opacity: 0.85}}>
                <path d="M8 5 L19 12 L8 19 Z" fill={fg} />
              </svg>
              {i === 1 && (
                <div style={{position: 'absolute', top: 14, left: 14, right: 14, textAlign: 'center', background: color.red, color: color.ink, fontFamily: font.display, fontWeight: 900, fontSize: 24, borderRadius: 999, padding: '8px 0', transform: `scale(${badge})`}}>
                  NUEVO REEL
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. antes / después
const BeforeAfter: React.FC<PitchProps & {line3: VoData}> = ({colorMarca, handle, line3}) => {
  const frame = useCurrentFrame();
  const fg = onColor(colorMarca);
  const after = useSpring(18, {damping: 14});
  const capStart = f(line3.lines[0].start);
  const punch = frame >= capStart && frame < capStart + 10 ? 1 + 0.05 * (1 - (frame - capStart) / 10) : 1;
  return (
    <AbsoluteFill style={{background: color.ink}}>
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 92, letterSpacing: -4, color: color.bone, lineHeight: 1}}>
        Así se verían
        <br />
        <span style={{color: color.red}}>tus videos</span>
      </div>
      {/* ANTES */}
      <div style={{position: 'absolute', left: 70, top: 470, width: 380, opacity: 0.85}}>
        <div style={{fontFamily: font.mono, fontSize: 28, letterSpacing: 5, color: color.muted, marginBottom: 18}}>ANTES</div>
        <div style={{height: 676, borderRadius: 40, border: '10px solid #26262B', background: 'linear-gradient(180deg, #5A5A5F, #3B3B40)', filter: 'grayscale(1)', position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: '50%', top: 210, width: 150, height: 150, marginLeft: -75, borderRadius: '50%', background: '#77777C'}} />
          <div style={{position: 'absolute', left: '50%', top: 380, width: 260, height: 300, marginLeft: -130, borderRadius: '130px 130px 0 0', background: '#77777C'}} />
          <div style={{position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontFamily: font.display, fontSize: 24, color: '#BDBDC2'}}>sin subtítulos · sin ritmo</div>
        </div>
      </div>
      {/* DESPUÉS */}
      <div style={{position: 'absolute', right: 70, top: 430, width: 520, transform: `translateX(${(1 - after) * 600}px) scale(${punch})`, transformOrigin: '50% 40%'}}>
        <div style={{fontFamily: font.mono, fontSize: 28, letterSpacing: 5, color: color.red, marginBottom: 18}}>DESPUÉS · CON CORTE</div>
        <div style={{height: 900, borderRadius: 52, border: '12px solid #1B1B1F', overflow: 'hidden', position: 'relative', background: `radial-gradient(circle at 30% 20%, ${colorMarca} 0%, ${colorMarca}CC 35%, #121214 100%)`, boxShadow: `0 30px 90px ${colorMarca}55`}}>
          {new Array(5).fill(0).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 160 + i * 40,
                height: 160 + i * 40,
                borderRadius: i % 2 ? '50%' : 40,
                border: `6px solid ${fg}`,
                opacity: 0.12,
                left: 40 + ((i * 97) % 300),
                top: 80 + ((i * 151) % 500),
                transform: `rotate(${frame * (i % 2 ? 1.2 : -0.8) + i * 30}deg)`,
              }}
            />
          ))}
          <div style={{position: 'absolute', top: 40, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', fontFamily: font.display, fontWeight: 700, fontSize: 26, color: fg}}>
            <span>{handle}</span>
            <span style={{background: color.red, color: color.ink, borderRadius: 8, padding: '2px 12px', fontWeight: 900}}>REEL</span>
          </div>
          <div style={{position: 'absolute', left: 20, right: 20, top: 360}}>
            <Captions vo={line3} fontFamily={font.display} fontSize={62} color="#FFFFFF" activeBg={color.ink} maxWords={2} maxChars={12} style={{fontWeight: 900}} />
          </div>
          <div style={{position: 'absolute', left: 30, right: 30, bottom: 34, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)'}}>
            <div style={{height: '100%', width: `${interpolate(frame, [0, 200], [5, 100], clamp)}%`, background: '#fff', borderRadius: 4}} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. ideas
const Ideas: React.FC<PitchProps & {ideas: string[]}> = ({negocio, colorMarca, ideas}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: color.bone}}>
      <div style={{position: 'absolute', top: 170, left: 90, right: 90}}>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 5, color: color.redDeep, opacity: prog(frame, 0, 10)}}>IDEAS DE CONTENIDO</div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 110, letterSpacing: -5, color: color.ink, lineHeight: 1, marginTop: 20, opacity: prog(frame, 2, 12)}}>
          3 videos para <span style={{fontFamily: font.serif, fontStyle: 'italic', fontWeight: 400, letterSpacing: -1}}>{negocio}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 640, display: 'flex', flexDirection: 'column', gap: 40}}>
        {ideas.slice(0, 3).map((idea, i) => {
          const p = prog(frame, 14 + i * 14, 14);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, background: '#FFFFFF', borderRadius: 34, padding: '34px 40px', boxShadow: '0 16px 40px rgba(12,12,14,0.08)', transform: `translateX(${(1 - p) * 300}px)`, opacity: p}}>
              <div style={{flex: 'none', width: 104, height: 104, borderRadius: 30, background: colorMarca, color: onColor(colorMarca), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 60}}>{i + 1}</div>
              <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 56, color: color.ink, lineHeight: 1.15}}>{idea}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 170, left: 90, right: 90, fontFamily: font.display, fontWeight: 600, fontSize: 40, color: color.muted, opacity: prog(frame, 60, 12)}}>
        Tú grabas con el celular. <span style={{color: color.ink}}>Nosotros hacemos el resto.</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. oferta
const Offer: React.FC<PitchProps> = ({firma}) => {
  const frame = useCurrentFrame();
  const big = useSpring(4, {damping: 9, stiffness: 200});
  const cta = useSpring(40);
  return (
    <AbsoluteFill style={{background: color.ink, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 260, textAlign: 'center'}}>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 120, letterSpacing: -5, color: color.bone, opacity: prog(frame, 0, 10)}}>Tu primer video</div>
        <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 280, color: color.red, lineHeight: 1, transform: `scale(${big}) rotate(${(1 - big) * -10}deg)`}}>gratis.</div>
      </div>
      <div style={{position: 'absolute', top: 900, transform: `scale(${cta})`, textAlign: 'center'}}>
        <div style={{background: color.bone, color: color.ink, fontFamily: font.display, fontWeight: 900, fontSize: 64, padding: '40px 64px', borderRadius: 999}}>Responde «QUIERO» →</div>
        <div style={{fontFamily: font.display, fontWeight: 500, fontSize: 36, color: color.muted, marginTop: 30}}>y lo tienes editado en 72 horas</div>
      </div>
      <div style={{position: 'absolute', bottom: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: prog(frame, 20, 12)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <Iso size={110} split={interpolate(frame, [20, 30], [0.5, 0], {...clamp, easing: easeOut})} />
          <Wordmark size={96} />
        </div>
        <div style={{fontFamily: font.display, fontWeight: 500, fontSize: 34, color: color.bone, marginTop: 26}}>— {firma ?? 'el equipo de CORTE'}</div>
        <div style={{fontFamily: font.mono, fontSize: 28, letterSpacing: 2, color: color.red, marginTop: 12}}>
          {brand.web} · {brand.handle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Pitch: React.FC<PitchProps> = (props) => {
  const {vo} = props;
  const L = vo.lines;
  const B = f(L[2].start) - 8;
  const C = f(L[4].start) - 8;
  const D = f(L[5].start) - 8;
  // los subtítulos del teléfono viven dentro de la escena B: sus tiempos van relativos a ella
  const shift = (t: number) => t - B / 30;
  const line3: VoData = {
    ...vo,
    lines: [{...L[3], start: shift(L[3].start), end: shift(L[3].end), words: L[3].words.map((w) => ({...w, start: shift(w.start), end: shift(w.end)}))}],
  };
  const ideas = props.ideas?.length ? props.ideas : ((nichos as Record<string, {ideas: string[]}>)[props.nicho] ?? nichos.otro).ideas;
  const total = Math.ceil((vo.duration + 1.6) * 30);
  return (
    <AbsoluteFill style={{background: color.ink}}>
      <Scene from={0} to={B} exit="left" name="Saludo">
        <Hello {...props} line1={f(L[1].start)} />
      </Scene>
      <Scene from={B} to={C} enter="left" exit="up" name="Antes y después">
        <BeforeAfter {...props} line3={line3} />
      </Scene>
      <Scene from={C} to={D} enter="up" exit="left" name="Ideas">
        <Ideas {...props} ideas={ideas} />
      </Scene>
      <Scene from={D} enter="left" name="Oferta">
        <Offer {...props} />
      </Scene>
      <Vignette strength={0.25} />
      <Grain opacity={0.05} />

      <Audio src={staticFile(`vo/${vo.name}.wav`)} />
      <Music name="tech_112" volume={0.45} duration={total} vo={vo} duck={0.45} fadeIn={15} />
      <Sfx name="pop" at={f(L[1].start) + 30} volume={0.5} />
      <Sfx name="whoosh_short" at={B} volume={0.4} />
      <Sfx name="whoosh_short" at={C} volume={0.4} />
      <Sfx name="whoosh_short" at={D} volume={0.4} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="pop" at={C + 14 + i * 14} volume={0.4} />
      ))}
      <Sfx name="impact" at={D + 4} volume={0.4} />
    </AbsoluteFill>
  );
};
