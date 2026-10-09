import React from 'react';
import {AbsoluteFill, Audio, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {noise2D} from '@remotion/noise';
import {font} from '../brand';
import {Captions} from '../lib/Captions';
import {Character, looks} from '../lib/Character';
import {easeOut, Flash, Grain, Music, prog, Sfx, useSpring, Vignette, VoData} from '../lib/core';
import voJson from '../../public/voz/podcast.json';

// Clip de podcast vertical para un cliente ficticio: "Mente Fundadora".
const vo = voJson as VoData;
const P = {
  bg: '#0B201C',
  bg2: '#06110F',
  cream: '#F4EBDD',
  amber: '#F5B83D',
  mint: '#7FE0C2',
  teal: '#2E7D6B',
};

export const PODCAST_DURATION = Math.ceil((vo.duration + 1.8) * 30);
const L = vo.lines;
const f = (s: number) => Math.round(s * 30);

type Shot = {from: number; kind: 'valeria' | 'diego' | 'wide'; zoom?: number};
const shots: Shot[] = [
  {from: 0, kind: 'valeria'},
  {from: f(L[1].start - 0.15), kind: 'diego'},
  {from: f(L[3].start - 0.1), kind: 'diego', zoom: 1.14},
  {from: f(L[5].start - 0.15), kind: 'wide'},
  {from: f(L[6].start - 0.15), kind: 'diego', zoom: 1.06},
];

const speakerAt = (t: number) => L.find((l) => t >= l.start && t <= l.end)?.voice;

const useMouth = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audio = useAudioData(staticFile('voz/podcast.wav'));
  if (!audio) return 0;
  const bins = visualizeAudio({fps, frame, audioData: audio, numberOfSamples: 32, smoothing: true});
  const level = bins.slice(0, 10).reduce((a, b) => a + b, 0);
  return Math.min(1, level * 2.2);
};

const Studio: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #1D4A40 0%, #0D2622 55%, #071311 100%)`}}>
      {/* luces bokeh del estudio */}
      {new Array(9).fill(0).map((_, i) => {
        const x = random(`bx${i}`) * 100;
        const y = random(`by${i}`) * 60;
        const r = 40 + random(`br${i}`) * 90;
        const drift = Math.sin(frame / 60 + i) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: r,
              height: r,
              borderRadius: '50%',
              background: i % 3 === 0 ? P.amber : i % 3 === 1 ? P.mint : '#FFFFFF',
              opacity: 0.12,
              filter: 'blur(18px)',
              transform: `translateY(${drift}px)`,
            }}
          />
        );
      })}
      {/* letrero ON AIR */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 52,
          fontFamily: font.mono,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 6,
          color: '#FF6A4D',
          padding: '10px 18px',
          border: '3px solid #FF6A4D',
          borderRadius: 12,
          textShadow: '0 0 18px #FF6A4D',
          boxShadow: '0 0 24px rgba(255,106,77,0.45), inset 0 0 16px rgba(255,106,77,0.3)',
          opacity: 0.75 + 0.25 * Math.sin(frame / 7),
        }}
      >
        ON AIR
      </div>
      {/* mesa */}
      <div style={{position: 'absolute', left: -40, right: -40, bottom: -40, height: 120, background: '#2A1D16', borderTop: '6px solid #3B2A20'}} />
      {children}
    </AbsoluteFill>
  );
};

const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const mouth = useMouth();
  const speaker = speakerAt(t);
  const blinkV = random(`bv${Math.floor(frame / 70)}`) > 0.3 && frame % 70 < 3;
  const blinkD = random(`bd${Math.floor(frame / 83)}`) > 0.3 && (frame + 31) % 83 < 3;
  const shot = [...shots].reverse().find((s) => frame >= s.from)!;
  const local = frame - shot.from;
  const punch = 1 + 0.07 * (1 - easeOut(Math.min(1, local / 10)));
  const drift = 1 + local * 0.0006;
  const shakeX = noise2D('sx', frame / 40, 0) * 6;
  const shakeY = noise2D('sy', frame / 40, 0) * 5;
  const scale = (shot.zoom ?? 1) * punch * drift;
  const vMouth = speaker === 'valeria' ? mouth : 0;
  const dMouth = speaker === 'diego' ? mouth : 0;
  const listenTilt = (who: string) => (speaker && speaker !== who ? Math.sin(frame / 25) * 2.5 : Math.sin(frame / 18) * 1.2);

  return (
    <Studio>
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px) scale(${scale})`, transformOrigin: '50% 60%'}}>
        {shot.kind === 'wide' ? (
          <>
            <Character look={looks.valeria} mouth={vMouth} blink={blinkV} tilt={listenTilt('valeria')} mic="right" style={{position: 'absolute', left: -10, bottom: 60, width: 520}} />
            <Character look={looks.diego} mouth={dMouth} blink={blinkD} tilt={listenTilt('diego')} mic="left" style={{position: 'absolute', right: -10, bottom: 60, width: 520}} />
          </>
        ) : (
          <Character
            look={looks[shot.kind]}
            mouth={shot.kind === 'valeria' ? vMouth : dMouth}
            blink={shot.kind === 'valeria' ? blinkV : blinkD}
            tilt={listenTilt(shot.kind)}
            mic={shot.kind === 'valeria' ? 'right' : 'left'}
            style={{position: 'absolute', left: '50%', bottom: 40, width: 760, marginLeft: -380}}
          />
        )}
      </AbsoluteFill>
    </Studio>
  );
};

const NameTag: React.FC<{name: string; role: string; at: number; until: number}> = ({name, role, at, until}) => {
  const frame = useCurrentFrame();
  const inP = prog(frame, at, 14);
  const outP = prog(frame, until - 10, 10);
  if (frame < at || frame > until) return null;
  return (
    <div style={{position: 'absolute', left: 40, bottom: 150, transform: `translateX(${(1 - inP) * -60 + outP * -60}px)`, opacity: inP * (1 - outP)}}>
      <div style={{background: P.amber, color: '#1A1208', fontFamily: font.display, fontWeight: 900, fontSize: 40, padding: '8px 18px', borderRadius: '10px 10px 10px 0', display: 'inline-block'}}>{name}</div>
      <div style={{background: 'rgba(6,17,15,0.85)', color: P.cream, fontFamily: font.display, fontWeight: 500, fontSize: 28, padding: '8px 18px', borderRadius: '0 10px 10px 10px'}}>{role}</div>
    </div>
  );
};

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audio = useAudioData(staticFile('voz/podcast.wav'));
  if (!audio) return null;
  const bins = visualizeAudio({fps, frame, audioData: audio, numberOfSamples: 64, smoothing: true}).slice(0, 28);
  const bars = [...bins.slice().reverse(), ...bins];
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 90}}>
      {bars.map((b, i) => (
        <div key={i} style={{width: 9, height: 8 + Math.min(80, b * 520), borderRadius: 5, background: i % 7 === 0 ? P.amber : P.mint, opacity: 0.85}} />
      ))}
    </div>
  );
};

const TimesThree: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const s = useSpring(at, {damping: 9, stiffness: 180});
  const out = prog(frame, at + 52, 10);
  if (frame < at || out >= 1) return null;
  const arrow = prog(frame, at + 4, 22);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: `rgba(6,17,15,${0.55 * (1 - out)})`, opacity: 1 - out}}>
      <svg width="760" height="420" viewBox="0 0 760 420" style={{position: 'absolute'}}>
        <polyline
          points="20,380 200,330 330,350 480,210 600,150 740,30"
          fill="none"
          stroke={P.mint}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1200"
          strokeDashoffset={1200 * (1 - arrow)}
        />
      </svg>
      <div style={{fontFamily: font.impact, fontSize: 340, color: P.amber, transform: `scale(${s}) rotate(${-6 * s}deg)`, textShadow: '0 20px 60px rgba(0,0,0,0.5)', lineHeight: 1}}>x3</div>
      <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 56, color: P.cream, letterSpacing: 2, marginTop: -10, opacity: prog(frame, at + 8, 10)}}>VENTAS</div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{at: number; until: number; children: React.ReactNode}> = ({at, until, children}) => {
  const frame = useCurrentFrame();
  const s = useSpring(at);
  const out = prog(frame, until, 8);
  if (frame < at || out >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 140,
        left: '50%',
        transform: `translateX(-50%) scale(${s * (1 - out)})`,
        background: P.cream,
        color: '#0B201C',
        fontFamily: font.display,
        fontWeight: 900,
        fontSize: 52,
        padding: '18px 34px',
        borderRadius: 999,
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

export const Podcast: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const word = (lineIdx: number, w: string) => L[lineIdx].words.find((x) => x.text.toLowerCase().startsWith(w))!;
  const x3At = f(word(4, 'triplicaron').start);
  const hoursAt = f(word(3, 'diez').start);
  const endAt = f(vo.duration + 0.1);
  const titleIn = prog(frame, 2, 16);
  const endP = prog(frame, endAt, 14);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${P.bg} 0%, ${P.bg2} 100%)`}}>
      {/* cabecera */}
      <div style={{position: 'absolute', top: 92, left: 60, right: 60, textAlign: 'center'}}>
        <div style={{fontFamily: font.mono, fontSize: 30, letterSpacing: 6, color: P.mint, opacity: titleIn}}>MENTE FUNDADORA · EP. 47</div>
        <div style={{fontFamily: font.impact, fontSize: 104, lineHeight: 1.02, color: P.cream, marginTop: 18, transform: `translateY(${(1 - titleIn) * 40}px)`, opacity: titleIn}}>
          EL ERROR QUE CASI
          <br />
          <span style={{color: P.amber}}>LE CUESTA LA EMPRESA</span>
        </div>
      </div>

      {/* "cámara" */}
      <div style={{position: 'absolute', top: 420, left: 40, right: 40, height: 930, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
        <Camera />
        <NameTag name="Valeria Soto" role="Host" at={8} until={f(L[1].start - 0.2)} />
        <NameTag name="Diego Ramos" role="Fundador de Kora" at={f(L[1].start)} until={f(L[1].start) + 75} />
        <Chip at={hoursAt} until={hoursAt + 60}>⏱ 10 h / semana</Chip>
        <TimesThree at={x3At} />
        <Flash at={x3At} max={0.5} color={P.amber} />
      </div>

      {/* subtítulos */}
      <div style={{position: 'absolute', top: 1400, left: 40, right: 40}}>
        <Captions
          vo={vo}
          fontFamily={font.impact}
          fontSize={116}
          color={P.cream}
          activeColor={P.amber}
          emphasis={{cliente: P.mint, tecnología: P.mint, triplicaron: P.mint, historia: P.mint}}
          maxWords={3}
          maxChars={15}
        />
      </div>

      {/* onda + progreso */}
      <div style={{position: 'absolute', bottom: 112, left: 0, right: 0}}>
        <Waveform />
      </div>
      <div style={{position: 'absolute', bottom: 70, left: 60, right: 60, height: 10, borderRadius: 5, background: 'rgba(244,235,221,0.15)'}}>
        <div style={{width: `${(frame / durationInFrames) * 100}%`, height: '100%', borderRadius: 5, background: P.amber}} />
      </div>

      {/* cierre */}
      {frame >= endAt && (
        <AbsoluteFill style={{background: `rgba(6,17,15,${0.92 * endP})`, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: `translateY(${(1 - endP) * 60}px)`, opacity: endP, textAlign: 'center'}}>
            <div style={{fontFamily: font.mono, fontSize: 34, letterSpacing: 6, color: P.mint}}>EPISODIO COMPLETO</div>
            <div style={{fontFamily: font.impact, fontSize: 132, color: P.cream, lineHeight: 1.0, marginTop: 20}}>
              LINK EN
              <br />
              <span style={{color: P.amber}}>LA BIO</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      <Vignette strength={0.35} />
      <Grain opacity={0.05} />

      <Audio src={staticFile('voz/podcast.wav')} />
      <Music name="chill_88" volume={0.32} duration={durationInFrames} vo={vo} duck={0.4} />
      <Sfx name="whoosh_short" at={0} volume={0.5} />
      <Sfx name="pop" at={hoursAt} volume={0.7} />
      <Sfx name="impact" at={x3At} volume={0.6} />
      <Sfx name="whoosh" at={endAt - 8} volume={0.5} />
      {shots.slice(1).map((s) => (
        <Sequence key={s.from} from={s.from} layout="none">
          <Audio src={staticFile('audio/click.wav')} volume={0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

