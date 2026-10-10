// Bloques de texto animados: entran palabra por palabra al ritmo de la voz o como una unidad.
import {fitText} from '@remotion/layout-utils';
import React, {useMemo} from 'react';
import {familia} from './fuentes';
import {normaliza} from './tiempo';
import type {Anim, Bloque, Ctx} from './tipos';
import {clamp, col, easeOut, prog} from './util';

/** Estilo de una palabra (o del bloque entero) `lt` segundos después de entrar. */
const animar = (anim: Anim, lt: number): React.CSSProperties => {
  if (lt < 0) return {opacity: 0};
  switch (anim) {
    case 'golpe': {
      const s = 1 + 0.55 * Math.exp(-lt * 13) * Math.cos(lt * 17);
      const blur = Math.max(0, 9 * (1 - lt / 0.1));
      return {transform: `scale(${s})`, opacity: clamp(lt / 0.05), filter: blur > 0.3 ? `blur(${blur}px)` : undefined};
    }
    case 'aparece': {
      const e = easeOut(lt / 0.3);
      return {opacity: e, transform: `translateY(${(1 - e) * 22}px) scale(${0.97 + 0.03 * e})`, filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined};
    }
    case 'desliza': {
      const e = easeOut(lt / 0.28, 4);
      return {opacity: e, transform: `translateX(${(1 - e) * -90}px)`, filter: e < 1 ? `blur(${(1 - e) * 8}px)` : undefined};
    }
    default:
      return {};
  }
};

/** "sube": la palabra asoma desde abajo dentro de una ventana (máscara). */
const Sube: React.FC<{lt: number; children: React.ReactNode}> = ({lt, children}) => {
  const e = easeOut(lt / 0.34, 4);
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', padding: '0.12em 0.04em', margin: '-0.12em -0.04em'}}>
      <span style={{display: 'inline-block', transform: `translateY(${lt < 0 ? 120 : (1 - e) * 115}%)`}}>{children}</span>
    </span>
  );
};

export const Texto: React.FC<{b: Bloque; ctx: Ctx}> = ({b, ctx}) => {
  const {t, tema} = ctx;
  const fuente = b.fuente ?? 'display';
  const fam = familia[fuente];
  const peso = b.peso ?? (fuente === 'serif' ? 400 : fuente === 'mono' ? 600 : 800);
  const texto = b.mayus ? b.texto.toUpperCase() : b.texto;
  const ancho = b.ancho ?? ctx.W - 160;
  const tracking = b.tracking ?? (fuente === 'display' ? -0.035 : 0);
  // con tracking negativo el espacio entre palabras se come: lo devolvemos con word-spacing
  const espacio = tracking < 0 ? -tracking * 1.5 : 0;
  const auto = b.tam === undefined || b.tam === 'auto';
  const tam = useMemo(
    () =>
      auto
        ? Math.min(
            b.tamMax ?? 420,
            fitText({
              text: texto,
              withinWidth: ancho,
              fontFamily: fam,
              fontWeight: peso,
              letterSpacing: `${tracking}em`,
              additionalStyles: {fontStyle: b.italica ? 'italic' : 'normal', wordSpacing: `${espacio}em`},
            }).fontSize * 0.98,
          )
        : (b.tam as number),
    [auto, b.tam, b.tamMax, b.italica, texto, ancho, fam, peso, tracking, espacio],
  );

  const en = b.en as number;
  const anim = b.anim ?? 'aparece';
  const porPalabra = Boolean(b._palabras || b.escalonado || anim === 'escribe');
  const primera = b._palabras?.[0] ?? en;
  if (t < primera) return null;
  const sale = b.sale as number | undefined;
  if (sale !== undefined && t > sale + 0.25) return null;

  const color = col(b.color, tema, ctx.tinta === tema.tinta ? 'tinta' : 'hueso');
  const colorAcento = col(b.colorAcento ?? 'acento', tema);
  const acentos = new Set((b.acentos ?? []).map(normaliza));
  const tokens = texto.split(/\s+/);
  const wt = (i: number) => b._palabras?.[i] ?? en + i * (b.escalonado ?? 0);
  const cps = b.cps ?? 22;

  // palabras
  const ultima = lastVisible(tokens, wt, t);
  const escribiendo = wt(tokens.length - 1) + tokens[tokens.length - 1].length / cps > t;
  const palabras = tokens.map((tok, i) => {
    const lt = t - wt(i);
    const style: React.CSSProperties = {display: 'inline-block', whiteSpace: 'pre'};
    if (acentos.has(normaliza(tok))) style.color = colorAcento;
    let contenido: React.ReactNode = tok;
    if (anim === 'escribe') {
      const n = lt < 0 ? 0 : Math.min(tok.length, Math.floor(lt * cps) + 1);
      contenido = (
        <>
          {tok.slice(0, n)}
          {b.cursor !== false && i === ultima ? <Cursor t={t} escribiendo={escribiendo} color={colorAcento} /> : null}
          <span style={{opacity: 0}}>{tok.slice(n)}</span>
        </>
      );
    } else if (porPalabra) {
      if (anim === 'sube') contenido = <Sube lt={lt}>{tok}</Sube>;
      else Object.assign(style, animar(anim, lt));
    }
    return (
      <React.Fragment key={i}>
        {i > 0 ? ' ' : null}
        <span style={style}>{contenido}</span>
      </React.Fragment>
    );
  });

  // bloque completo
  const ltB = t - en;
  let bloque: React.CSSProperties = porPalabra ? {} : animar(anim, ltB);
  if (sale !== undefined && t > sale) {
    const q = easeOut((t - sale) / 0.22);
    bloque = {...bloque, opacity: (Number(bloque.opacity ?? 1) || 0) * (1 - q), transform: `${bloque.transform ?? ''} translateY(${-q * 30}px)`, filter: `blur(${q * 8}px)`};
  }

  const linea = Math.max(4, tam * 0.075);
  const interior = (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        isolation: 'isolate',
        background: b.etiqueta ? col(b.etiqueta, tema) : undefined,
        padding: b.etiqueta ? '0.14em 0.38em 0.1em' : undefined,
        borderRadius: b.etiqueta ? '0.22em' : undefined,
        ...bloque,
      }}
    >
      {!porPalabra && anim === 'sube' ? <Sube lt={ltB}>{palabras}</Sube> : palabras}
      {b.subrayar !== undefined && t >= (b.subrayar as number) ? (
        <span
          style={{
            position: 'absolute',
            left: '-0.06em',
            bottom: '0.06em',
            height: '0.34em',
            width: `calc(${easeOut(prog(t, b.subrayar as number, 0.28)) * 100}% + 0.12em)`,
            background: colorAcento,
            zIndex: -1,
            transform: 'rotate(-1deg)',
            borderRadius: '0.06em',
          }}
        />
      ) : null}
      {b.tachar !== undefined && t >= (b.tachar as number) ? (
        <span
          style={{
            position: 'absolute',
            left: '-0.04em',
            top: '50%',
            height: linea,
            width: `calc(${easeOut(prog(t, b.tachar as number, 0.24)) * 100}% + 0.08em)`,
            background: colorAcento,
            transform: 'rotate(-3deg)',
            transformOrigin: 'left center',
          }}
        />
      ) : null}
    </span>
  );

  const al = b.alinear ?? 'centro';
  const x = b.x ?? ctx.W / 2;
  const caja: React.CSSProperties = {
    position: 'absolute',
    top: b.y,
    left: al === 'centro' ? x - ancho / 2 : al === 'izq' ? x : x - ancho,
    width: ancho,
    transform: `translateY(-50%)${b.rot ? ` rotate(${b.rot}deg)` : ''}`,
    textAlign: al === 'centro' ? 'center' : al === 'izq' ? 'left' : 'right',
    fontFamily: fam,
    fontWeight: peso,
    fontStyle: b.italica ? 'italic' : 'normal',
    fontSize: tam,
    lineHeight: b.interlineado ?? (fuente === 'serif' ? 1.02 : 0.96),
    letterSpacing: `${tracking}em`,
    wordSpacing: espacio ? `${espacio}em` : undefined,
    whiteSpace: auto ? 'nowrap' : undefined,
    color: b.contorno ? 'transparent' : color,
    WebkitTextStroke: b.contorno ? `${b.contorno}px ${color}` : undefined,
    opacity: b.opacidad,
    fontVariantNumeric: 'tabular-nums',
  };

  const partir = b.partir as number | undefined;
  if (partir === undefined || t < partir) return <div style={caja}>{interior}</div>;

  // se parte en diagonal: dos copias recortadas que se separan
  const e = easeOut(prog(t, partir, 0.42), 3);
  const d = e * tam * 0.42;
  const destello = 1 - prog(t, partir, 0.16);
  const alto = tam * (b.interlineado ?? 0.96);
  return (
    <>
      <div style={{...caja, clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 60%)', transform: `${caja.transform} translate(${-d * 0.75}px, ${-d * 0.32}px) rotate(${-e * 3}deg)`}}>
        {interior}
      </div>
      <div style={{...caja, clipPath: 'polygon(0 60%, 100% 40%, 100% 100%, 0 100%)', transform: `${caja.transform} translate(${d * 0.75}px, ${d * 0.32}px) rotate(${e * 3}deg)`}}>
        {interior}
      </div>
      {destello > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: caja.left as number,
            top: b.y - 3,
            width: ancho,
            height: 6,
            background: colorAcento,
            opacity: destello,
            transform: `rotate(${(-Math.atan2(alto * 0.2, ancho) * 180) / Math.PI}deg) scaleX(${0.4 + 0.6 * (1 - destello)})`,
            boxShadow: `0 0 24px ${colorAcento}`,
          }}
        />
      ) : null}
    </>
  );
};

const lastVisible = (tokens: string[], wt: (i: number) => number, t: number) => {
  let k = -1;
  tokens.forEach((_, i) => {
    if (t >= wt(i)) k = i;
  });
  return k;
};

const Cursor: React.FC<{t: number; escribiendo: boolean; color: string}> = ({t, escribiendo, color}) => (
  <span style={{position: 'relative', display: 'inline-block', width: 0}}>
    <span
      style={{
        position: 'absolute',
        left: '0.04em',
        bottom: '-0.06em',
        width: '0.07em',
        height: '0.84em',
        background: color,
        opacity: escribiendo || Math.floor(t * 2.2) % 2 === 0 ? 1 : 0,
      }}
    />
  </span>
);
