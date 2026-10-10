// Gráficos que el JSON puede poner en una escena ("graficos": [{"tipo": "sello", …}]).
// Todos dibujados en código con la paleta de CORTE: nada de imágenes ni librerías.
import React from 'react';
import {familia} from './fuentes';
import type {Ctx} from './tipos';
import {GRAFICOS2} from './graficos2';
import {back, clamp, col, easeIO, easeIn, easeOut, lerp, prog, spring, wobble} from './util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type G = Record<string, any>;
type GProps = {g: G; ctx: Ctx};

const abs = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: x - w / 2,
  top: y - h / 2,
  width: w,
  height: h,
});

const Lienzo: React.FC<{ctx: Ctx; children: React.ReactNode; style?: React.CSSProperties}> = ({ctx, children, style}) => (
  <svg width={ctx.W} height={ctx.H} viewBox={`0 0 ${ctx.W} ${ctx.H}`} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/** Círculo que se dibuja solo; con "hasta" < 1 queda abierto (una pregunta sin cerrar). */
const Anillo: React.FC<GProps> = ({g, ctx}) => {
  const {x = 540, y = 960, r = 300, grosor = 16, dur = 0.6, hasta = 1, giro = -90} = g;
  const p = easeOut(prog(ctx.t, g.en, dur), 2.4) * hasta;
  const C = 2 * Math.PI * r;
  return (
    <Lienzo ctx={ctx}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={col(g.color ?? 'acento', ctx.tema)}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - p)}
        transform={`rotate(${giro} ${x} ${y})`}
      />
    </Lienzo>
  );
};

/** Caja (con borde discontinuo y parpadeo opcionales): el hueco donde "debería" ir algo. */
const Caja: React.FC<GProps> = ({g, ctx}) => {
  const {x = 540, y = 960, ancho = 200, alto = 200, radio = 24, grosor = 8, discontinua = false, parpadeo = false} = g;
  const e = back(prog(ctx.t, g.en, 0.3));
  const on = !parpadeo || Math.floor((ctx.t - g.en) * 2.6) % 2 === 0;
  return (
    <div
      style={{
        ...abs(x, y, ancho, alto),
        borderRadius: radio,
        border: `${grosor}px ${discontinua ? 'dashed' : 'solid'} ${col(g.color ?? ctx.tinta, ctx.tema)}`,
        background: g.relleno ? col(g.relleno, ctx.tema) : undefined,
        transform: `scale(${e})`,
        opacity: on ? 1 : 0.25,
      }}
    />
  );
};

/** Tarjeta sellada con cinta "NO ABRIR": cae, tiembla y la cinta se arranca para revelar. */
const Sello: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 900, ancho = 560, alto = 740, escala = 1, cinta = 'NO ABRIR HASTA EL FINAL'} = g;
  const lt = t - g.en;
  const caida = g.cae === false ? 1 : spring(lt, 1.9, 6.5);
  let dx = 0;
  let rot = (1 - caida) * -16;
  const dy = (1 - caida) * -1400;
  if (g.tiembla !== undefined && t >= g.tiembla && (g.rompe === undefined || t < g.rompe)) {
    const amp = 2 + 16 * easeIn(prog(t, g.tiembla, (g.rompe ?? g.tiembla + 1) - g.tiembla), 2);
    dx = amp * wobble(t * 3, 1);
    rot += amp * 0.3 * wobble(t * 3, 2);
  }
  const roto = g.rompe !== undefined && t >= g.rompe;
  const er = roto ? easeOut(prog(t, g.rompe, 0.55), 2) : 0;
  const pop = roto ? 1 + 0.25 * Math.exp(-(t - g.rompe) * 9) * Math.cos((t - g.rompe) * 20) : 1;
  const destello = roto ? 1 - prog(t, g.rompe, 0.25) : 0;
  const num = roto ? (g.revela ?? '4') : (g.texto ?? '?');
  const fondo = col(g.fondo ?? 'tinta', tema);
  const colCinta = col(g.colorCinta ?? 'acento', tema);
  const tira = (angulo: number, k: number) => {
    const largo = ancho * 1.55;
    const mitad = (lado: -1 | 1) => (
      <div
        style={{
          position: 'absolute',
          top: 0,
          height: '100%',
          width: '50%',
          left: lado < 0 ? 0 : '50%',
          overflow: 'hidden',
          background: colCinta,
          transform: `translateX(${lado * er * 760}px) translateY(${er * er * 300}px) rotate(${lado * er * 26}deg)`,
          opacity: 1 - er * er,
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: lado < 0 ? 0 : '-100%',
            width: '200%',
            whiteSpace: 'nowrap',
            transform: `translate(${-((t * 60 + k * 90) % 400)}px, -50%)`,
            fontFamily: familia.mono,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.08em',
            color: col('hueso', tema),
          }}
        >
          {Array.from({length: 8}, () => `${cinta} · `).join('')}
        </div>
      </div>
    );
    return (
      <div style={{...abs(0, 0, largo, 104), position: 'absolute', left: -largo / 2, top: -52, transform: `rotate(${angulo}deg)`}}>
        {mitad(-1)}
        {mitad(1)}
      </div>
    );
  };
  const salida = g.sale !== undefined ? easeIn(prog(t, g.sale, 0.3)) : 0;
  const aparece = g.cae === false ? back(prog(t, g.en, 0.35), 2) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${escala * aparece * (1 - salida * 0.6)})`,
        opacity: 1 - salida,
      }}
    >
      <div
        style={{
          ...abs(0, 0, ancho, alto),
          borderRadius: 40,
          background: destello > 0 ? mezcla(fondo, colCinta, destello) : fondo,
          boxShadow: '0 50px 90px rgba(12,12,14,0.28)',
          overflow: 'hidden',
          transform: `scale(${pop})`,
        }}
      >
        <div style={{position: 'absolute', left: 40, top: 34, fontFamily: familia.mono, fontWeight: 600, fontSize: 28, letterSpacing: '0.1em', color: col('gris', tema)}}>
          TRUCO
        </div>
        <div style={{position: 'absolute', right: 40, top: 34, fontFamily: familia.mono, fontWeight: 600, fontSize: 28, color: col('gris', tema)}}>
          04/04
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: familia.display,
            fontWeight: 900,
            fontSize: alto * 0.66,
            letterSpacing: '-0.05em',
            color: roto ? colCinta : col('hueso', tema),
            paddingTop: alto * 0.04,
          }}
        >
          {num}
        </div>
      </div>
      {tira(-27, 0)}
      {tira(27, 1)}
    </div>
  );
};

const mezcla = (a: string, b: string, p: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [A, B] = [h(a), h(b)];
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`;
};

/** Línea de tiempo partida en tramos de 2–3 s con un cabezal que la recorre. */
const Segmentos: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {y = 1100, x0 = 110, x1 = 970, alto = 110, partes = [2, 3, 2, 3, 2], paso = 0.16} = g;
  const total = partes.reduce((a: number, b: number) => a + b, 0);
  const colores: string[] = g.colores ?? ['tinta', 'gris', 'tinta', 'acento', 'tinta'];
  let acc = 0;
  const gap = 10;
  const cab = g.cabezal as [number, number] | undefined;
  return (
    <>
      {partes.map((d: number, k: number) => {
        const a = x0 + ((x1 - x0) * acc) / total;
        acc += d;
        const b = x0 + ((x1 - x0) * acc) / total;
        const lt = t - (g.en + k * paso);
        if (lt < 0) return null;
        const e = back(clamp(lt / 0.22), 2.4);
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: 'absolute',
                left: a + gap / 2,
                top: y - alto / 2,
                width: b - a - gap,
                height: alto,
                borderRadius: 18,
                background: col(colores[k % colores.length], tema),
                transform: `scaleY(${e})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: a,
                width: b - a,
                top: y + alto / 2 + 22,
                textAlign: 'center',
                fontFamily: familia.mono,
                fontWeight: 600,
                fontSize: 34,
                color: ctx.tinta,
                opacity: clamp(lt / 0.2),
              }}
            >
              {d} s
            </div>
          </React.Fragment>
        );
      })}
      {cab && t >= cab[0] ? (
        <div style={{position: 'absolute', left: lerp(x0, x1, easeIO(prog(t, cab[0], cab[1] - cab[0]))) - 4, top: y - alto / 2 - 50, width: 8, height: alto + 80, background: col('acento', tema), borderRadius: 4}}>
          <div style={{position: 'absolute', left: -14, top: -14, width: 36, height: 36, borderRadius: 18, background: col('acento', tema)}} />
        </div>
      ) : null}
    </>
  );
};

/** Ondas de sonido: anillos que se expanden y un ecualizador que salta y se calma. */
const Ondas: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 960, n = 4, radio = 520, barras = 25, yBarras = y, anchoBarras = 860} = g;
  const color = col(g.color ?? 'acento', tema);
  const lt = t - g.en;
  return (
    <>
      <Lienzo ctx={ctx}>
        {Array.from({length: n}, (_, i) => {
          const l = lt - i * 0.1;
          if (l < 0 || l > 0.9) return null;
          const p = easeOut(l / 0.9, 2);
          return <circle key={i} cx={x} cy={y} r={40 + p * radio} fill="none" stroke={color} strokeWidth={4 + 16 * (1 - p)} opacity={1 - p} />;
        })}
      </Lienzo>
      {barras > 0
        ? Array.from({length: barras}, (_, i) => {
            const u = i / (barras - 1);
            const env = Math.exp(-Math.max(0, lt) * 1.6) * (1 - Math.abs(u - 0.5) * 1.2);
            const h = 16 + 300 * env * Math.abs(Math.sin(t * 19 + i * 1.7) * 0.6 + Math.sin(t * 11 + i * 0.9) * 0.4);
            const bx = x - anchoBarras / 2 + u * anchoBarras;
            return (
              <div
                key={i}
                style={{position: 'absolute', left: bx - 9, top: yBarras - h / 2, width: 18, height: h, borderRadius: 9, background: i % 6 === 3 ? color : ctx.tinta, opacity: clamp(lt / 0.08)}}
              />
            );
          })
        : null}
    </>
  );
};

/** Feed de un celular que avanza lento (aburrido) hasta que el pulgar lo desliza. */
const Feed: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 900, ancho = 600, alto = 1060} = g;
  const sw = g.swipe as number | undefined;
  const lt = t - g.en;
  const ps = sw !== undefined ? easeIO(prog(t, sw, 0.4)) : 0;
  const vel = sw !== undefined && t >= sw && t < sw + 0.4 ? Math.sin(Math.PI * prog(t, sw, 0.4)) : 0;
  const off = lt * 38 + ps * 1500;
  const alturas = [400, 320, 400, 320, 400, 320, 400, 320, 400];
  let acc = 40;
  const entrada = back(prog(t, g.en, 0.35), 1.4);
  const dedo = sw !== undefined ? prog(t, sw - 0.25, 0.65) : 0;
  const dedoY = lerp(alto * 0.8, alto * 0.18, easeIO(clamp((dedo - 0.3) / 0.5)));
  return (
    <div style={{...abs(x, y, ancho, alto), transform: `translateY(${(1 - entrada) * 300}px)`, opacity: clamp(lt / 0.15)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 72, border: `12px solid ${ctx.tinta}`, background: col(g.pantalla ?? 'papel', tema), overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-off}px)`, filter: vel > 0.05 ? `blur(${vel * 14}px)` : undefined}}>
          {alturas.map((h, i) => {
            const top = acc;
            acc += h + 28;
            return (
              <div key={i} style={{position: 'absolute', left: 34, right: 34, top, height: h, borderRadius: 26, background: col('hueso', tema), boxShadow: '0 2px 0 rgba(12,12,14,0.08)'}}>
                <div style={{position: 'absolute', left: 22, right: 22, top: 22, height: h * 0.58, borderRadius: 16, background: col(i % 3 === 1 ? 'gris' : 'linea', tema), opacity: i % 3 === 1 ? 0.55 : 0.18}} />
                <div style={{position: 'absolute', left: 22, width: '62%', top: h * 0.58 + 46, height: 22, borderRadius: 11, background: col('gris', tema), opacity: 0.45}} />
                <div style={{position: 'absolute', left: 22, width: '38%', top: h * 0.58 + 86, height: 22, borderRadius: 11, background: col('gris', tema), opacity: 0.3}} />
              </div>
            );
          })}
        </div>
      </div>
      {dedo > 0 && dedo < 1 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: ancho / 2 - 8,
              width: 16,
              top: dedoY,
              height: alto * 0.8 - dedoY,
              borderRadius: 8,
              background: col('acento', tema),
              opacity: 0.35 * Math.sin(Math.PI * dedo),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: ancho / 2 - 50,
              top: dedoY - 50,
              width: 100,
              height: 100,
              borderRadius: 50,
              background: col('acento', tema),
              opacity: 0.85 * Math.sin(Math.PI * dedo),
              transform: `scale(${0.8 + 0.3 * Math.sin(Math.PI * dedo)})`,
            }}
          />
        </>
      ) : null}
    </div>
  );
};

/** Celular en silencio con una persona hablando; los subtítulos (karaoke) solo si se piden. */
const Celular: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema, voz} = ctx;
  const {x = 540, y = 960, ancho = 580, alto = 1120, escala = 1} = g;
  const lt = t - g.en;
  const entrada = g.estatico ? 1 : back(prog(t, g.en, 0.4), 1.3);
  const sub = g.subtitulos as {desde: number; hasta: number} | undefined;
  const palabras = (voz?.lineas ?? []).flatMap((l) => l.palabras);
  const hablando = palabras.some((p) => t >= p.inicio && t < p.fin + 0.04) && (g.boca === undefined || t >= g.boca);
  const boca = hablando ? 10 + 22 * Math.abs(Math.sin(t * 23)) : 6;
  let pagina: React.ReactNode = null;
  if (sub && t >= sub.desde && t < sub.hasta + 0.3) {
    const ws = palabras.filter((p) => p.inicio >= sub.desde - 0.05 && p.inicio < sub.hasta);
    const paginas: (typeof ws)[] = [];
    ws.forEach((w, i) => {
      const ult = paginas[paginas.length - 1];
      if (!ult || ult.length >= 3 || w.inicio - ws[i - 1].fin > 0.35) paginas.push([w]);
      else ult.push(w);
    });
    const pg = [...paginas].reverse().find((p) => t >= p[0].inicio) ?? null;
    if (pg)
      pagina = (
        <div style={{position: 'absolute', left: 30, right: 30, top: alto * 0.7, textAlign: 'center', fontFamily: familia.display, fontWeight: 850, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em', color: col('hueso', tema), textShadow: '0 4px 14px rgba(0,0,0,0.5)'}}>
          {pg.map((w, i) => {
            const activa = t >= w.inicio && (i === pg.length - 1 || t < pg[i + 1].inicio);
            const s = activa ? 1 + 0.12 * Math.exp(-(t - w.inicio) * 10) : 1;
            return (
              <React.Fragment key={i}>
                {i ? ' ' : ''}
                <span style={{display: 'inline-block', color: activa ? col('acento', tema) : undefined, transform: `scale(${s})`, opacity: t >= w.inicio ? 1 : 0}}>
                  {w.texto.replace(/[.,:;…]+$/g, '').toUpperCase()}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      );
  }
  const mudo = g.mudo as number | undefined;
  const eMudo = mudo !== undefined ? back(prog(t, mudo, 0.3), 2.2) : 0;
  const pantalla = col('panel', tema);
  return (
    <div style={{...abs(x, y, ancho, alto), transform: `translateY(${(1 - entrada) * 260}px) scale(${escala})`, opacity: (g.estatico ? 1 : clamp(lt / 0.12)) * (g.atenuar !== undefined ? 1 - 0.55 * prog(t, g.atenuar, 0.4) : 1)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 78, background: col('tinta', tema), boxShadow: '0 40px 90px rgba(12,12,14,0.3)'}} />
      <div style={{position: 'absolute', inset: 16, borderRadius: 64, background: `linear-gradient(180deg, ${pantalla}, ${col('tinta', tema)})`, overflow: 'hidden'}}>
        {/* persona hablando */}
        <div style={{position: 'absolute', left: '50%', top: alto * 0.24, width: 230, height: 230, marginLeft: -115, borderRadius: 115, background: col('gris', tema)}} />
        <div style={{position: 'absolute', left: '50%', top: alto * 0.24 + 150, width: boca * 2.2, height: boca, marginLeft: -boca * 1.1, borderRadius: boca, background: col('tinta', tema)}} />
        <div style={{position: 'absolute', left: '50%', top: alto * 0.24 + 260, width: 420, height: 400, marginLeft: -210, borderRadius: '210px 210px 40px 40px', background: col('gris', tema), opacity: 0.85}} />
        {pagina}
        {mudo !== undefined && t >= mudo ? (
          <svg width={120} height={120} viewBox="0 0 120 120" style={{position: 'absolute', right: 34, top: 40, transform: `scale(${eMudo})`}}>
            <circle cx={60} cy={60} r={56} fill={col('acento', tema)} />
            <path d="M30 48 h14 l18 -16 v56 l-18 -16 h-14 z" fill={col('hueso', tema)} />
            <path d="M72 46 l22 28 M94 46 l-22 28" stroke={col('hueso', tema)} strokeWidth={8} strokeLinecap="round" />
          </svg>
        ) : null}
      </div>
      <div style={{position: 'absolute', left: '50%', top: 34, width: 150, height: 34, marginLeft: -75, borderRadius: 17, background: col('tinta', tema)}} />
    </div>
  );
};

/** Cronómetro con el tiempo real que lleva el video: "llevas X segundos viendo". */
const Cronometro: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema, fps} = ctx;
  const {x = 540, y = 900, tam = 190} = g;
  const lt = t - g.en;
  const s = 1 + 0.3 * Math.exp(-lt * 10) * Math.cos(lt * 16);
  const seg = Math.floor(t);
  const fr = Math.floor((t - seg) * fps);
  const txt = `00:${String(seg).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
  return (
    <div style={{position: 'absolute', left: 0, width: ctx.W, top: y, transform: `translateY(-50%) scale(${s})`, textAlign: 'center', opacity: clamp(lt / 0.06)}}>
      {g.etiqueta ? (
        <div style={{fontFamily: familia.display, fontWeight: 800, fontSize: 44, letterSpacing: '-0.01em', color: ctx.tinta, marginBottom: 6}}>
          {g.etiqueta}
        </div>
      ) : null}
      <div style={{fontFamily: familia.mono, fontWeight: 700, fontSize: tam, letterSpacing: '-0.04em', color: col(g.color ?? 'acento', tema), fontVariantNumeric: 'tabular-nums'}}>{txt}</div>
    </div>
  );
};

/** Isotipo de CORTE: un disco cortado en diagonal. Las mitades entran, se juntan y se separan. */
const Logo: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 820, r = 170, sep = 34, angulo = -35} = g;
  const lt = t - g.en;
  const junta = spring(lt, 1.6, 6);
  let gap = (1 - junta) * 900;
  if (g.separa !== undefined && t >= g.separa) gap += sep * back(prog(t, g.separa, 0.35), 2.5);
  const [c1, c2] = (g.colores as string[] | undefined) ?? [ctx.tinta === tema.tinta ? 'tinta' : 'hueso', 'acento'];
  const media = (lado: 1 | -1, color: string) => (
    <g transform={`translate(${-lado * gap * 0.5 * Math.sin((angulo * Math.PI) / 180)} ${lado * gap * 0.5 * Math.cos((angulo * Math.PI) / 180)})`}>
      <path d={lado < 0 ? `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z` : `M ${r} 0 A ${r} ${r} 0 0 1 ${-r} 0 Z`} fill={col(color, tema)} />
    </g>
  );
  return (
    <Lienzo ctx={ctx} style={{opacity: clamp(lt / 0.1)}}>
      <g transform={`translate(${x} ${y}) rotate(${angulo})`}>
        {media(-1, c1)}
        {media(1, c2)}
      </g>
    </Lienzo>
  );
};

/** Caja de comentario: se escribe la palabra, se envía y queda publicada. */
const Comentario: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1180, ancho = 880, texto = 'Corte'} = g;
  const lt = t - g.en;
  const entra = back(prog(t, g.en, 0.35), 1.5);
  const escribe = (g.escribe as number | undefined) ?? g.en + 0.3;
  const envia = (g.envia as number | undefined) ?? escribe + 1;
  const n = t < escribe ? 0 : Math.min(texto.length, Math.floor((t - escribe) * 11) + 1);
  const enviado = t >= envia;
  const pe = enviado ? easeOut(prog(t, envia, 0.45), 3) : 0;
  const boton = enviado ? 1 + 0.3 * Math.exp(-(t - envia) * 12) * Math.cos((t - envia) * 20) : 1;
  const fondo = col(g.fondo ?? 'tinta', tema);
  const letra = col(g.letra ?? 'hueso', tema);
  const fila = (contenido: React.ReactNode, top: number, extra: React.CSSProperties = {}) => (
    <div style={{position: 'absolute', left: 0, width: ancho, top, height: 128, ...extra}}>
      <div style={{position: 'absolute', left: 0, top: 14, width: 100, height: 100, borderRadius: 50, background: col('acento', tema)}} />
      {contenido}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: x - ancho / 2, top: y, width: ancho, transform: `translateY(${(1 - entra) * 220}px)`, opacity: clamp(lt / 0.12)}}>
      {enviado
        ? fila(
            <div style={{position: 'absolute', left: 128, top: 0, right: 0}}>
              <div style={{fontFamily: familia.display, fontWeight: 800, fontSize: 30, color: col('gris', tema)}}>{g.autor ?? 'tú · ahora'}</div>
              <div style={{fontFamily: familia.display, fontWeight: 800, fontSize: 64, letterSpacing: '-0.03em', color: ctx.tinta}}>{texto}</div>
              <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', right: 10, top: 30, transform: `scale(${1 + 0.4 * Math.exp(-(t - envia - 0.5) * 8) * (t > envia + 0.5 ? 1 : 0)})`}}>
                <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.4 5c2 0 3.6 1.2 4.6 2.8C12 6.2 13.6 5 15.6 5 19 5 21 8.6 19.6 11.8 17.5 16.4 12 21 12 21z" fill={t > envia + 0.5 ? col('acento', tema) : 'none'} stroke={col('acento', tema)} strokeWidth={2} />
              </svg>
            </div>,
            -170 - (1 - pe) * -170,
            {opacity: pe},
          )
        : null}
      {fila(
        <div style={{position: 'absolute', left: 128, right: 0, top: 4, height: 120, borderRadius: 60, background: fondo, display: 'flex', alignItems: 'center', paddingLeft: 44, fontFamily: familia.display, fontWeight: 700, fontSize: 52, color: letra}}>
          {n === 0 || enviado ? <span style={{color: col('gris', tema), fontWeight: 600}}>{g.placeholder ?? 'Añade un comentario…'}</span> : texto.slice(0, n)}
          {!enviado && n > 0 ? <span style={{display: 'inline-block', width: 4, height: 56, marginLeft: 6, background: col('acento', tema), opacity: Math.floor(t * 2.5) % 2 ? 0 : 1}} /> : null}
          <div style={{position: 'absolute', right: 12, top: 12, width: 96, height: 96, borderRadius: 48, background: col('acento', tema), transform: `scale(${boton})`}}>
            <svg width={96} height={96} viewBox="0 0 96 96">
              <path d="M30 48 h34 M50 32 l16 16 l-16 16" stroke={col('hueso', tema)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>,
        0,
      )}
    </div>
  );
};

/** Sello de goma que cae con golpe ("GRATIS"). */
const Estampa: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1500, texto = 'GRATIS', rot = -10, tam = 120} = g;
  const lt = t - g.en;
  const e = easeIn(clamp(lt / 0.12), 2);
  const s = lt < 0.12 ? lerp(2.4, 1, e) : 1 + 0.06 * Math.exp(-(lt - 0.12) * 10) * Math.cos((lt - 0.12) * 30);
  const color = col(g.color ?? 'acento', tema);
  return (
    <div style={{position: 'absolute', left: 0, width: ctx.W, top: y, textAlign: 'center', transform: `translateY(-50%)`}}>
      <span
        style={{
          display: 'inline-block',
          border: `${tam * 0.09}px solid ${color}`,
          borderRadius: tam * 0.16,
          padding: `${tam * 0.06}px ${tam * 0.3}px ${tam * 0.02}px`,
          fontFamily: familia.display,
          fontWeight: 900,
          fontSize: tam,
          letterSpacing: '0.02em',
          color,
          transform: `rotate(${rot}deg) scale(${s})`,
          opacity: clamp(lt / 0.06),
        }}
      >
        {texto}
      </span>
    </div>
  );
};

/** Rebobinado: ◀◀, líneas de cinta y un temblor horizontal. */
const Rebobinar: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const hasta = (g.hasta as number | undefined) ?? g.en + 1.2;
  const op = Math.min(prog(t, g.en, 0.12), 1 - prog(t, hasta - 0.15, 0.15));
  if (op <= 0) return null;
  const color = col(g.color ?? ctx.tinta, tema);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      {Array.from({length: 7}, (_, i) => {
        const yy = ((i * 311 + (t - g.en) * 2600) % (ctx.H + 200)) - 100;
        return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: yy, height: 6 + (i % 3) * 8, background: color, opacity: 0.12 + (i % 2) * 0.1}} />;
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: g.y ?? 300, textAlign: 'center', fontFamily: familia.display, fontWeight: 900, fontSize: 150, letterSpacing: '-0.12em', color: col('acento', tema), transform: `translateX(${wobble(t * 4, 3) * 8}px)`}}>
        ◀◀
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: (g.y ?? 300) + 190, textAlign: 'center', fontFamily: familia.mono, fontWeight: 700, fontSize: 34, letterSpacing: '0.2em', color}}>
        {g.texto ?? 'REBOBINANDO'}
      </div>
    </div>
  );
};

/** Flecha dibujada a mano alzada de un punto a otro. */
const Flecha: React.FC<GProps> = ({g, ctx}) => {
  const {de = [300, 1300], a = [700, 900], curva = 0.3, dur = 0.45, grosor = 12} = g;
  const p = easeOut(prog(ctx.t, g.en, dur), 2);
  const [x0, y0] = de as number[];
  const [x1, y1] = a as number[];
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const cx = mx + (-(y1 - y0) / len) * curva * len;
  const cy = my + ((x1 - x0) / len) * curva * len;
  const d = `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;
  const L = len * (1 + curva * curva * 1.3);
  const ang = Math.atan2(y1 - cy, x1 - cx);
  const punta = 46;
  const color = col(g.color ?? 'acento', ctx.tema);
  const ph = clamp((p - 0.85) / 0.15);
  return (
    <Lienzo ctx={ctx}>
      <path d={d} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
      {ph > 0 ? (
        <path
          d={`M ${x1 - punta * ph * Math.cos(ang - 0.5)} ${y1 - punta * ph * Math.sin(ang - 0.5)} L ${x1} ${y1} L ${x1 - punta * ph * Math.cos(ang + 0.5)} ${y1 - punta * ph * Math.sin(ang + 0.5)}`}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Lienzo>
  );
};

export const GRAFICOS: Record<string, React.FC<GProps>> = {
  anillo: Anillo,
  caja: Caja,
  sello: Sello,
  segmentos: Segmentos,
  ondas: Ondas,
  feed: Feed,
  celular: Celular,
  cronometro: Cronometro,
  logo: Logo,
  comentario: Comentario,
  estampa: Estampa,
  rebobinar: Rebobinar,
  flecha: Flecha,
  ...GRAFICOS2,
};

export const Grafico: React.FC<GProps> = ({g, ctx}) => {
  const C = GRAFICOS[g.tipo];
  if (!C) throw new Error(`Gráfico desconocido: "${g.tipo}"`);
  if (ctx.t < g.en) return null;
  if (g.sale !== undefined && g.tipo !== 'sello' && ctx.t > g.sale + 0.25) return null;
  const q = g.sale !== undefined && g.tipo !== 'sello' ? easeOut(prog(ctx.t, g.sale, 0.25)) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - q, transform: q ? `scale(${1 - q * 0.08})` : undefined}}>
      <C g={g} ctx={ctx} />
    </div>
  );
};
