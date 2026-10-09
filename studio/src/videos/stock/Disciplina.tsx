import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Flash, Grain, Music, Sfx, Vignette, type VoData} from '../../lib/core';
import {Shot} from '../../lib/kit/Clip';
import {LightLeak, Progress, Shake, VideoText} from '../../lib/kit/Fx';
import {Count, Dissolve, Echo, Giant, Label, Reveal, Slam, Stack, Strike} from '../../lib/kit/Type';
import {fr, voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/disciplina.json';

// Motivacional 1 · "Disciplina" — video real (Mixkit) + tipografía cinética.
const vo = voJson as VoData;
const t = voTimeline(vo);
const RED = '#FF3B1F';

// El drop de la música (compás 6 de epic_95 = 15,16 s) cae justo en "DISCIPLINA".
const DROP = t.w(4, 'disciplina');
const MUSIC_START = fr(15.16) - DROP;
const FINAL_HIT = fr(30.32) - MUSIC_START; // último compás de la pista
export const DISCIPLINA_DURATION = Math.max(t.end + 30, FINAL_HIT + 40);

// cortes (frames)
const C = {
  watch: 0,
  city: t.ls(1),
  tuNo: t.ls(2) + 2,
  ropes: t.ls(3),
  press: t.w(3, 'necesitas'),
  fight: t.ls(4),
  boxer: DROP - 1,
  seVa: t.ls(5),
  queda: t.ls(6),
  queda2: t.w(6, 'se'),
  queda3: t.w(6, 'queda'),
  rep: t.ls(7),
  km: t.ls(8),
  dia: t.ls(9),
  dolor: t.ls(10),
  fuerza: t.w(10, 'fuerza') - 2,
  levanta: t.ls(11),
  otra: t.ls(12),
  end: DISCIPLINA_DURATION,
};

export const Disciplina: React.FC = () => {
  const hits = [t.w(2, 'tú'), t.w(2, 'no'), DROP, t.w(7, 'más'), t.w(10, 'fuerza'), FINAL_HIT];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Shake hits={hits} amp={16}>
        {/* 5:00 — el reloj */}
        <Shot id={32808} from={C.watch} to={C.city} zoom={[1.25, 1.45]} grade="cool" enter="blur" enterDur={10} />
        {/* la ciudad duerme */}
        <Shot id={34561} from={C.city} to={C.tuNo} zoom={[1.05, 1.18]} grade="bw" enter="blur" />
        {/* TÚ NO */}
        <Shot id={40276} from={C.tuNo} to={C.ropes} zoom={[1.1, 1.22]} grade="teal" enter="punch" />
        {/* porque no necesitas… */}
        <Shot id={40971} from={C.ropes} to={C.press} zoom={[1.05, 1.15]} grade="cool" enter="whipU" />
        {/* MOTIVACIÓN detrás de la persona, y tachada */}
        <Shot
          id={52080}
          from={C.press}
          to={C.fight}
          zoom={[1.0, 1.08]}
          grade="cool"
          enter="punch"
          cutout
          behind={
            <>
              <Giant from={t.w(3, 'motivación') - C.press - 4} to={C.fight - C.press} text="MOTIVACIÓN" y={540} width={900} outline={6} enter="track" />
              <Strike from={t.we(3, 'motivación') - C.press - 6} to={C.fight - C.press} x={90} y={545} width={900} height={28} color={RED} />
            </>
          }
        />
        <Shot id={40973} from={C.fight} to={C.boxer} zoom={[1.15, 1.3]} grade="punch" enter="zoom" rate={0.8} />
        {/* DISCIPLINA — drop: la palabra detrás de él */}
        <Shot
          id={52079}
          from={C.boxer}
          to={C.seVa}
          zoom={[1.12, 1.0]}
          grade="punch"
          enter="punch"
          cutout
          behind={<Giant from={0} to={C.seVa - C.boxer} text="DISCIPLINA" y={600} width={960} color={RED} enter="track" enterDur={9} drift={[1, 1.04]} />}
        />
        {/* la motivación se va (B/N, las letras se deshacen) */}
        <Shot id={52082} from={C.seVa} to={C.queda} zoom={[1.15, 1.0]} grade="bw" enter="blur" trim={0.2} />
        {/* la disciplina se queda: el texto no se mueve, el mundo sí */}
        <Shot id={40788} from={C.queda} to={C.queda2} zoom={[1.1, 1.16]} grade="warm" />
        <Shot id={43321} from={C.queda2} to={C.queda3} zoom={[1.1, 1.18]} grade="warm" />
        <Shot id={41065} from={C.queda3} to={C.rep} zoom={[1.1, 1.2]} grade="warm" />
        {/* una repetición más: contador detrás */}
        <Shot
          id={52082}
          from={C.rep}
          to={C.km}
          trim={1.6}
          zoom={[1.05, 1.15]}
          grade="punch"
          enter="whipL"
          cutout
          behind={<Count from={0} to={C.km - C.rep} value={[97, 100]} roll={t.w(7, 'más') - C.rep} y={330} size={640} color="rgba(255,255,255,0.92)" />}
        />
        {/* un kilómetro más: el corredor pasa por encima del texto */}
        <Shot
          id={32809}
          from={C.km}
          to={C.dia}
          zoom={[1.0, 1.06]}
          grade="punch"
          enter="punch"
          cutout
          behind={<Giant from={t.w(8, 'kilómetro') - C.km - 3} to={C.dia - C.km} text="+1 KM" y={560} width={860} enter="scale" color="#fff" />}
        />
        <Shot id={43321} from={C.dia} to={C.dolor} trim={1.5} zoom={[1.2, 1.35]} grade="cool" enter="whipD" />
        {/* el dolor (video dentro de la palabra) → la fuerza */}
        <VideoText from={C.dolor} to={C.fuerza} id={40973} text="DOLOR" width={1000} expand={C.fuerza - C.dolor - 13} origin="50% 55%" trim={0.5} />
        <Shot id={40276} from={C.fuerza} to={C.levanta} trim={1.8} zoom={[1.1, 1.25]} grade="punch" enter="zoom" />
        {/* levántate: texto vertical que sube */}
        <Shot id={41065} from={C.levanta} to={C.otra} trim={1.2} zoom={[1.05, 1.2]} y={[0, -60]} grade="cool" enter="whipU" />
        {/* y hazlo otra vez: eco detrás de él, y foto final con contorno */}
        <Shot
          id={34583}
          from={C.otra}
          to={C.end}
          zoom={[1.0, 1.1]}
          grade="warm"
          enter="punch"
          cutout
          sticker={10}
          freezeAt={FINAL_HIT - C.otra}
          behind={<Echo from={t.w(12, 'otra') - C.otra - 2} to={C.end - C.otra} text="OTRA VEZ" y={560} width={960} copies={3} color={RED} />}
        />

        {/* ---------- textos encima ---------- */}
        <Label from={2} to={C.city} text="LUNES · 05:00 AM" y={330} align="center" dot={RED} size={46} />
        <Giant from={t.w(0, 'cinco') - 2} to={C.city} text="5:00" y={1180} width={760} enter="scale" exit="up" shadow />
        <Reveal from={t.w(1, 'todos')} to={C.tuNo} lines={['todos', 'duermen.']} y={760} size={190} face="serif" stagger={4} exit="fade" />
        <Slam
          from={C.tuNo}
          to={C.ropes}
          y={720}
          size={300}
          face="anton"
          words={[
            {text: 'TÚ', at: t.w(2, 'tú') - C.tuNo},
            {text: 'NO.', at: t.w(2, 'no') - C.tuNo, color: RED},
          ]}
        />
        <Stack
          from={C.ropes}
          to={C.press}
          y={1180}
          size={130}
          words={[
            {text: 'PORQUE', at: 0},
            {text: 'NO', at: t.w(3, 'no') - C.ropes, color: RED},
            {text: 'NECESITAS', at: t.w(3, 'necesitas') - C.ropes - 4},
          ]}
        />
        <Slam from={C.fight} to={C.boxer} y={1240} size={150} face="displayItalic" words={[{text: 'NECESITAS', at: 0}]} />
        <Dissolve from={t.w(5, 'motivación') - 2} to={C.queda} text="MOTIVACIÓN" y={1000} width={980} start={t.w(5, 'se') - t.w(5, 'motivación')} />
        <Label from={t.w(5, 'se')} to={C.queda} text="SE VA." y={1190} align="center" size={56} />
        <Giant from={C.queda} to={C.rep} text="DISCIPLINA" y={960} width={1000} enter="none" exit="cut" shadow drift={[1, 1]} />
        <Label from={t.w(6, 'se')} to={C.rep} text="SE QUEDA." y={1100} align="center" size={56} dot={RED} />
        <Slam from={t.w(7, 'más') - 1} to={C.km} y={1350} size={220} face="anton" words={[{text: '+1', at: 0, color: RED}]} />
        <Label from={C.rep + 4} to={C.km} text="REPETICIÓN" y={1560} align="center" size={50} />
        <Count from={C.dia} to={C.dolor} value={[1, 365]} prefix="DÍA " roll={t.w(9, 'más') - C.dia} y={820} size={210} sep="" />
        <Giant from={t.w(10, 'fuerza') - 1} to={C.levanta} text="FUERZA" y={960} width={980} enter="scale" exit="scale" color="#fff" shadow />
        <Label from={t.w(10, 'mañana') - 2} to={C.levanta} text="MAÑANA" y={1170} align="center" size={56} />
        <Giant from={C.levanta} to={C.otra} text="LEVÁNTATE" y={960} width={1700} rotate={-90} enter="rise" shadow />
        <Label from={t.w(12, 'hazlo') - 2} to={FINAL_HIT} text="Y HAZLO" y={1450} align="center" size={60} />
      </Shake>

      <LightLeak at={[C.tuNo - 6, DROP - 6, C.km - 4, C.levanta - 6, FINAL_HIT - 4]} />
      <Flash at={C.tuNo} max={0.5} />
      <Flash at={DROP} max={0.8} dur={8} />
      <Flash at={FINAL_HIT} max={0.9} dur={10} />
      <Vignette strength={0.42} />
      <Grain opacity={0.07} />
      <Progress total={DISCIPLINA_DURATION} color={RED} />

      <Audio src={staticFile('voz/disciplina.wav')} />
      <Music name="epic_95" volume={0.55} duration={DISCIPLINA_DURATION} vo={vo} duck={0.62} startFrom={MUSIC_START} fadeIn={6} fadeOut={20} />
      <Sfx name="heartbeat" at={4} volume={0.5} />
      <Sfx name="heartbeat" at={30} volume={0.4} />
      <Sfx name="hit" at={t.w(2, 'tú')} volume={0.45} />
      <Sfx name="swish" at={t.w(2, 'no') - 2} volume={0.5} />
      <Sfx name="whoosh_short" at={C.ropes - 4} volume={0.45} />
      <Sfx name="riser" at={DROP - 58} volume={0.35} />
      <Sfx name="hit" at={DROP} volume={0.7} />
      <Sfx name="glitch" at={t.w(5, 'se')} volume={0.35} />
      <Sfx name="whoosh_short" at={C.rep - 4} volume={0.45} />
      <Sfx name="pop" at={t.w(7, 'más')} volume={0.5} />
      <Sfx name="swish" at={t.w(8, 'kilómetro') - 3} volume={0.5} />
      <Sfx name="whoosh_short" at={C.dia - 4} volume={0.4} />
      <Sfx name="whoosh" at={C.fuerza - 10} volume={0.45} />
      <Sfx name="impact" at={t.w(10, 'fuerza')} volume={0.45} />
      <Sfx name="whoosh_short" at={C.levanta - 4} volume={0.45} />
      <Sfx name="hit" at={FINAL_HIT} volume={0.6} />
    </AbsoluteFill>
  );
};
