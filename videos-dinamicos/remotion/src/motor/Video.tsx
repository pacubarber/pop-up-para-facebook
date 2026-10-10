// La composición que convierte un JSON (videos/*.json) en video: escenas, capas, golpes de cámara, voz y efectos.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Capa} from './capas';
import {EscenaVista, durEntrada} from './Escena';
import {cargarFuentes} from './fuentes';
import type {Ctx, Golpe, InfoSonido, Props, Sonido} from './tipos';
import {col, esClaro, wobble} from './util';

/** Suma de todos los golpes activos: zoom de impacto, sacudida, destello e inversión de color. */
const golpes = (t: number, lista: Golpe[], tema: Record<string, string>) => {
  let s = 1;
  let x = 0;
  let y = 0;
  let flash = 0;
  let flashColor = tema.hueso;
  let invertir = false;
  for (const g of lista) {
    const lt = t - (g.t as number);
    if (lt < 0 || lt > 1.2) continue;
    if (g.tipo === 'zoom') s += (g.fuerza ?? 0.07) * Math.exp(-lt / 0.11) * Math.min(1, lt / 0.03 + 0.4);
    else if (g.tipo === 'sacudida') {
      const a = (g.fuerza ?? 22) * Math.exp(-lt / 0.13);
      x += a * wobble(lt * 3, 1);
      y += a * wobble(lt * 3, 7);
    } else if (g.tipo === 'flash') {
      const f = (g.fuerza ?? 0.85) * Math.exp(-lt / (g.dur ?? 0.09));
      if (f > flash) {
        flash = f;
        flashColor = col(g.color ?? 'hueso', tema);
      }
    } else if (g.tipo === 'invertir' && lt < (g.dur ?? 0.067)) invertir = !invertir;
  }
  return {transform: `translate(${x}px, ${y}px) scale(${s})`, flash, flashColor, invertir};
};

const Efecto: React.FC<{s: Sonido; info: InfoSonido; fps: number}> = ({s, info, fps}) => {
  const off = s.alinear === 'pico' ? info.pico : s.alinear === 'ataque' ? info.ataque : 0;
  const from = Math.round(((s.t as number) - off) * fps);
  const recorte = from < 0 ? -from : 0;
  const dur = Math.ceil(info.dur * fps) + 1 - recorte;
  if (dur <= 0) return null;
  return (
    <Sequence from={Math.max(0, from)} durationInFrames={dur} layout="none">
      <Audio src={staticFile(`sonidos/${s.id}.wav`)} volume={s.vol ?? 0.6} trimBefore={recorte || undefined} />
    </Sequence>
  );
};

export const Video: React.FC<Props> = ({spec, voz, sfx}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H, durationInFrames} = useVideoConfig();
  const [handle] = useState(() => delayRender('Cargando fuentes'));
  const [listo, setListo] = useState(false);
  useEffect(() => {
    cargarFuentes()
      .then(() => {
        setListo(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  if (!listo) return null;

  const t = frame / fps;
  const tema = spec.tema;
  const escenas = spec.escenas;
  // la escena "actual" decide el color de las capas (texto oscuro sobre hueso, claro sobre negro)
  let actual = escenas[0];
  for (const e of escenas) if (t >= (e.desde as number) + durEntrada(e.entrada) * 0.5) actual = e;
  const fondo = col(actual.fondo ?? 'hueso', tema);
  const ctx: Ctx = {t, fps, W, H, tema, voz, dur: durationInFrames / fps, tinta: esClaro(fondo) ? tema.tinta : tema.hueso};
  const cam = golpes(t, spec.golpes ?? [], tema);

  return (
    <AbsoluteFill style={{background: fondo, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: cam.transform, filter: cam.invertir ? 'invert(1)' : undefined}}>
        {escenas.map((e, i) => (
          <EscenaVista key={i} e={e} sig={escenas[i + 1]} ctx={ctx} />
        ))}
      </AbsoluteFill>
      {(spec.capas ?? []).map((c, i) => (
        <Capa key={i} c={c} ctx={ctx} />
      ))}
      {cam.flash > 0.01 ? <AbsoluteFill style={{background: cam.flashColor, opacity: Math.min(1, cam.flash)}} /> : null}
      {voz && spec.voz ? <Audio src={staticFile(spec.voz.archivo)} volume={spec.voz.volumen ?? 1} /> : null}
      {sfx ? (spec.sonidos ?? []).map((s, i) => <Efecto key={i} s={s} info={sfx[s.id]} fps={fps} />) : null}
    </AbsoluteFill>
  );
};
