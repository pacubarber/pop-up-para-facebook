import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Flash, Grain, Music, Sfx, Vignette, type VoData} from '../../lib/core';
import {Shot} from '../../lib/kit/Clip';
import {LightLeak, Progress, Shake} from '../../lib/kit/Fx';
import {Build, Echo, Giant, Label, Reveal, Scramble, Slam, Stack, Strike} from '../../lib/kit/Type';
import {fr, voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/nadie.json';

// Motivacional 2 · "Nadie va a venir a salvarte" — video real (Mixkit) + tipografía cinética.
const vo = voJson as VoData;
const t = voTimeline(vo);
const RED = '#FF2E4D';
const GOLD = '#FFC93C';

// epic_100: el drop (compás 3 = 7,2 s) cae en "Eres tú" y el golpe final (compás 8 = 19,2 s) en "HOY".
const DROP = t.ls(4);
const MUSIC_START = fr(7.2) - DROP;
const FINAL_HIT = fr(19.2) - MUSIC_START;
export const NADIE_DURATION = Math.max(t.end + 30, FINAL_HIT + 36);

const C = {
  nadie: 0,
  jefe: t.ls(1),
  suerte: t.ls(2),
  lunes: t.ls(3),
  eres: DROP,
  solo: t.ls(5),
  rindes: t.ls(6),
  razon: t.w(6, 'le'),
  dudo: t.w(6, 'dudó') - 2,
  caete: t.ls(7),
  ocho: t.ls(8),
  momento: t.ls(9),
  construye: t.ls(10),
  hoy: t.ls(11),
  end: NADIE_DURATION,
};

export const Nadie: React.FC = () => {
  const hits = [t.w(1, 'jefe'), t.w(2, 'suerte'), DROP, t.w(5, 'tú'), t.w(7, 'siete'), t.w(8, 'ocho'), FINAL_HIT];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Shake hits={hits} amp={14}>
        {/* NADIE en vertical, detrás de su hombro */}
        <Shot
          id={41105}
          from={C.nadie}
          to={C.jefe}
          zoom={[1.18, 1.0]}
          grade="night"
          enter="blur"
          cutout
          behind={<Giant from={0} to={C.jefe} text="NADIE" y={900} width={1000} rotate={-90} slide={[-330, -330]} enter="rise" drift={[1.04, 1]} />}
        />
        <Shot id={40998} from={C.jefe} to={C.suerte} zoom={[1.1, 1.22]} grade="cool" enter="whipL" />
        <Shot id={40274} from={C.suerte} to={C.lunes} zoom={[1.05, 1.2]} grade="punch" enter="punch" />
        <Shot id={5050} from={C.lunes} to={C.eres} zoom={[1.0, 1.08]} grade="dim" enter="blur" />
        {/* DROP — TÚ */}
        <Shot
          id={49705}
          from={C.eres}
          to={C.solo}
          zoom={[1.25, 1.35]}
          grade="punch"
          enter="punch"
          cutout
          behind={<Giant from={0} to={C.solo - C.eres} text="TÚ" y={760} width={900} color={RED} enter="scale" enterDur={6} />}
        />
        <Shot
          id={41001}
          from={C.solo}
          to={C.rindes}
          zoom={[1.0, 1.1]}
          grade="punch"
          enter="punch"
          cutout
          behind={<Echo from={t.w(5, 'solo') - C.solo} to={C.rindes - C.solo} text="SOLO TÚ" y={620} width={980} copies={3} />}
        />
        {/* cada vez que te rindes… (cámara lenta, blanco y negro) */}
        <Shot id={40275} from={C.rindes} to={C.razon} rate={0.6} zoom={[1.05, 1.15]} grade="bw" enter="blur" />
        <Shot id={40273} from={C.razon} to={C.dudo} zoom={[1.1, 1.2]} grade="bw" enter="whipU" />
        <Shot id={40275} from={C.dudo} to={C.caete} trim={2.5} zoom={[1.3, 1.45]} grade="bw" enter="punch" />
        {/* cáete siete veces */}
        <Shot id={41066} from={C.caete} to={C.ocho} zoom={[1.05, 1.2]} rot={[0, -2]} grade="warm" enter="drop" />
        {/* levántate ocho: ella corre por encima del 8 */}
        <Shot
          id={32807}
          from={C.ocho}
          to={C.momento}
          zoom={[1.0, 1.05]}
          grade="punch"
          enter="whipU"
          cutout
          behind={<Giant from={t.w(8, 'ocho') - C.ocho - 3} to={C.momento - C.ocho} text="8" y={600} width={560} color={GOLD} enter="scale" />}
        />
        <Shot id={40901} from={C.momento} to={C.construye} zoom={[1.1, 1.2]} x={[20, -20]} grade="warm" enter="blur" />
        <Shot id={40272} from={C.construye} to={C.hoy} zoom={[1.05, 1.15]} grade="punch" enter="whipL" />
        {/* HOY + foto final con contorno */}
        <Shot
          id={49704}
          from={C.hoy}
          to={C.end}
          zoom={[1.3, 1.42]}
          grade="punch"
          enter="punch"
          cutout
          sticker={10}
          freezeAt={FINAL_HIT - C.hoy}
          behind={<Giant from={t.w(11, 'hoy') - C.hoy - 2} to={C.end - C.hoy} text="HOY" y={820} width={1000} color={RED} enter="scale" enterDur={6} drift={[1, 1.06]} />}
        />

        {/* ---------- textos encima ---------- */}
        <Reveal from={t.w(0, 'va') - 2} to={C.jefe} lines={['va a venir a salvarte.']} y={1360} size={84} face="serif" exit="fade" />
        <Slam
          from={C.jefe}
          to={C.suerte}
          y={760}
          size={190}
          face="anton"
          words={[
            {text: 'NI', at: t.w(1, 'ni') - C.jefe},
            {text: 'TU', at: t.w(1, 'tu') - C.jefe},
            {text: 'JEFE.', at: t.w(1, 'jefe') - C.jefe, br: true, size: 330},
          ]}
        />
        <Slam
          from={C.suerte}
          to={C.lunes}
          y={760}
          size={190}
          face="anton"
          words={[
            {text: 'NI', at: t.w(2, 'ni') - C.suerte},
            {text: 'LA', at: t.w(2, 'la') - C.suerte},
            {text: 'SUERTE.', at: t.w(2, 'suerte') - C.suerte, br: true, size: 290, color: GOLD},
          ]}
        />
        <Scramble from={C.lunes} to={C.eres} text="NI EL LUNES QUE VIENE" y={720} size={52} mode="type" speed={0.9} />
        <Giant from={t.w(3, 'lunes') - 2} to={C.eres} text="LUNES" y={960} width={820} outline={5} enter="rise" />
        <Strike from={t.w(3, 'viene')} to={C.eres} x={110} y={975} width={860} height={30} color={RED} />
        <Label from={C.eres + 4} to={C.solo} text="ERES" y={330} align="center" size={56} />
        <Reveal from={C.rindes} to={C.razon} lines={['cada vez que', 'te rindes,']} y={1180} size={110} face="serif" stagger={6} exit="up" />
        <Stack
          from={C.razon}
          to={C.caete}
          y={1080}
          size={128}
          words={[
            {text: 'LE DAS', at: 0},
            {text: 'LA RAZÓN', at: t.w(6, 'razón') - C.razon - 3},
            {text: 'A QUIEN', at: t.w(6, 'quien') - C.razon - 2},
            {text: 'DUDÓ DE TI.', at: t.w(6, 'dudó') - C.razon - 2, color: RED},
          ]}
        />
        <Giant from={C.caete} to={C.ocho} text="CÁETE" y={560} width={880} enter="drop" exit="fade" />
        <Slam
          from={t.w(7, 'siete') - 2}
          to={C.ocho}
          y={1140}
          size={230}
          face="anton"
          words={[
            {text: '7', at: 0, color: GOLD},
            {text: 'VECES', at: t.w(7, 'veces') - t.w(7, 'siete') + 2},
          ]}
        />
        <Reveal from={C.ocho} to={t.w(8, 'ocho') + 4} lines={['LEVÁNTATE']} y={1420} size={120} face="anton" exit="up" />
        <Scramble from={C.momento} to={C.construye} text="TU MOMENTO NO LLEGA." y={1180} size={70} speed={1.4} />
        <Build from={C.construye} to={C.hoy} text="SE CONSTRUYE" y={1120} width={980} stagger={2} />
        <Label from={C.hoy + 2} to={FINAL_HIT} text="EMPIEZA" y={360} align="center" size={60} dot={RED} />
      </Shake>

      <LightLeak at={[C.nadie, DROP - 6, C.ocho - 6, C.momento, C.momento + 18, FINAL_HIT - 4]} colors={['255,120,90', '255,40,120']} />
      <Flash at={DROP} max={0.85} dur={8} />
      <Flash at={t.w(8, 'ocho')} max={0.4} />
      <Flash at={FINAL_HIT} max={0.9} dur={10} />
      <Vignette strength={0.42} />
      <Grain opacity={0.07} />
      <Progress total={NADIE_DURATION} color={RED} />

      <Audio src={staticFile('voz/nadie.wav')} />
      <Music name="epic_100" volume={0.55} duration={NADIE_DURATION} vo={vo} duck={0.62} startFrom={MUSIC_START} fadeIn={4} fadeOut={16} />
      <Sfx name="whoosh_short" at={C.jefe - 4} volume={0.45} />
      <Sfx name="swish" at={t.w(1, 'jefe') - 2} volume={0.5} />
      <Sfx name="swish" at={t.w(2, 'suerte') - 2} volume={0.5} />
      <Sfx name="typing" at={C.lunes} volume={0.35} />
      <Sfx name="riser" at={DROP - 50} volume={0.35} />
      <Sfx name="hit" at={DROP} volume={0.7} />
      <Sfx name="impact" at={t.w(5, 'tú')} volume={0.35} />
      <Sfx name="whoosh_short" at={C.razon - 4} volume={0.4} />
      <Sfx name="whoosh" at={C.caete - 8} volume={0.45} />
      <Sfx name="pop" at={t.w(7, 'siete')} volume={0.5} />
      <Sfx name="swish" at={t.w(8, 'ocho') - 3} volume={0.55} />
      <Sfx name="glitch" at={C.momento} volume={0.3} />
      <Sfx name="click" at={C.construye + 3} volume={0.5} />
      <Sfx name="click" at={C.construye + 10} volume={0.4} />
      <Sfx name="click" at={C.construye + 17} volume={0.4} />
      <Sfx name="hit" at={FINAL_HIT} volume={0.65} />
    </AbsoluteFill>
  );
};
