// Más gráficos para videos de concurso / inmobiliaria (selector MYTH | FACT, casa, chips, precio, pared…).
import React from 'react';
import {familia} from './fuentes';
import type {Ctx} from './tipos';
import {back, clamp, col, easeIO, easeIn, easeOut, lerp, prog, spring} from './util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type G = Record<string, any>;
type GProps = {g: G; ctx: Ctx};

/** Selector de dos opciones (MYTH | FACT): salta de una a otra mientras adivinas y se fija en la respuesta. */
const Votacion: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1340, ancho = 860, alto = 150, paso = 0.2} = g;
  const decide = g.decide as number;
  const resp = g.respuesta === 'hecho' ? 1 : 0;
  const lt = t - g.en;
  const fijo = t >= decide;
  const k = fijo ? resp : Math.floor(lt / paso) % 2;
  const pop = fijo ? 1 + 0.16 * Math.exp(-(t - decide) * 9) * Math.cos((t - decide) * 18) : 1;
  const labels = [g.mito ?? 'MYTH', g.hecho ?? 'FACT'];
  const colors = [col('acento', tema), col('verde', tema)];
  const w2 = (ancho - 30) / 2;
  const entra = back(prog(t, g.en, 0.3), 2);
  return (
    <div style={{position: 'absolute', left: x - ancho / 2, top: y - alto / 2, width: ancho, height: alto, transform: `scale(${entra})`, opacity: clamp(lt / 0.08)}}>
      {[0, 1].map((i) => {
        const sel = i === k;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * (w2 + 30),
              top: 0,
              width: w2,
              height: alto,
              borderRadius: alto / 2,
              boxSizing: 'border-box',
              border: `7px solid ${colors[i]}`,
              background: sel ? colors[i] : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: familia.display,
              fontWeight: 900,
              fontSize: alto * 0.5,
              letterSpacing: '-0.02em',
              color: sel ? col('hueso', tema) : colors[i],
              opacity: fijo && i !== resp ? 0.22 : 1,
              transform: `scale(${sel ? (fijo ? pop : 1.05) : 1})`,
            }}
          >
            {labels[i]}
          </div>
        );
      })}
    </div>
  );
};

/** Cinco cartas boca abajo con "?"; una se voltea y es la verdadera. */
const Tarjetas: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {y = 1150, n = 5, ancho = 160, alto = 230, gap = 26, buena = 2} = g;
  const total = n * ancho + (n - 1) * gap;
  const x0 = 540 - total / 2;
  const brilla = g.brilla as number | undefined;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const lt = t - (g.en + i * 0.07);
        if (lt < 0) return null;
        const s = back(prog(lt, 0, 0.35), 2);
        const flip = brilla !== undefined && i === buena ? prog(t, brilla, 0.3) : 0;
        const sx = flip > 0 && flip < 1 ? Math.abs(Math.cos(Math.PI * flip)) : 1;
        const cara = flip >= 0.5;
        const apagada = brilla !== undefined && i !== buena && t >= brilla ? 0.3 : 1;
        const flota = Math.sin(t * 2.4 + i) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x0 + i * (ancho + gap),
              top: y - alto / 2 + flota,
              width: ancho,
              height: alto,
              borderRadius: 24,
              background: cara ? col('verde', tema) : col('panel', tema),
              border: `5px solid ${cara ? col('verde', tema) : col('linea', tema)}`,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: familia.display,
              fontWeight: 900,
              fontSize: cara ? 52 : 120,
              color: cara ? col('hueso', tema) : col('acento', tema),
              transform: `scale(${s}) scaleX(${sx}) translateY(${cara ? -24 * spring(t - brilla! - 0.15, 2.4, 6) : 0}px)`,
              opacity: apagada,
              boxShadow: cara ? `0 0 60px ${col('verde', tema)}` : '0 20px 40px rgba(0,0,0,0.35)',
            }}
          >
            {cara ? 'TRUE' : '?'}
          </div>
        );
      })}
    </>
  );
};

/** Casa: sólida, en plano (se dibuja y parpadea como si aún no existiera), con pin, que intenta moverse… */
const Casa: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1000, tam = 460, modo = 'solido'} = g;
  const lt = t - g.en;
  const entra = modo === 'plano' ? 1 : back(prog(t, g.en, 0.35), 1.8);
  const color = col(g.color ?? (modo === 'plano' ? 'cielo' : 'tinta'), tema);
  const relleno = col(g.relleno ?? 'hueso', tema);
  const plano = modo === 'plano';
  const dib = plano ? easeIO(prog(t, g.en, g.dibuja ?? 1.2)) : 1;
  const fantasma = g.fantasma !== undefined && t >= g.fantasma ? 0.35 + 0.65 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.7)) : 1;
  let dx = 0;
  let cruz = 0;
  if (g.mover !== undefined && t >= g.mover) {
    const q = t - g.mover;
    dx = 26 * Math.sin(q * 38) * Math.exp(-q * 3);
    cruz = easeOut(prog(q, 0.35, 0.25));
  }
  const brillo = g.remodela !== undefined && t >= g.remodela ? prog(t, g.remodela, 0.3) : 0;
  const L = 1400;
  const trazo = (d: string, k = 0) => (
    <path
      d={d}
      fill={plano ? 'none' : relleno}
      stroke={color}
      strokeWidth={plano ? 3.2 : 6}
      strokeLinejoin="round"
      strokeDasharray={plano ? `${L}` : undefined}
      strokeDashoffset={plano ? L * (1 - clamp(dib * 1.4 - k * 0.12)) : undefined}
    />
  );
  return (
    <div style={{position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, transform: `translateX(${dx}px) scale(${entra})`, opacity: clamp(lt / 0.1) * fantasma}}>
      <svg width={tam} height={tam} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
        {plano
          ? Array.from({length: 11}, (_, i) => (
              <g key={i} opacity={0.18 * dib}>
                <line x1={i * 20} y1={0} x2={i * 20} y2={200} stroke={color} strokeWidth={0.8} />
                <line x1={0} y1={i * 20} x2={200} y2={i * 20} stroke={color} strokeWidth={0.8} />
              </g>
            ))
          : null}
        {trazo('M 130 66 L 130 40 L 148 40 L 148 80 Z', 3)}
        {trazo('M 38 95 L 38 185 L 162 185 L 162 95', 0)}
        {trazo('M 18 100 L 100 26 L 182 100 Z', 1)}
        {trazo('M 88 130 L 112 130 L 112 185 L 88 185 Z', 2)}
        <rect x={50} y={112} width={28} height={28} rx={3} fill={brillo > 0 ? col('oro', tema) : plano ? 'none' : col('cielo', tema)} stroke={color} strokeWidth={plano ? 3 : 5} opacity={plano ? clamp(dib * 1.4 - 0.4) : 1} />
        <rect x={122} y={112} width={28} height={28} rx={3} fill={plano ? 'none' : col('cielo', tema)} stroke={color} strokeWidth={plano ? 3 : 5} opacity={plano ? clamp(dib * 1.4 - 0.5) : 1} />
        {plano && dib > 0.6 ? (
          <text x={100} y={198} textAnchor="middle" fontFamily={familia.display} fontWeight={800} fontSize={12} fill={color} opacity={(dib - 0.6) / 0.4}>
            NOT BUILT YET
          </text>
        ) : null}
        {brillo > 0
          ? [0, 1, 2].map((i) => {
              const a = (t * 2 + i * 2.1) % (Math.PI * 2);
              const sx = 64 + Math.cos(a) * 30;
              const sy = 126 + Math.sin(a) * 26;
              const s = 6 + 3 * Math.sin(t * 9 + i);
              return <path key={i} d={`M ${sx} ${sy - s} L ${sx + s * 0.35} ${sy - s * 0.35} L ${sx + s} ${sy} L ${sx + s * 0.35} ${sy + s * 0.35} L ${sx} ${sy + s} L ${sx - s * 0.35} ${sy + s * 0.35} L ${sx - s} ${sy} L ${sx - s * 0.35} ${sy - s * 0.35} Z`} fill={col('oro', tema)} opacity={brillo} />;
            })
          : null}
        {g.pin !== undefined && t >= g.pin ? (
          <g transform={`translate(100 ${lerp(-140, 0, spring(t - g.pin, 1.8, 6))})`}>
            <ellipse cx={0} cy={192} rx={34 * clamp(spring(t - g.pin, 1.8, 6))} ry={6} fill="#000" opacity={0.25} />
            <path d="M 0 22 C -26 -8 -26 -40 0 -46 C 26 -40 26 -8 0 22 Z" transform="translate(0 -28)" fill={col('acento', tema)} />
            <circle cx={0} cy={-62} r={9} fill={col('hueso', tema)} />
          </g>
        ) : null}
        {cruz > 0 ? (
          <g stroke={col('acento', tema)} strokeWidth={14} strokeLinecap="round" opacity={cruz}>
            <line x1={60 - 20 * (1 - cruz)} y1={60} x2={140} y2={140} />
            <line x1={140} y1={60} x2={60} y2={140} />
          </g>
        ) : null}
      </svg>
      {g.mover !== undefined && t >= g.mover - 0.3
        ? [-1, 1].map((lado) => {
            const q = prog(t, g.mover - 0.3, 0.3);
            return (
              <svg key={lado} width={160} height={120} viewBox="0 0 160 120" style={{position: 'absolute', top: tam * 0.45, left: lado < 0 ? -190 : tam + 30, opacity: q * (1 - cruz * 0.6), transform: `scaleX(${lado < 0 ? -1 : 1}) translateX(${(1 - q) * 40}px)`}}>
                <path d="M 10 60 L 110 60 M 80 25 L 120 60 L 80 95" stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          })
        : null}
    </div>
  );
};

/** Lista de pastillas que entran una a una (con ícono) y pueden salir volando. */
const Chips: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1000, gap = 130, tam = 64, alinear = 'centro'} = g;
  const items = g.items as {texto: string; en: number; color?: string; icono?: string}[];
  const y0 = y - ((items.length - 1) * gap) / 2;
  return (
    <>
      {items.map((it, i) => {
        const lt = t - it.en;
        if (lt < 0) return null;
        const e = back(prog(lt, 0, 0.3), 1.8);
        const vuela = g.vuela !== undefined ? easeIn(prog(t, g.vuela + i * 0.08, 0.45), 2) : 0;
        const fondo = col(it.color ?? 'tinta', tema);
        const icono =
          it.icono === 'ok' ? '✓' : it.icono === 'x' ? '✕' : it.icono === '$' ? '$' : it.icono === 'alerta' ? '!' : null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: alinear === 'izq' ? x : 0,
              width: alinear === 'izq' ? undefined : ctx.W,
              top: y0 + i * gap,
              transform: `translateY(-50%) translate(${(1 - e) * -120 + vuela * 300}px, ${-vuela * 700}px) rotate(${vuela * 18}deg)`,
              textAlign: 'center',
              opacity: clamp(lt / 0.08) * (1 - vuela),
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: tam * 0.3,
                padding: `${tam * 0.22}px ${tam * 0.5}px`,
                borderRadius: tam,
                background: fondo,
                fontFamily: familia.display,
                fontWeight: 900,
                fontSize: tam,
                letterSpacing: '-0.02em',
                color: col(it.color === 'hueso' ? 'tinta' : 'hueso', tema),
                boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
              }}
            >
              {icono ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: tam * 1.05,
                    height: tam * 1.05,
                    borderRadius: tam,
                    background: col(it.icono === 'ok' ? 'verde' : it.icono === '$' || it.icono === 'alerta' ? 'oro' : 'acento', tema),
                    color: col('tinta', tema),
                    fontSize: tam * 0.7,
                  }}
                >
                  {icono}
                </span>
              ) : null}
              {it.texto}
            </span>
          </div>
        );
      })}
    </>
  );
};

/** Etiqueta de precio que cuelga y se balancea; el monto se tacha. */
const Precio: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 760, tam = 1} = g;
  const lt = t - g.en;
  const caida = spring(lt, 1.6, 4.5);
  const rot = 14 * Math.sin(lt * 4.2) * Math.exp(-lt * 1.6);
  const tacha = g.tachar !== undefined ? easeOut(prog(t, g.tachar, 0.25)) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y - 360, transform: `translateY(${(1 - caida) * -500}px) rotate(${rot}deg) scale(${tam})`, transformOrigin: '0 0', opacity: 1}}>
      <div style={{position: 'absolute', left: -2, top: 0, width: 4, height: 150, background: col('gris', tema)}} />
      <div
        style={{
          position: 'absolute',
          left: -260,
          top: 150,
          width: 520,
          height: 300,
          background: col('oro', tema),
          clipPath: 'polygon(18% 0, 82% 0, 100% 22%, 100% 100%, 0 100%, 0 22%)',
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 36,
          boxSizing: 'border-box',
        }}
      >
        <div style={{position: 'absolute', top: 26, left: 240, width: 40, height: 40, borderRadius: 20, background: col('tinta', tema)}} />
        <div style={{fontFamily: familia.display, fontWeight: 900, fontSize: 44, letterSpacing: '0.02em', color: col('tinta', tema)}}>{g.texto ?? 'ASKING PRICE'}</div>
        <div style={{position: 'relative', fontFamily: familia.display, fontWeight: 900, fontSize: 118, letterSpacing: '-0.04em', color: col('tinta', tema), lineHeight: 1}}>
          {g.monto ?? '$$$$'}
          <div style={{position: 'absolute', left: -14, top: '50%', height: 14, width: `calc(${tacha * 100}% + 28px)`, background: col('acento', tema), transform: 'rotate(-8deg)', transformOrigin: 'left center'}} />
        </div>
      </div>
    </div>
  );
};

/** Pared recién pintada (el rodillo baja) que al raspar muestra manchas de humedad. */
const Pared: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 960, ancho = 760, alto = 760} = g;
  const lt = t - g.en;
  const pinta = easeIO(prog(t, g.en + 0.1, g.pinta ?? 0.9));
  const rev = g.revela !== undefined ? easeOut(prog(t, g.revela, 0.6), 2) : 0;
  const entra = back(prog(t, g.en, 0.3), 1.6);
  const manchas = [
    [0.32, 0.62, 0.22],
    [0.55, 0.7, 0.28],
    [0.7, 0.5, 0.16],
    [0.42, 0.42, 0.13],
    [0.6, 0.86, 0.2],
  ];
  const rx = x - ancho / 2;
  const ry = y - alto / 2;
  return (
    <div style={{position: 'absolute', left: rx, top: ry, width: ancho, height: alto, transform: `scale(${entra})`, opacity: clamp(lt / 0.1)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden', background: col('papel', tema), boxShadow: '0 30px 70px rgba(0,0,0,0.3)'}}>
        {/* humedad (debajo) */}
        {manchas.map(([mx, my, mr], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: mx * ancho - mr * ancho,
              top: my * alto - mr * alto,
              width: mr * 2 * ancho,
              height: mr * 2 * alto * (1.1 + 0.2 * Math.sin(i)),
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(78,92,62,0.75) 0%, rgba(110,104,70,0.55) 45%, rgba(120,110,80,0) 72%)',
            }}
          />
        ))}
        {/* pintura fresca encima, raspada en el centro al revelar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: `${pinta * 100}%`,
            background: col('hueso', tema),
            WebkitMaskImage: rev > 0 ? `radial-gradient(circle at 50% 62%, transparent ${rev * 46}%, black ${rev * 46 + 6}%)` : undefined,
            maskImage: rev > 0 ? `radial-gradient(circle at 50% 62%, transparent ${rev * 46}%, black ${rev * 46 + 6}%)` : undefined,
          }}
        />
        {/* gotas */}
        {rev > 0.3
          ? Array.from({length: 6}, (_, i) => {
              const ph = (t * 0.7 + i * 0.29) % 1;
              return <div key={i} style={{position: 'absolute', left: ancho * (0.3 + i * 0.08), top: alto * (0.4 + ph * 0.5), width: 16, height: 24, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: col('cielo', tema), opacity: (1 - ph) * 0.9}} />;
            })
          : null}
      </div>
      {/* rodillo */}
      {pinta < 1 ? (
        <div style={{position: 'absolute', left: ancho / 2 - 200, top: pinta * alto - 40, width: 400, height: 70, borderRadius: 35, background: col('hueso', tema), border: `6px solid ${col('tinta', tema)}`, boxSizing: 'border-box'}}>
          <div style={{position: 'absolute', left: 190, top: 60, width: 10, height: 140, background: col('tinta', tema)}} />
        </div>
      ) : null}
    </div>
  );
};

/** Miniatura de otro video (para "we made a whole video about it"). */
const TarjetaVideo: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1000, ancho = 340} = g;
  const alto = ancho * 16 / 9;
  const lt = t - g.en;
  const e = spring(lt, 1.8, 6);
  return (
    <div style={{position: 'absolute', left: x - ancho / 2, top: y - alto / 2, width: ancho, height: alto, transform: `translateX(${(1 - e) * 700}px) rotate(${lerp(14, -4, clamp(e))}deg)`, opacity: clamp(lt / 0.1)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 32, background: col('tinta', tema), border: `6px solid ${col('hueso', tema)}`, boxShadow: '0 30px 70px rgba(0,0,0,0.4)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 60, width: '100%', textAlign: 'center', fontSize: 46, color: col('acento', tema)}}>⚑ ⚑ ⚑ ⚑ ⚑</div>
        <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', fontFamily: familia.display, fontWeight: 900, fontSize: 150, lineHeight: 0.9, color: col('acento', tema)}}>5</div>
        <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', fontFamily: familia.display, fontWeight: 900, fontSize: 52, lineHeight: 1, color: col('hueso', tema)}}>
          {g.titulo ?? 'RED FLAGS'}
        </div>
        <div style={{position: 'absolute', left: ancho / 2 - 50, top: alto - 170, width: 100, height: 100, borderRadius: 50, background: col('hueso', tema)}}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <path d="M 40 30 L 72 50 L 40 70 Z" fill={col('tinta', tema)} />
          </svg>
        </div>
      </div>
    </div>
  );
};

/** Botón (FOLLOW) que se pulsa y cambia a FOLLOWING ✓. */
const Boton: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 1400, tam = 70} = g;
  const lt = t - g.en;
  const entra = back(prog(t, g.en, 0.3), 2);
  const pulsado = g.pulsa !== undefined && t >= g.pulsa;
  const q = pulsado ? t - g.pulsa : 0;
  const s = pulsado ? 1 - 0.12 * Math.exp(-q * 10) * Math.cos(q * 20) : 1;
  return (
    <div style={{position: 'absolute', left: 0, width: ctx.W, top: y, textAlign: 'center', transform: `translateY(-50%) scale(${entra * s})`, opacity: clamp(lt / 0.08)}}>
      <span
        style={{
          display: 'inline-block',
          padding: `${tam * 0.3}px ${tam * 0.9}px`,
          borderRadius: tam,
          background: pulsado ? col('hueso', tema) : col('acento', tema),
          color: pulsado ? col('tinta', tema) : col('hueso', tema),
          fontFamily: familia.display,
          fontWeight: 900,
          fontSize: tam,
          letterSpacing: '-0.01em',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        }}
      >
        {pulsado ? (g.despues ?? 'FOLLOWING ✓') : (g.texto ?? 'FOLLOW')}
      </span>
    </div>
  );
};

/** Logo de la inmobiliaria (marca ficticia): casa con ojo de cerradura + nombre. */
const LogoCasa: React.FC<GProps> = ({g, ctx}) => {
  const {t, tema} = ctx;
  const {x = 540, y = 900, tam = 1} = g;
  const lt = t - g.en;
  const e = back(prog(t, g.en, 0.4), 1.8);
  const blanco = col(g.color ?? 'hueso', tema);
  return (
    <div style={{position: 'absolute', left: 0, width: ctx.W, top: y, textAlign: 'center', transform: `translateY(-50%) scale(${e * tam})`, opacity: clamp(lt / 0.1)}}>
      <svg width={180} height={170} viewBox="0 0 180 170">
        <path d="M 10 80 L 90 10 L 170 80 L 146 80 L 146 160 L 34 160 L 34 80 Z" fill={blanco} />
        <circle cx={90} cy={100} r={17} fill={col('acento', tema)} />
        <path d="M 80 104 L 100 104 L 106 142 L 74 142 Z" fill={col('acento', tema)} />
      </svg>
      <div style={{fontFamily: familia.display, fontWeight: 900, fontSize: 110, letterSpacing: '-0.04em', color: blanco, lineHeight: 1, marginTop: 10}}>{g.nombre ?? 'KEYLINE'}</div>
      <div style={{fontFamily: familia.display, fontWeight: 800, fontSize: 46, letterSpacing: '0.3em', color: blanco, marginTop: 8, paddingLeft: '0.3em'}}>{g.sub ?? 'HOMES'}</div>
    </div>
  );
};

export const GRAFICOS2: Record<string, React.FC<GProps>> = {
  votacion: Votacion,
  tarjetas: Tarjetas,
  casa: Casa,
  chips: Chips,
  precio: Precio,
  pared: Pared,
  tarjetaVideo: TarjetaVideo,
  boton: Boton,
  logoCasa: LogoCasa,
};

