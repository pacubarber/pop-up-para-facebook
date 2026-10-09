import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Flash, Grain, Music, Sfx, Vignette, type VoData} from '../../lib/core';
import {Shot} from '../../lib/kit/Clip';
import {LightLeak, Particles, Progress, Sweep, VideoText} from '../../lib/kit/Fx';
import {MexicoMap, PopIcon} from '../../lib/kit/Graphics';
import {Count, Giant, Label, Marquee, Reveal, Scramble, Slam} from '../../lib/kit/Type';
import {voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/mexico.json';

// Guía de destino · "5 lugares de México" — video real (Mixkit) + mapa animado.
const vo = voJson as VoData;
const t = voTimeline(vo);
const ACC = '#FF5A36';
export const MEXICO_DURATION = t.end + 40;

const C = {
  intro: 0,
  map: t.w(0, 'méxico') - 2,
  vez: t.w(0, 'al') - 2,
  chichen: t.ls(1),
  escalones: t.w(1, 'tiene') - 4,
  cenotes: t.ls(2),
  agua: t.w(2, 'agua') - 3,
  sanmiguel: t.ls(3),
  calles: t.w(3, 'calles') - 2,
  parroquia: t.w(3, 'parroquia') - 3,
  tequila: t.ls(4),
  agave: t.w(4, 'campos') - 2,
  vista: t.w(4, 'hasta') - 2,
  cdmx: t.ls(5),
  lucha: t.w(5, 'lucha') - 2,
  tacos: t.w(5, 'tacos') - 2,
  arte: t.w(5, 'arte') - 2,
  cta: t.ls(6),
  end: MEXICO_DURATION,
};

const ALL_PINS = [
  {key: 'chichen' as const, label: 'CHICHÉN ITZÁ'},
  {key: 'cenotes' as const, label: ''},
  {key: 'sanmiguel' as const, label: 'SAN MIGUEL'},
  {key: 'tequila' as const, label: 'TEQUILA'},
  {key: 'cdmx' as const, label: 'CDMX'},
];
const pinsUpTo = (n: number) => ALL_PINS.slice(0, n).map((p) => ({key: p.key, at: 0}));

/** Etiqueta de sección: número y región, abajo al centro (lejos de los títulos gigantes). */
const SectionTag: React.FC<{from: number; to: number; n: string; region: string}> = ({from, to, n, region}) => (
  <Label from={from + 2} to={to} text={`${n} · ${region}`} y={1430} align="center" size={46} dot={ACC} />
);

export const Mexico: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* intro */}
      <Shot id={41541} from={C.intro} to={C.map} zoom={[1.35, 1.1]} grade="punch" enter="blur" />
      <Shot id={42041} from={C.map} to={C.vez} zoom={[1.1, 1.2]} grade="dim" enter="zoom" />
      <Shot id={2387} from={C.vez} to={C.chichen} zoom={[1.1, 1.2]} grade="punch" enter="whipL" />
      {/* 1 · Chichén Itzá (el nombre queda DETRÁS de la pirámide) */}
      <Shot
        id={4106}
        from={C.chichen}
        to={C.escalones}
        zoom={[1.0, 1.12]}
        grade="punch"
        enter="whipU"
        cutout
        behind={
          <>
            <Giant from={t.w(1, 'chichén') - C.chichen} to={C.escalones - C.chichen} text="CHICHÉN" y={340} width={960} enter="rise" />
            <Giant from={t.w(1, 'itzá') - C.chichen - 2} to={C.escalones - C.chichen} text="ITZÁ" y={580} width={680} enter="rise" color={ACC} />
          </>
        }
      />
      <Shot id={4107} from={C.escalones} to={C.cenotes} zoom={[1.05, 1.2]} grade="warm" enter="punch" />
      {/* 2 · Cenotes */}
      <Shot id={4375} from={C.cenotes} to={C.agua} zoom={[1.1, 1.25]} y={[0, -40]} grade="teal" enter="iris" />
      <Shot id={43088} from={C.agua} to={C.sanmiguel} zoom={[1.05, 1.15]} grade="teal" enter="blur" />
      {/* 3 · San Miguel de Allende (el nombre detrás de la parroquia) */}
      <Shot
        id={4392}
        from={C.sanmiguel}
        to={C.calles}
        zoom={[1.0, 1.1]}
        grade="night"
        enter="whipU"
        cutout
        behind={<Giant from={t.w(3, 'san') - C.sanmiguel - 2} to={C.calles - C.sanmiguel} text="SAN MIGUEL" y={330} width={1000} enter="track" color="#fff" />}
      />
      <Shot id={3487} from={C.calles} to={C.parroquia} zoom={[1.15, 1.3]} grade="warm" enter="whipL" />
      <Shot id={4392} from={C.parroquia} to={C.tequila} trim={3} zoom={[1.5, 1.7]} y={[180, 260]} grade="night" enter="punch" />
      {/* 4 · Tequila */}
      <Shot id={44276} from={C.tequila} to={C.agave} zoom={[1.1, 1.22]} grade="warm" enter="wipe" />
      <Shot
        id={42390}
        from={C.agave}
        to={C.vista}
        zoom={[1.0, 1.08]}
        grade="warm"
        enter="punch"
        cutout
        behind={<Marquee from={0} to={C.vista - C.agave} text="AGAVE AZUL" y={760} size={260} speed={16} angle={-7} color="#fff" />}
      />
      <Shot id={41392} from={C.vista} to={C.cdmx} zoom={[1.1, 1.35]} grade="warm" enter="blur" />
      {/* 5 · CDMX */}
      <VideoText from={C.cdmx} to={C.lucha} id={2074} text="CDMX" width={980} expand={C.lucha - C.cdmx - 13} origin="50% 52%" />
      <Shot id={4288} from={C.lucha} to={C.tacos} zoom={[1.2, 1.3]} grade="punch" enter="punch" />
      <Shot id={3088} from={C.tacos} to={C.arte} zoom={[1.2, 1.35]} grade="warm" enter="whipL" />
      <Shot id={3499} from={C.arte} to={C.cta} zoom={[1.15, 1.3]} grade="punch" enter="whipL" />
      {/* cierre: el mapa con la ruta completa */}
      <Shot id={42041} from={C.cta} to={C.end} trim={1} zoom={[1.2, 1.35]} grade="dim" enter="blur" />

      {/* ---------- gráficos y textos ---------- */}
      <Giant from={0} to={C.map} text="5" y={760} width={440} enter="scale" exit="scale" shadow />
      <Reveal from={t.w(0, 'lugares') - 2} to={C.map} lines={['LUGARES']} y={1080} size={120} face="anton" exit="up" />
      <MexicoMap from={C.map} to={C.vez} pins={ALL_PINS.map((p, i) => ({key: p.key, at: 6 + i * 4, label: p.label}))} y={620} />
      <Reveal from={C.map + 4} to={C.vez} lines={['QUE TIENES', 'QUE VER']} y={1160} size={110} face="anton" stagger={4} color={['#fff', ACC]} />
      <Reveal from={C.vez} to={C.chichen} lines={['al menos', 'una vez.']} y={1180} size={130} face="serif" stagger={5} exit="fade" />

      <SectionTag from={C.chichen} to={C.escalones} n="01" region="YUCATÁN" />
      <Scramble from={C.chichen + 10} to={C.escalones} text="20.68°N  88.57°O" y={1510} size={34} />
      <Count from={C.escalones} to={C.cenotes} value={[0, 365]} roll={t.w(1, 'escalones') - C.escalones} y={700} size={400} />
      <Label from={t.w(1, 'escalones') - 2} to={C.cenotes} text="ESCALONES · 1 POR DÍA" y={1130} align="center" size={46} dot={ACC} />

      <SectionTag from={C.cenotes} to={C.agua} n="02" region="YUCATÁN" />
      <Giant from={t.w(2, 'cenotes') - 3} to={C.agua} text="CENOTES" y={520} width={900} enter="rise" />
      <Sequence from={C.agua} durationInFrames={C.sanmiguel - C.agua} name="burbujas">
        <Particles kind="bubbles" count={26} seed="cen" />
      </Sequence>
      <Reveal from={C.agua} to={C.sanmiguel} lines={['agua turquesa', 'bajo la selva.']} y={1140} size={110} face="serif" stagger={6} exit="fade" />

      <SectionTag from={C.sanmiguel} to={C.calles} n="03" region="GUANAJUATO" />
      <Reveal from={C.calles} to={C.parroquia} lines={['CALLES', 'DE PIEDRA']} y={1080} size={150} face="anton" stagger={3} />
      <Reveal from={C.parroquia + 2} to={C.tequila} lines={['una parroquia', 'de cuento.']} y={1200} size={110} face="serif" stagger={6} exit="fade" />

      <SectionTag from={C.tequila} to={C.agave} n="04" region="JALISCO" />
      <Giant from={t.w(4, 'tequila') - 3} to={C.agave} text="TEQUILA" y={560} width={960} enter="track" shadow />
      <Reveal from={C.vista} to={C.cdmx} lines={['hasta donde', 'alcanza la vista.']} y={1150} size={100} face="serif" stagger={6} exit="fade" />

      <SectionTag from={C.cdmx} to={C.lucha} n="05" region="CIUDAD DE MÉXICO" />
      <Slam from={C.lucha} to={C.tacos} y={1180} size={170} face="anton" words={[{text: 'LUCHA', at: 1}, {text: 'LIBRE', at: 6, color: '#FFD23F'}]} />
      <Slam from={C.tacos} to={C.arte} y={1100} size={250} face="anton" words={[{text: 'TACOS', at: 1}]} />
      <Label from={C.tacos + 6} to={C.arte} text="03:00 AM" y={1390} align="center" size={50} dot={ACC} />
      <Slam from={C.arte} to={C.cta} y={1100} size={300} face="anton" words={[{text: 'ARTE', at: 1, color: '#FFD23F'}]} />

      {/* mini-mapa con el lugar actual (en la segunda toma de cada lugar, para no tapar el título) */}
      <MexicoMap from={C.escalones} to={C.cenotes} pins={pinsUpTo(1)} focus="chichen" mini />
      <MexicoMap from={C.agua} to={C.sanmiguel} pins={pinsUpTo(2)} focus="cenotes" mini />
      <MexicoMap from={C.calles} to={C.tequila} pins={pinsUpTo(3)} focus="sanmiguel" mini />
      <MexicoMap from={C.agave} to={C.cdmx} pins={pinsUpTo(4)} focus="tequila" mini />
      <MexicoMap from={C.lucha} to={C.cta} pins={pinsUpTo(5)} focus="cdmx" mini />

      <MexicoMap from={C.cta} to={C.end} pins={ALL_PINS.map((p, i) => ({key: p.key, at: 4 + i * 3, label: p.label}))} route y={520} />
      <Reveal from={C.cta + 4} to={C.end} lines={['¿CUÁL', 'VISITARÍAS', 'PRIMERO?']} y={1080} size={120} face="anton" stagger={3} color={['#fff', '#fff', ACC]} exit="fade" />
      <PopIcon from={t.w(6, 'guárdalo') - 2} to={C.end} name="bookmark" x={540} y={1600} size={130} fillAt={6} fillColor={ACC} />

      <Sweep at={C.chichen - 4} />
      <Sweep at={C.tequila - 4} color="255,220,160" />
      <LightLeak at={[C.vez - 6, C.tequila - 4, C.agave, C.cta - 6]} colors={['255,170,80', '255,90,60']} strength={0.7} />
      <Flash at={C.cdmx} max={0.4} />
      <Vignette strength={0.38} />
      <Grain opacity={0.05} />
      <Progress total={MEXICO_DURATION} color={ACC} />

      <Audio src={staticFile('voz/mexico.wav')} />
      <Music name="viaje_116" volume={0.4} duration={MEXICO_DURATION} vo={vo} duck={0.6} startFrom={0} fadeIn={4} fadeOut={24} />
      <Sfx name="swish" at={2} volume={0.45} />
      <Sfx name="whoosh_short" at={C.map - 4} volume={0.4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} name="pop" at={C.map + 6 + i * 4} volume={0.35} />
      ))}
      <Sfx name="whoosh" at={C.chichen - 8} volume={0.45} />
      <Sfx name="click" at={t.w(1, 'escalones')} volume={0.5} />
      <Sfx name="whoosh_short" at={C.cenotes - 4} volume={0.4} />
      <Sfx name="whoosh" at={C.sanmiguel - 8} volume={0.45} />
      <Sfx name="whoosh_short" at={C.calles - 4} volume={0.35} />
      <Sfx name="whoosh" at={C.tequila - 8} volume={0.45} />
      <Sfx name="whoosh_short" at={C.agave - 4} volume={0.35} />
      <Sfx name="impact" at={C.cdmx} volume={0.35} />
      <Sfx name="swish" at={C.lucha} volume={0.5} />
      <Sfx name="swish" at={C.tacos} volume={0.5} />
      <Sfx name="swish" at={C.arte} volume={0.5} />
      <Sfx name="whoosh" at={C.cta - 8} volume={0.4} />
      <Sfx name="ding" at={t.w(6, 'guárdalo') + 4} volume={0.35} />
    </AbsoluteFill>
  );
};
