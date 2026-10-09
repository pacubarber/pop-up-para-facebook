import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../../brand';
import {clamp, easeInOut, easeOut, Grain, Music, Sfx, Vignette, type VoData} from '../../lib/core';
import {Shot} from '../../lib/kit/Clip';
import {LightLeak, Particles, Progress, Sweep} from '../../lib/kit/Fx';
import {Contours, Icon, PopIcon, RoutePath} from '../../lib/kit/Graphics';
import {Count, fit, Giant, Label, Reveal, Scramble, Slam} from '../../lib/kit/Type';
import {voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/oceano.json';

// "¿Sabías que…?" · El océano — video real (Mixkit) + gráficos limpios.
const vo = voJson as VoData;
const t = voTimeline(vo);
const AQUA = '#4FF0E0';
const MARS = '#FF6A3D';
export const OCEANO_DURATION = t.end + 30;

const C = {
  open: 0,
  mapas: t.w(0, 'mapas') - 2,
  fondo: t.w(0, 'que', 1) - 2,
  ochenta: t.ls(1),
  nunca: t.w(1, 'océano') - 2,
  oxigeno: t.ls(2),
  plancton: t.w(2, 'mar') - 2,
  medusas: t.ls(3),
  quinientos: t.w(3, 'más') - 2,
  antiguas: t.w(3, 'son') - 2,
  cerebro: t.w(3, 'y') - 2,
  tortugas: t.ls(4),
  miles: t.w(4, 'miles') - 3,
  playa: t.w(4, 'volver') - 2,
  delfines: t.ls(5),
  mitad: t.w(5, 'la') - 2,
  cta: t.ls(6),
  end: OCEANO_DURATION,
};

/** Planeta rojo que aparece detrás de "MARTE". */
const Mars: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={to - from} layout="none" name="marte">
    <MarsInner />
  </Sequence>
);
const MarsInner: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 12], [0.4, 1], {...clamp, easing: easeOut});
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 - 300,
        top: 520 - 300,
        width: 600,
        height: 600,
        borderRadius: '50%',
        transform: `scale(${s}) rotate(${frame * 0.6}deg)`,
        background: `radial-gradient(circle at 35% 30%, #FFB27A 0%, ${MARS} 35%, #8A2A12 75%, #3A0F06 100%)`,
        boxShadow: `0 0 120px ${MARS}66, inset -60px -40px 120px rgba(0,0,0,0.55)`,
        opacity: interpolate(frame, [0, 6], [0, 1], clamp),
      }}
    >
      {[
        [30, 40, 60],
        [60, 62, 40],
        [45, 70, 28],
        [70, 30, 22],
      ].map(([x, y, r], i) => (
        <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: '50%', background: 'rgba(60,15,5,0.35)', boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.35)'}} />
      ))}
    </div>
  );
};

/** "Tan pequeño que no lo puedes ver": la palabra se encoge hasta ser un punto que brilla. */
const Shrink: React.FC<{from: number; to: number; text: string; shrinkAt: number}> = ({from, to, text, shrinkAt}) => (
  <Sequence from={from} durationInFrames={to - from} layout="none" name="se encoge">
    <ShrinkInner text={text} shrinkAt={shrinkAt} dur={to - from} />
  </Sequence>
);
const ShrinkInner: React.FC<{text: string; shrinkAt: number; dur: number}> = ({text, shrinkAt, dur}) => {
  const frame = useCurrentFrame();
  const fs = fit(text, 'anton', 980);
  const e = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: easeOut});
  const s = interpolate(frame, [shrinkAt, Math.min(dur - 4, shrinkAt + 24)], [1, 0.012], {...clamp, easing: easeInOut});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 960 - fs / 2, display: 'flex', justifyContent: 'center', transform: `scale(${s * (0.9 + 0.1 * e)})`, opacity: e}}>
      <span style={{fontFamily: font.impact, fontSize: fs, lineHeight: 1, color: AQUA, textShadow: `0 0 ${40 / Math.max(s, 0.05)}px ${AQUA}`, whiteSpace: 'nowrap'}}>{text}</span>
    </div>
  );
};

/** Media pantalla dormida, media despierta (los delfines duermen con medio cerebro). */
const HalfBrain: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={to - from} name="medio cerebro">
    <HalfInner dur={to - from} />
  </Sequence>
);
const HalfInner: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 540 * p, backdropFilter: 'grayscale(1) brightness(0.35)', WebkitBackdropFilter: 'grayscale(1) brightness(0.35)'}} />
      <div style={{position: 'absolute', left: 538, top: 0, bottom: 0, width: 4, background: '#fff', transform: `scaleY(${p})`, boxShadow: '0 0 20px #fff'}} />
      <div style={{position: 'absolute', left: 0, width: 540, top: 1130, textAlign: 'center', opacity: p}}>
        <Icon name="moon" size={110} color="#fff" stroke={1.6} />
        <div style={{fontFamily: font.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.16em', color: '#fff', marginTop: 10}}>DUERME</div>
      </div>
      <div style={{position: 'absolute', left: 540, width: 540, top: 1130, textAlign: 'center', opacity: interpolate(frame, [6, 14], [0, 1], clamp)}}>
        <Icon name="sun" size={110} color={AQUA} stroke={1.6} />
        <div style={{fontFamily: font.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.16em', color: AQUA, marginTop: 10}}>DESPIERTA</div>
      </div>
    </AbsoluteFill>
  );
};

const Dato: React.FC<{from: number; to: number; n: number}> = ({from, to, n}) => (
  <Label from={from} to={to} text={`DATO 0${n} / 06`} y={300} align="center" size={42} dot={AQUA} />
);

export const Oceano: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Shot id={1572} from={C.open} to={C.mapas} zoom={[1.4, 1.15]} grade="teal" enter="blur" />
      <Shot id={35659} from={C.mapas} to={C.fondo} zoom={[1.1, 1.2]} grade="dim" enter="zoom" />
      <Shot id={12816} from={C.fondo} to={C.ochenta} zoom={[1.0, 1.3]} grade="teal" enter="whipD" />
      <Shot id={4116} from={C.ochenta} to={C.nunca} zoom={[1.1, 1.2]} grade="teal" enter="punch" />
      <Shot id={12816} from={C.nunca} to={C.oxigeno} trim={2.5} zoom={[1.2, 1.4]} grade="dim" enter="blur" />
      <Shot id={4466} from={C.oxigeno} to={C.plancton} zoom={[1.1, 1.25]} rot={[0, 6]} grade="teal" enter="whipU" />
      <Shot id={178} from={C.plancton} to={C.medusas} zoom={[1.1, 1.2]} grade="dim" enter="blur" />
      <Shot id={25351} from={C.medusas} to={C.quinientos} zoom={[1.05, 1.2]} grade="cool" enter="iris" />
      <Shot id={25352} from={C.quinientos} to={C.antiguas} zoom={[1.1, 1.25]} grade="cool" enter="whipL" />
      <Shot id={25354} from={C.antiguas} to={C.cerebro} zoom={[1.1, 1.25]} grade="cool" enter="punch" />
      <Shot id={17858} from={C.cerebro} to={C.tortugas} zoom={[1.2, 1.35]} grade="teal" enter="punch" />
      <Shot id={27693} from={C.tortugas} to={C.miles} zoom={[1.05, 1.2]} grade="teal" enter="wipe" />
      <Shot id={25916} from={C.miles} to={C.playa} zoom={[1.1, 1.25]} grade="teal" enter="whipL" />
      <Shot id={32551} from={C.playa} to={C.delfines} zoom={[1.1, 1.25]} grade="warm" enter="punch" />
      <Shot id={11032} from={C.delfines} to={C.mitad} zoom={[1.1, 1.3]} grade="teal" enter="whipD" />
      <Shot id={4133} from={C.mitad} to={C.cta} zoom={[1.05, 1.18]} grade="teal" enter="punch" />
      <Shot id={44868} from={C.cta} to={C.end} zoom={[1.1, 1.25]} grade="teal" enter="iris" />

      {/* ---------- 01 · mapas de Marte ---------- */}
      <Dato from={C.open + 4} to={C.ochenta} n={1} />
      <Giant from={0} to={C.mapas} text="¿SABÍAS" y={760} width={900} enter="track" shadow />
      <Giant from={8} to={C.mapas} text="QUE…?" y={1010} width={560} enter="rise" color={AQUA} shadow />
      <Contours from={C.mapas} to={C.fondo} />
      <Scramble from={C.mapas} to={C.fondo} text="MAPAS DE" y={330 + 70} size={50} />
      <Mars from={t.w(0, 'marte') - 4} to={C.fondo} />
      <Giant from={t.w(0, 'marte') - 2} to={C.fondo} text="MARTE" y={1120} width={760} enter="scale" color="#fff" shadow />
      <Reveal from={C.fondo} to={C.ochenta} lines={['que del fondo', 'del océano.']} y={1120} size={120} face="serif" stagger={5} exit="fade" />

      {/* ---------- 02 · 80% sin explorar ---------- */}
      <Dato from={C.ochenta} to={C.oxigeno} n={2} />
      <Count from={C.ochenta} to={C.nunca} value={[0, 80]} suffix="%" roll={t.w(1, 'ciento') - C.ochenta} y={640} size={430} color="#fff" />
      <Label from={t.w(1, 'ciento')} to={C.nunca} text="DEL OCÉANO" y={1120} align="center" size={52} />
      <Reveal from={C.nunca} to={C.oxigeno} lines={['NUNCA HA SIDO', 'EXPLORADO']} y={820} size={150} face="anton" stagger={4} color={['#fff', AQUA]} />

      {/* ---------- 03 · oxígeno y plancton ---------- */}
      <Dato from={C.oxigeno} to={C.medusas} n={3} />
      <Count from={C.oxigeno} to={C.plancton} value={[0, 50]} suffix="%" roll={t.w(2, 'oxígeno') - C.oxigeno + 4} y={600} size={430} />
      <Reveal from={t.w(2, 'oxígeno') - 2} to={C.plancton} lines={['DEL OXÍGENO', 'QUE RESPIRAS']} y={1100} size={110} face="anton" stagger={4} color={['#fff', AQUA]} />
      <Sequence from={C.plancton} durationInFrames={C.medusas - C.plancton} name="plancton">
        <Particles kind="plankton" count={70} color="120,255,235" seed="pl" />
      </Sequence>
      <Reveal from={C.plancton} to={t.w(2, 'plancton') - 2} lines={['viene del mar.']} y={1150} size={110} face="serif" exit="up" />
      <Shrink from={t.w(2, 'plancton') - 3} to={C.medusas} text="PLANCTON" shrinkAt={t.w(2, 'pequeño') - t.w(2, 'plancton') + 3} />

      {/* ---------- 04 · medusas ---------- */}
      <Dato from={C.medusas} to={C.tortugas} n={4} />
      <Giant from={t.w(3, 'medusas') - 3} to={C.quinientos} text="MEDUSAS" y={820} width={960} enter="rise" shadow />
      <Count from={C.quinientos} to={C.antiguas} value={[0, 500000000]} roll={t.w(3, 'años') - C.quinientos} y={760} size={150} face="anton" />
      <Label from={t.w(3, 'años') - 2} to={C.antiguas} text="AÑOS EN LA TIERRA" y={960} align="center" size={50} dot={AQUA} />
      <Reveal from={C.antiguas} to={C.cerebro} lines={['MÁS ANTIGUAS', 'QUE LOS', 'DINOSAURIOS']} y={700} size={140} face="anton" stagger={4} color={['#fff', '#fff', AQUA]} />
      <Slam from={C.cerebro} to={C.tortugas} y={820} size={190} face="anton" words={[{text: 'SIN', at: t.w(3, 'no') - C.cerebro}, {text: 'CEREBRO.', at: t.w(3, 'cerebro') - C.cerebro - 2, br: true, color: AQUA}]} />

      {/* ---------- 05 · tortugas ---------- */}
      <Dato from={C.tortugas} to={C.delfines} n={5} />
      <Reveal from={t.w(4, 'tortugas') - 3} to={C.miles} lines={['TORTUGAS', 'MARINAS']} y={760} size={170} face="anton" stagger={4} />
      <RoutePath from={C.miles} to={C.playa} d="M -40 1500 C 200 1300, 300 900, 560 820 S 950 560, 1120 300" />
      <Giant from={C.miles} to={C.playa} text="MILES" y={760} width={760} enter="scale" shadow />
      <Label from={t.w(4, 'kilómetros') - 3} to={C.playa} text="DE KILÓMETROS" y={1000} align="center" size={54} dot={AQUA} />
      <PopIcon from={t.w(4, 'playa') - 4} to={C.delfines} name="pin" x={540} y={600} size={190} color="#fff" fillAt={4} fillColor="#FF5A5A" />
      <Reveal from={t.w(4, 'misma') - 3} to={C.delfines} lines={['LA MISMA PLAYA', 'DONDE NACIERON']} y={860} size={110} face="anton" stagger={4} color={['#fff', AQUA]} exit="fade" />

      {/* ---------- 06 · delfines ---------- */}
      <Dato from={C.delfines} to={C.cta} n={6} />
      <Giant from={t.w(5, 'delfines') - 3} to={C.mitad} text="DELFINES" y={720} width={940} enter="track" shadow />
      <Reveal from={t.w(5, 'duermen') - 2} to={C.mitad} lines={['duermen con', 'medio cerebro.']} y={980} size={110} face="serif" stagger={6} exit="up" />
      <HalfBrain from={C.mitad} to={C.cta} />

      {/* ---------- cierre ---------- */}
      <Reveal from={C.cta} to={C.end} lines={['¿CUÁL', 'NO SABÍAS?']} y={700} size={190} face="anton" stagger={4} color={['#fff', AQUA]} exit="fade" />
      <PopIcon from={t.w(6, 'te') - 2} to={C.end} name="comment" x={540} y={1240} size={150} fillAt={6} fillColor={AQUA} color="#fff" />
      <Label from={t.w(6, 'te')} to={C.end} text="TE LEO EN COMENTARIOS" y={1360} align="center" size={44} />

      <Sweep at={C.ochenta - 3} color="180,255,250" />
      <Sweep at={C.medusas - 3} color="180,255,250" />
      <Sweep at={C.delfines - 3} color="180,255,250" />
      <LightLeak at={[C.oxigeno - 4, C.tortugas - 4]} colors={['120,255,235', '80,160,255']} strength={0.55} />
      <Vignette strength={0.42} />
      <Grain opacity={0.05} />
      <Progress total={OCEANO_DURATION} color={AQUA} />

      <Audio src={staticFile('voz/oceano.wav')} />
      <Music name="curioso_104" volume={0.42} duration={OCEANO_DURATION} vo={vo} duck={0.6} fadeIn={4} fadeOut={24} />
      <Sfx name="swish" at={2} volume={0.4} />
      <Sfx name="whoosh_short" at={C.mapas - 4} volume={0.35} />
      <Sfx name="glitch" at={C.mapas} volume={0.25} />
      <Sfx name="impact" at={t.w(0, 'marte') - 2} volume={0.3} />
      <Sfx name="whoosh" at={C.ochenta - 8} volume={0.4} />
      <Sfx name="click" at={t.w(1, 'ciento')} volume={0.5} />
      <Sfx name="whoosh" at={C.oxigeno - 8} volume={0.4} />
      <Sfx name="riser" at={t.w(2, 'plancton')} volume={0.2} />
      <Sfx name="pop" at={t.w(2, 'ver') - 2} volume={0.45} />
      <Sfx name="whoosh" at={C.medusas - 8} volume={0.4} />
      <Sfx name="click" at={t.w(3, 'años')} volume={0.5} />
      <Sfx name="swish" at={t.w(3, 'cerebro') - 2} volume={0.45} />
      <Sfx name="whoosh" at={C.tortugas - 8} volume={0.4} />
      <Sfx name="pop" at={t.w(4, 'playa')} volume={0.45} />
      <Sfx name="whoosh" at={C.delfines - 8} volume={0.4} />
      <Sfx name="whoosh_short" at={C.mitad} volume={0.4} />
      <Sfx name="ding" at={C.cta + 4} volume={0.3} />
      <Sfx name="pop" at={t.w(6, 'te') + 4} volume={0.45} />
    </AbsoluteFill>
  );
};
