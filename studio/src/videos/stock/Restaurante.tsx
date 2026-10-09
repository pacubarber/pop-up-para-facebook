import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Flash, Grain, Music, Sfx, Vignette, type VoData} from '../../lib/core';
import {Shot, Split} from '../../lib/kit/Clip';
import {LightLeak, Progress, Shake, Sweep, VideoText} from '../../lib/kit/Fx';
import {ChartDown, Icon, PopIcon, RecUI, Stars} from '../../lib/kit/Graphics';
import {Count, Giant, Label, Marquee, Reveal, Scramble, Slam, Stack} from '../../lib/kit/Type';
import {voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/restaurante.json';

// "3 errores que te hacen perder clientes" · nicho restaurantes — video real (Mixkit).
const vo = voJson as VoData;
const t = voTimeline(vo);
const ACC = '#FF4D2E';
const OK = '#3DDC84';
export const RESTAURANTE_DURATION = t.end + 30;

const C = {
  open: 0,
  comida: t.w(0, 'y') - 2,
  e1: t.ls(1),
  redes: t.w(1, 'redes') - 2,
  gente: t.ls(2),
  casa: t.w(2, 'antes') - 2,
  cocina: t.ls(3),
  fuego: t.w(3, 'fuego') - 2,
  queso: t.w(3, 'queso') - 2,
  plancha: t.w(3, 'sonido') - 2,
  e2: t.ls(4),
  cliente: t.w(4, 'tu') - 2,
  menu: t.ls(5),
  destaca: t.w(5, 'destaca') - 3,
  e3: t.ls(6),
  pides: t.w(6, 'no') - 2,
  resena: t.ls(7),
  foto: t.w(7, 'ni', 1) - 2,
  etiqueta: t.w(7, 'ni', 2) - 2,
  arregla: t.ls(8),
  mesas: t.w(8, 'y') - 2,
  guarda: t.ls(9),
  final: t.w(9, 'tu') - 2,
  end: RESTAURANTE_DURATION,
};

/** Rótulo de "ERROR #n": número gigante con video dentro que se abre hacia la toma. */
const ErrorTitle: React.FC<{from: number; to: number; n: string; clip: number}> = ({from, to, n, clip}) => (
  <>
    <VideoText from={from} to={to} id={clip} text={n} width={760} y={900} expand={to - from - 12} origin="50% 50%" />
    <Label from={from + 3} to={to - 10} text={`ERROR NÚMERO ${n === '01' ? 'UNO' : n === '02' ? 'DOS' : 'TRES'}`} y={1330} align="center" size={48} dot={ACC} />
  </>
);

const DISHES = ['PASTA', 'SOPA DEL DÍA', 'TACOS', 'RISOTTO', 'ALITAS', 'CEVICHE', 'LASAÑA', 'BURRITO', 'SUSHI', 'CREPAS', 'FAJITAS', 'NACHOS'];

export const Restaurante: React.FC = () => {
  const hits = [C.e1, C.e2, C.e3, t.w(5, 'confunde'), t.w(8, 'llenan')];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Shake hits={hits} amp={10}>
        {/* gancho: restaurante vacío */}
        <Shot id={29050} from={C.open} to={C.comida} zoom={[1.0, 1.25]} grade="cool" enter="blur" />
        <Shot id={42484} from={C.comida} to={C.e1} zoom={[1.15, 1.35]} rot={[0, 4]} grade="warm" enter="whipL" />
        {/* error 1: redes abandonadas */}
        <ErrorTitle from={C.e1} to={C.redes} n="01" clip={13168} />
        <Shot id={13168} from={C.redes} to={C.gente} trim={1.2} zoom={[1.0, 1.12]} grade="dim" />
        <Shot
          id={41175}
          from={C.gente}
          to={C.casa}
          zoom={[1.0, 1.1]}
          grade="punch"
          enter="punch"
          cutout
          behind={
            <>
              <Giant from={t.w(2, 'dónde') - C.gente - 3} to={C.casa - C.gente} text="¿DÓNDE" y={330} width={820} enter="rise" color={ACC} />
              <Giant from={t.w(2, 'comer') - C.gente - 3} to={C.casa - C.gente} text="COMEMOS?" y={560} width={980} enter="rise" />
            </>
          }
        />
        <Shot id={4853} from={C.casa} to={C.cocina} zoom={[1.1, 1.2]} grade="warm" enter="whipL" />
        {/* sube video de tu cocina: ráfaga de planos con interfaz de cámara */}
        <Shot id={15875} from={C.cocina} to={C.fuego} zoom={[1.05, 1.18]} grade="warm" enter="punch" />
        <Shot id={4118} from={C.fuego} to={C.queso} zoom={[1.2, 1.3]} grade="warm" enter="zoom" />
        <Shot id={42478} from={C.queso} to={C.plancha} zoom={[1.2, 1.32]} grade="warm" enter="punch" />
        <Shot id={43057} from={C.plancha} to={C.e2} zoom={[1.15, 1.3]} grade="warm" enter="punch" />
        {/* error 2: no saben qué pedir */}
        <ErrorTitle from={C.e2} to={C.cliente} n="02" clip={13070} />
        <Shot id={13070} from={C.cliente} to={C.menu} trim={1} zoom={[1.0, 1.1]} grade="none" />
        <Shot id={24405} from={C.menu} to={C.destaca} zoom={[1.1, 1.2]} grade="dim" enter="blur" />
        <Favoritos from={C.destaca} to={C.e3} />
        {/* error 3: no pides nada */}
        <ErrorTitle from={C.e3} to={C.pides} n="03" clip={44000} />
        <Shot
          id={44000}
          from={C.pides}
          to={C.resena}
          trim={0.6}
          zoom={[1.0, 1.08]}
          grade="warm"
          cutout
          behind={<Giant from={t.w(6, 'feliz') - C.pides - 3} to={C.resena - C.pides} text="FELIZ" y={460} width={900} enter="scale" color="#FFD23F" />}
        />
        <Shot id={4853} from={C.resena} to={C.foto} trim={1.5} zoom={[1.2, 1.3]} grade="warm" enter="whipL" />
        <Shot id={42313} from={C.foto} to={C.arregla} zoom={[1.0, 1.12]} grade="punch" enter="punch" />
        {/* arréglalos */}
        <Shot id={44019} from={C.arregla} to={C.mesas} zoom={[1.05, 1.15]} grade="warm" enter="wipe" />
        <Shot id={44008} from={C.mesas} to={C.guarda} zoom={[1.1, 1.22]} grade="warm" enter="punch" />
        <Shot id={42487} from={C.guarda} to={C.final} zoom={[1.15, 1.3]} grade="warm" enter="whipU" />
        <Shot id={44014} from={C.final} to={C.end} zoom={[1.05, 1.18]} grade="warm" enter="punch" />

        {/* ---------- textos y gráficos ---------- */}
        <Reveal from={2} to={t.w(0, 'perdiendo') - 2} lines={['TU', 'RESTAURANTE']} y={430} size={150} face="anton" stagger={3} exit="up" />
        <ChartDown from={t.w(0, 'perdiendo') - 4} to={C.comida} y={760} label="CLIENTES" />
        <Reveal from={t.w(0, 'perdiendo') - 2} to={C.comida} lines={['ESTÁ PERDIENDO', 'CLIENTES']} y={420} size={120} face="anton" stagger={3} color={['#fff', ACC]} exit="up" />
        <Reveal from={C.comida + 2} to={C.e1} lines={['y no es por', 'la comida.']} y={1150} size={120} face="serif" stagger={5} exit="fade" />

        <Reveal from={C.redes + 2} to={C.gente} lines={['TUS REDES', 'PARECEN', 'ABANDONADAS']} y={560} size={140} face="anton" stagger={4} color={['#fff', '#fff', ACC]} />
        <Scramble from={t.w(1, 'abandonadas')} to={C.gente} text="ÚLTIMO POST · HACE 38 SEMANAS" y={1120} size={36} bg="rgba(0,0,0,0.6)" />
        <Reveal from={t.w(2, 'celular') - 3} to={C.casa} lines={['DESDE EL CELULAR']} y={1420} size={96} face="anton" exit="up" />
        <Reveal from={C.casa + 2} to={C.cocina} lines={['antes de', 'salir de casa.']} y={1120} size={120} face="serif" stagger={5} exit="fade" />

        <RecUI from={C.cocina} to={C.e2} />
        <Reveal from={C.cocina + 2} to={C.fuego} lines={['SUBE VIDEO', 'DE TU COCINA']} y={1150} size={130} face="anton" stagger={3} />
        <Slam from={C.fuego} to={C.queso} y={1150} size={210} face="anton" words={[{text: 'EL FUEGO', at: 1, color: '#FFB020'}]} />
        <Slam from={C.queso} to={C.plancha} y={1150} size={210} face="anton" words={[{text: 'EL QUESO', at: 1, color: '#FFE066'}]} />
        <Slam from={C.plancha} to={C.e2} y={1080} size={170} face="anton" words={[{text: 'EL SONIDO', at: 1}, {text: 'DE LA PLANCHA', at: t.w(3, 'plancha') - C.plancha - 2, br: true, size: 120, color: ACC}]} />

        <Slam from={t.w(4, 'qué') - 3} to={C.menu} y={1080} size={220} face="anton" words={[{text: '¿QUÉ', at: 0}, {text: 'PIDO?', at: 6, color: ACC}]} />
        <Marquee from={C.menu} to={C.destaca} text={DISHES.slice(0, 6).join(' · ')} y={420} size={110} speed={18} angle={-6} color="rgba(255,255,255,0.85)" />
        <Marquee from={C.menu} to={C.destaca} text={DISHES.slice(6).join(' · ')} y={1500} size={110} speed={-15} angle={-6} outline={3} color="#fff" />
        <Count from={C.menu} to={C.destaca} value={[1, 40]} roll={t.w(5, 'cuarenta') - C.menu + 6} y={700} size={460} />
        <Label from={t.w(5, 'platos') - 2} to={C.destaca} text="PLATOS = CONFUSIÓN" y={1180} align="center" size={50} dot={ACC} />
        <Reveal from={t.w(5, 'tres') - 3} to={C.e3} lines={['DESTACA TUS', '3 FAVORITOS']} y={1460} size={110} face="anton" stagger={3} color={['#fff', '#FFD23F']} />

        <Reveal from={C.pides + 2} to={C.resena} lines={['NO LE PIDES', 'NADA AL CLIENTE']} y={1180} size={110} face="anton" stagger={3} />
        <Stars from={t.w(7, 'reseña') - 4} to={C.foto} y={820} size={150} />
        <Reveal from={t.w(7, 'reseña') - 4} to={C.foto} lines={['NI UNA RESEÑA']} y={1100} size={120} face="anton" />
        <PopIcon from={t.w(7, 'foto') - 3} to={C.etiqueta} name="camera" x={540} y={820} size={220} />
        <Flash at={t.w(7, 'foto') + 4} max={0.7} dur={5} />
        <Reveal from={t.w(7, 'foto') - 3} to={C.etiqueta} lines={['NI UNA FOTO']} y={1100} size={120} face="anton" />
        <PopIcon from={C.etiqueta} to={C.arregla} name="at" x={540} y={760} size={200} />
        <Scramble from={C.etiqueta + 4} to={C.arregla} text="@TURESTAURANTE" y={1000} size={58} face="mono" speed={2} bg={ACC} />

        <Stack
          from={C.arregla}
          to={C.mesas}
          y={760}
          size={120}
          align="left"
          x={110}
          words={[
            {text: '✓ REDES VIVAS', at: 2, color: OK},
            {text: '✓ 3 FAVORITOS', at: 9, color: OK},
            {text: '✓ PIDE RESEÑAS', at: 16, color: OK},
          ]}
        />
        <Reveal from={C.mesas + 2} to={C.guarda} lines={['Y LAS MESAS', 'SE LLENAN SOLAS']} y={1200} size={120} face="anton" stagger={4} color={['#fff', '#FFD23F']} />
        <PopIcon from={C.guarda} to={C.end} name="bookmark" x={540} y={700} size={240} fillAt={8} fillColor={ACC} />
        <Reveal from={C.guarda + 2} to={C.end} lines={['GUARDA', 'ESTE VIDEO']} y={1000} size={150} face="anton" stagger={4} exit="fade" />
        <Reveal from={t.w(9, 'agradecer') - 6} to={C.end} lines={['tu restaurante', 'te lo va a agradecer.']} y={1380} size={80} face="serif" stagger={4} exit="fade" />
      </Shake>

      <Sweep at={C.e1 - 3} />
      <Sweep at={C.e2 - 3} />
      <Sweep at={C.e3 - 3} />
      <LightLeak at={[C.cocina - 6, C.arregla - 6]} strength={0.7} />
      <Vignette strength={0.4} />
      <Grain opacity={0.05} />
      <Progress total={RESTAURANTE_DURATION} color={ACC} />

      <Audio src={staticFile('voz/restaurante.wav')} />
      <Music name="resto_124" volume={0.38} duration={RESTAURANTE_DURATION} vo={vo} duck={0.62} fadeIn={4} fadeOut={24} />
      <Sfx name="whoosh_short" at={C.comida - 4} volume={0.35} />
      <Sfx name="impact" at={C.e1} volume={0.35} />
      <Sfx name="riser" at={C.redes - 40} volume={0.2} />
      <Sfx name="glitch" at={t.w(1, 'abandonadas')} volume={0.35} />
      <Sfx name="whoosh_short" at={C.casa - 4} volume={0.35} />
      <Sfx name="click" at={C.cocina + 2} volume={0.6} />
      <Sfx name="swish" at={C.fuego} volume={0.45} />
      <Sfx name="sizzle" at={C.fuego} volume={0.35} />
      <Sfx name="swish" at={C.queso} volume={0.45} />
      <Sfx name="sizzle" at={C.plancha} volume={0.55} />
      <Sfx name="impact" at={C.e2} volume={0.35} />
      <Sfx name="glitch" at={t.w(5, 'confunde')} volume={0.4} />
      <Sfx name="whoosh" at={C.destaca - 6} volume={0.4} />
      <Sfx name="impact" at={C.e3} volume={0.35} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} name="pop" at={t.w(7, 'reseña') - 4 + i * 3} volume={0.3} />
      ))}
      <Sfx name="click" at={t.w(7, 'foto') + 4} volume={0.7} />
      <Sfx name="typing" at={C.etiqueta + 4} volume={0.3} />
      <Sfx name="ding" at={C.arregla + 2} volume={0.25} />
      <Sfx name="ding" at={C.arregla + 9} volume={0.25} />
      <Sfx name="ding" at={C.arregla + 16} volume={0.25} />
      <Sfx name="cash" at={t.w(8, 'llenan')} volume={0.35} />
      <Sfx name="pop" at={C.guarda + 8} volume={0.5} />
    </AbsoluteFill>
  );
};

/** "Destaca tus 3 favoritos": tres platos en columnas que entran escalonados. */
const Favoritos: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={to - from} name="3 favoritos">
    <Split
      ids={[42484, 13261, 47555]}
      dur={to - from}
      stagger={4}
      grades={['warm', 'warm', 'warm']}
      labels={[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
          <Icon name="star" size={70} color="#FFD23F" fill="#FFD23F" />
        </div>
      ))}
    />
  </Sequence>
);
