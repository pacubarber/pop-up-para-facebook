import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {brand, color, font} from '../brand';
import {clamp, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, Vignette} from '../lib/core';
import {Iso, Wordmark} from '../lib/Iso';

// Showreel de CORTE: montaje de los trabajos del portafolio cortado a 120 BPM.
// 1 tiempo = 15 frames · 1 compás = 60 frames. La música (pulse_120) marca la estructura:
// intro 0–120 · drop 120 · quiebre 600–720 · segundo drop 720 · golpe final 960.
const BEAT = 15;
const BAR = 60;
export const SHOWREEL_DURATION = 1035;

type Work = {slug: string; client: string; kind: string; tags: string[]; vertical: boolean; trim: number};
export const works: Work[] = [
  {slug: 'podcast-mente-fundadora', client: 'Mente Fundadora', kind: 'Clip de podcast', tags: ['Subtítulos karaoke', 'Lip-sync animado', 'Gráficos de énfasis'], vertical: true, trim: 11},
  {slug: 'anuncio-grano-alto', client: 'Grano Alto', kind: 'Anuncio de producto', tags: ['Ilustración', 'Transiciones', 'Diseño sonoro'], vertical: true, trim: 2.3},
  {slug: 'saas-flujo', client: 'Flujo', kind: 'Video de producto SaaS', tags: ['UI animada', 'Zoom de pantalla', 'Locución'], vertical: false, trim: 4.0},
  {slug: 'inmobiliaria-casa-alameda', client: 'Casa Alameda', kind: 'Video inmobiliario', tags: ['Plano animado', 'Mapas', 'Subtítulos'], vertical: true, trim: 3.2},
];
const src = (slug: string) => staticFile(`reel/${slug}.mp4`);

const Timecode: React.FC<{frame: number; style?: React.CSSProperties}> = ({frame, style}) => {
  const ff = String(frame % 30).padStart(2, '0');
  const ss = String(Math.floor(frame / 30) % 60).padStart(2, '0');
  const mm = String(Math.floor(frame / 1800)).padStart(2, '0');
  return <span style={{fontFamily: font.mono, ...style}}>{`00:${mm}:${ss}:${ff}`}</span>;
};

const Phone: React.FC<{slug: string; trim: number; width: number; style?: React.CSSProperties}> = ({slug, trim, width, style}) => (
  <div
    style={{
      width,
      height: width * (16 / 9),
      borderRadius: width * 0.12,
      border: `${width * 0.035}px solid #1B1B1F`,
      boxShadow: '0 40px 90px rgba(0,0,0,0.55), 0 0 0 2px #2E2E35',
      overflow: 'hidden',
      background: '#000',
      ...style,
    }}
  >
    <OffthreadVideo src={src(slug)} trimBefore={Math.round(trim * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);

const Browser: React.FC<{slug: string; trim: number; width: number; style?: React.CSSProperties}> = ({slug, trim, width, style}) => (
  <div style={{width, borderRadius: 18, overflow: 'hidden', background: '#1B1B1F', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', ...style}}>
    <div style={{height: 36, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: '50%', background: c}} />
      ))}
    </div>
    <OffthreadVideo src={src(slug)} trimBefore={Math.round(trim * 30)} muted style={{width: '100%', display: 'block'}} />
  </div>
);

// ---------------------------------------------------------------- intro
const introWords = ['EDITAMOS', 'VIDEOS', 'QUE NADIE', 'SE SALTA.'];
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(3, Math.floor(frame / (BEAT * 2)));
  const local = frame - i * BEAT * 2;
  const s = interpolate(local, [0, 6], [1.25, 1], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{background: color.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 56, left: 70, display: 'flex', alignItems: 'center', gap: 16, color: color.bone, fontSize: 30}}>
        <div style={{width: 22, height: 22, borderRadius: '50%', background: color.red, opacity: Math.floor(frame / 15) % 2 ? 0.25 : 1}} />
        <span style={{fontFamily: font.mono, letterSpacing: 4}}>REC</span>
      </div>
      <Timecode frame={frame} style={{position: 'absolute', top: 56, right: 70, fontSize: 30, color: color.muted, letterSpacing: 2}} />
      <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 250, letterSpacing: -12, color: i === 3 ? color.red : color.bone, transform: `scale(${s})`}}>{introWords[i]}</div>
      <div style={{position: 'absolute', bottom: 70, left: 70, right: 70, height: 4, background: color.line}}>
        <div style={{width: `${(frame / 120) * 100}%`, height: '100%', background: color.red}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- logo
const LogoSlam: React.FC<{tagline?: string}> = ({tagline = brand.tagline}) => {
  const frame = useCurrentFrame();
  const join = interpolate(frame, [0, 8], [1, 0], {...clamp, easing: easeOut});
  const word = prog(frame, 8, 14);
  return (
    <AbsoluteFill style={{background: color.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 46}}>
        <Iso size={300} split={join} style={{transform: `scale(${1 + 0.06 * Math.max(0, 1 - frame / 10)})`}} />
        <div style={{overflow: 'hidden'}}>
          <Wordmark size={250} style={{transform: `translateX(${(1 - word) * -110}%)`}} />
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 190, fontFamily: font.serif, fontStyle: 'italic', fontSize: 72, color: color.muted, opacity: prog(frame, 22, 12)}}>{tagline}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- montaje 1
const Feature: React.FC<{work: Work; index: number}> = ({work, index}) => {
  const frame = useCurrentFrame();
  const left = index % 2 === 0;
  const dev = useSpring(0, {damping: 16, stiffness: 140});
  return (
    <AbsoluteFill style={{background: color.ink}}>
      <div
        style={{
          position: 'absolute',
          fontFamily: font.display,
          fontWeight: 900,
          fontSize: 760,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${color.line}`,
          top: -40,
          [left ? 'right' : 'left']: 40,
          letterSpacing: -40,
        }}
      >
        0{index + 1}
      </div>
      <div style={{position: 'absolute', top: 0, bottom: 0, [left ? 'left' : 'right']: 140, width: 760, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={{fontFamily: font.mono, fontSize: 28, letterSpacing: 6, color: color.red, opacity: prog(frame, 2, 6)}}>{work.kind.toUpperCase()}</div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 120, letterSpacing: -5, color: color.bone, lineHeight: 1, marginTop: 18, transform: `translateY(${(1 - prog(frame, 0, 10)) * 40}px)`, opacity: prog(frame, 0, 8)}}>
          {work.client}
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 36}}>
          {work.tags.map((t, i) => (
            <div key={t} style={{fontFamily: font.display, fontWeight: 600, fontSize: 30, color: color.bone, border: `2px solid ${color.line}`, borderRadius: 999, padding: '10px 24px', opacity: prog(frame, 8 + i * 5, 6), transform: `translateY(${(1 - prog(frame, 8 + i * 5, 8)) * 20}px)`}}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', top: 0, bottom: 0, [left ? 'right' : 'left']: work.vertical ? 260 : 80, display: 'flex', alignItems: 'center', transform: `translateY(${(1 - dev) * 500}px) rotate(${(1 - dev) * (left ? 8 : -8)}deg)`}}>
        {work.vertical ? <Phone slug={work.slug} trim={work.trim} width={430} /> : <Browser slug={work.slug} trim={work.trim} width={980} />}
      </div>
    </AbsoluteFill>
  );
};

const Triptych: React.FC<{trims?: number[]}> = ({trims = [16, 6.5, 9.5]}) => {
  const frame = useCurrentFrame();
  const vertical = works.filter((w) => w.vertical);
  return (
    <AbsoluteFill style={{background: color.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 60}}>
      {vertical.map((w, i) => {
        const s = rise(frame, i * 4);
        return (
          <div key={w.slug} style={{transform: `translateY(${(1 - s) * (i % 2 ? -700 : 700)}px)`}}>
            <Phone slug={w.slug} trim={trims[i]} width={420} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
// entrada simple sin hooks (para usar dentro de un map)
const rise = (frame: number, at: number) => interpolate(frame, [at, at + 12], [0, 1], {...clamp, easing: easeOut});

// ---------------------------------------------------------------- servicios
const services = ['REELS', 'TIKTOK', 'SHORTS', 'PODCASTS', 'ANUNCIOS', 'YOUTUBE', 'MOTION', 'SUBTÍTULOS'];
const Services: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(services.length - 1, Math.floor(frame / BEAT));
  const local = frame - i * BEAT;
  const bgs = [color.ink, color.red, color.bone];
  const bg = bgs[i % 3];
  const fg = bg === color.bone ? color.ink : color.bone;
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 60, left: 70, fontFamily: font.mono, fontSize: 28, letterSpacing: 6, color: fg, opacity: 0.6}}>QUÉ EDITAMOS</div>
      <div style={{position: 'absolute', top: 60, right: 70, fontFamily: font.mono, fontSize: 28, color: fg, opacity: 0.6}}>
        {String(i + 1).padStart(2, '0')}/{String(services.length).padStart(2, '0')}
      </div>
      <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 280, letterSpacing: -14, color: fg, transform: `translateY(${interpolate(local, [0, 5], [60, 0], {...clamp, easing: easeOut})}px)`}}>{services[i]}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- quiebre: línea de tiempo
const clips = [
  {track: 0, from: 0, to: 0.22, c: '#3B6EF5'},
  {track: 0, from: 0.22, to: 0.5, c: '#7C5CFF'},
  {track: 0, from: 0.5, to: 0.78, c: '#3B6EF5'},
  {track: 0, from: 0.78, to: 1, c: '#7C5CFF'},
  {track: 1, from: 0.08, to: 0.36, c: color.red},
  {track: 1, from: 0.55, to: 0.86, c: color.red},
  {track: 2, from: 0, to: 1, c: '#2BB673'},
];
const Breakdown: React.FC = () => {
  const frame = useCurrentFrame();
  const head = interpolate(frame, [0, 120], [0.04, 0.96], clamp);
  const word2 = prog(frame, BAR, 14);
  return (
    <AbsoluteFill style={{background: color.bone}}>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: font.serif, fontSize: 210, color: color.ink, lineHeight: 1}}>
        <span style={{opacity: prog(frame, 0, 14)}}>Cada corte </span>
        <i style={{opacity: word2, display: 'inline-block', transform: `translateY(${(1 - word2) * 30}px)`}}>
          cuenta<span style={{color: color.red}}>.</span>
        </i>
      </div>
      <div style={{position: 'absolute', left: 160, right: 160, top: 560, height: 300, background: color.ink, borderRadius: 24, padding: '26px 30px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 20, color: color.muted, marginBottom: 14}}>
          <span>V1 · V2 · A1</span>
          <Timecode frame={frame + 600} />
        </div>
        <div style={{position: 'relative', height: 200}}>
          {clips.map((c, i) => (
            <div key={i} style={{position: 'absolute', left: `${c.from * 100}%`, width: `calc(${(c.to - c.from) * 100}% - 6px)`, top: c.track * 68, height: 56, borderRadius: 10, background: c.c, opacity: c.track === 2 ? 0.75 : 0.9}}>
              {c.track === 2 && (
                <svg width="100%" height="56" preserveAspectRatio="none" viewBox="0 0 200 56">
                  <polyline points={new Array(100).fill(0).map((_, k) => `${k * 2},${28 + Math.sin(k * 1.7) * Math.cos(k * 0.31) * 20}`).join(' ')} fill="none" stroke="#0C3D24" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          ))}
          {/* marcas de corte en cada tiempo */}
          {new Array(8).fill(0).map((_, k) => {
            const at = k * BEAT;
            const x = 0.04 + k * 0.12;
            return frame >= at ? <div key={k} style={{position: 'absolute', left: `${x * 100}%`, top: -8, bottom: -8, width: 3, background: color.red, opacity: interpolate(frame, [at, at + 10], [1, 0.45], clamp)}} /> : null;
          })}
          <div style={{position: 'absolute', left: `${head * 100}%`, top: -18, bottom: -10, width: 4, background: color.bone}}>
            <div style={{position: 'absolute', top: -6, left: -10, width: 24, height: 18, background: color.bone, clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}} />
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 110, width: '100%', textAlign: 'center', fontFamily: font.display, fontWeight: 600, fontSize: 44, color: color.ink, opacity: prog(frame, 30, 14)}}>
        Ritmo, subtítulos, sonido y motion. Todo en la misma edición.
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- montaje 2 (cortes cada 2 tiempos)
type Cut = {kind: 'phone' | 'browser' | 'trip'; slug?: string; trim?: number; word?: string; bg: string};
const cuts: Cut[] = [
  {kind: 'trip', bg: color.red},
  {kind: 'browser', slug: 'saas-flujo', trim: 8.6, word: 'UI', bg: color.ink},
  {kind: 'phone', slug: 'anuncio-grano-alto', trim: 9.8, word: 'MOTION', bg: color.ink},
  {kind: 'phone', slug: 'podcast-mente-fundadora', trim: 18.5, word: 'SUBTÍTULOS', bg: color.red},
  {kind: 'phone', slug: 'inmobiliaria-casa-alameda', trim: 5.6, word: 'RITMO', bg: color.ink},
  {kind: 'browser', slug: 'saas-flujo', trim: 11.4, word: 'MARCA', bg: color.red},
];
const FastCut: React.FC<{cut: Cut}> = ({cut}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 8], [1.12, 1], {...clamp, easing: easeOut});
  if (cut.kind === 'trip') return <Triptych trims={[19, 10.5, 12.5]} />;
  const fg = cut.bg === color.red ? color.ink : color.red;
  return (
    <AbsoluteFill style={{background: cut.bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', fontFamily: font.display, fontWeight: 900, fontSize: 330, letterSpacing: -16, color: fg, opacity: 0.95, transform: `scale(${s})`}}>{cut.word}</div>
      <div style={{transform: `scale(${s})`}}>
        {cut.kind === 'phone' ? <Phone slug={cut.slug!} trim={cut.trim!} width={470} /> : <Browser slug={cut.slug!} trim={cut.trim!} width={1250} />}
      </div>
    </AbsoluteFill>
  );
};

const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useSpring(0, {damping: 10, stiffness: 200});
  const b = useSpring(BEAT * 2, {damping: 10, stiffness: 200});
  return (
    <AbsoluteFill style={{background: color.bone, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 170, letterSpacing: -8, color: color.ink, lineHeight: 1, transform: `scale(${a})`}}>Reels desde</div>
      <div style={{fontFamily: font.serif, fontStyle: 'italic', fontSize: 230, color: color.red, lineHeight: 1, transform: `scale(${b})`, marginTop: 10}}>5 USD.</div>
      <div style={{position: 'absolute', bottom: 90, fontFamily: font.mono, fontSize: 26, letterSpacing: 5, color: color.muted, opacity: prog(frame, 40, 10)}}>6 VIDEOS POR 50 USD · ENTREGA EN 72 H</div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: color.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        <Iso size={200} split={interpolate(frame, [0, 8], [0.6, 0], {...clamp, easing: easeOut})} />
        <Wordmark size={170} />
      </div>
      <div style={{fontFamily: font.display, fontWeight: 500, fontSize: 44, color: color.bone, marginTop: 40, opacity: prog(frame, 8, 12)}}>{brand.descriptor} para marcas y creadores</div>
      <div style={{fontFamily: font.mono, fontSize: 32, letterSpacing: 3, color: color.red, marginTop: 26, opacity: prog(frame, 16, 12)}}>
        {brand.web} · {brand.handle}
      </div>
    </AbsoluteFill>
  );
};

export const Showreel: React.FC = () => {
  return (
    <AbsoluteFill style={{background: color.ink}}>
      <Sequence durationInFrames={120} name="Intro">
        <Intro />
      </Sequence>
      <Sequence from={120} durationInFrames={60} name="Logo">
        <LogoSlam />
      </Sequence>
      {works.map((w, i) => (
        <Sequence key={w.slug} from={180 + i * BAR} durationInFrames={BAR} name={w.client}>
          <Feature work={w} index={i} />
        </Sequence>
      ))}
      <Sequence from={420} durationInFrames={60} name="Tríptico">
        <Triptych />
      </Sequence>
      <Sequence from={480} durationInFrames={120} name="Servicios">
        <Services />
      </Sequence>
      <Sequence from={600} durationInFrames={120} name="Quiebre">
        <Breakdown />
      </Sequence>
      {cuts.map((c, i) => (
        <Sequence key={i} from={720 + i * BEAT * 2} durationInFrames={BEAT * 2} name={`Corte ${i + 1}`}>
          <FastCut cut={c} />
        </Sequence>
      ))}
      <Sequence from={900} durationInFrames={60} name="Oferta">
        <Offer />
      </Sequence>
      <Sequence from={960} name="Cierre">
        <EndCard />
      </Sequence>

      {[120, 180, 240, 300, 360, 420, 480, 720, 900, 960].map((at) => (
        <Flash key={at} at={at} max={at === 120 || at === 720 || at === 960 ? 0.7 : 0.25} dur={5} />
      ))}
      <Vignette strength={0.3} />
      <Grain opacity={0.06} />

      <Music name="pulse_120" volume={0.9} duration={SHOWREEL_DURATION} fadeIn={1} fadeOut={45} />
      <Sfx name="riser" at={58} volume={0.45} />
      <Sfx name="impact" at={120} volume={0.6} />
      {[180, 240, 300, 360, 420].map((at) => (
        <Sfx key={at} name="whoosh_short" at={at - 4} volume={0.35} />
      ))}
      <Sfx name="glitch" at={598} volume={0.35} />
      <Sfx name="impact" at={720} volume={0.55} />
      <Sfx name="impact" at={960} volume={0.5} />
    </AbsoluteFill>
  );
};
