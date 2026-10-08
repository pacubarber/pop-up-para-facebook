import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../brand';
import {clamp, easeInOut, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, VoData} from '../lib/core';
import {Scene} from '../lib/Whip';
import voJson from '../../public/vo/saas.json';

// Promo horizontal para una app ficticia de reservas: "Flujo".
const vo = voJson as VoData;
const U = {
  violet: '#6C4DF6',
  violetSoft: '#EDE8FF',
  ink: '#12121A',
  ink2: '#1D1C28',
  gray: '#F4F4F8',
  line: '#E3E3EC',
  text: '#5B5B6E',
  mint: '#22B57A',
  coral: '#FF6B5B',
  white: '#FFFFFF',
};

const f = (s: number) => Math.round(s * 30);
const wordAt = (line: number, prefix: string) => f(vo.lines[line].words.find((w) => w.text.toLowerCase().startsWith(prefix))!.start);
const S2 = f(vo.lines[1].start) - 6;
const S3 = f(vo.lines[2].start) - 8;
const S4 = f(vo.lines[3].start) - 6;
export const SAAS_DURATION = f(vo.duration) + 45;
const REMIND_AT = wordAt(2, 'recordatorios');
const PAY_AT = wordAt(2, 'pagos');
const ZERO_AT = wordAt(2, 'cero');

const Cursor: React.FC<{x: number; y: number; down?: boolean}> = ({x, y, down}) => (
  <svg width="54" height="54" viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, transform: `scale(${down ? 0.85 : 1})`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'}}>
    <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L17.5 14 Z" fill={U.ink} stroke={U.white} strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const FlujoMark: React.FC<{size: number; color?: string}> = ({size, color = U.white}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect width="48" height="48" rx="14" fill={color === U.white ? U.violet : U.white} />
    <path d="M11 18 C 17 12, 23 24, 29 18 S 37 14, 38 16" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M10 30 C 16 24, 22 36, 28 30 S 36 26, 37 28" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// ---------------------------------------------------------------- gancho: caos de mensajes
const messages = [
  '¿Tienes hora el martes?',
  '¿Y a las 5? 🙏',
  'Perdón, hoy no llego',
  '¿Puedo pasar al jueves?',
  '¿Sigue libre el de las 10?',
  'Holaaa, ¿agenda para mañana?',
  '¿Cuánto era la sesión?',
  'Te escribo luego para confirmar',
];
export const MSG_TIMES = messages.map((_, i) => 6 + Math.round(i * 11 * Math.pow(0.93, i)));

const Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = frame > 80 ? Math.sin(frame * 2.3) * (frame - 80) * 0.25 : 0;
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <div style={{position: 'absolute', left: 140, top: 300, width: 760, color: U.white}}>
        <div style={{fontFamily: font.mono, fontSize: 26, letterSpacing: 6, color: U.coral, opacity: prog(frame, 0, 10)}}>12 MENSAJES SIN LEER</div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 112, lineHeight: 0.98, letterSpacing: -4, marginTop: 24, opacity: prog(frame, 4, 12), transform: `translateY(${(1 - prog(frame, 4, 16)) * 30}px)`}}>
          ¿Sigues agendando
          <br />
          <span style={{color: U.coral}}>una por una?</span>
        </div>
      </div>
      <div style={{position: 'absolute', right: 160, top: 90, width: 520, height: 900, borderRadius: 64, background: U.ink2, border: '10px solid #2B2A38', overflow: 'hidden', transform: `translateX(${shake}px)`}}>
        <div style={{height: 110, background: '#232232', display: 'flex', alignItems: 'center', gap: 18, padding: '30px 32px 0'}}>
          <div style={{width: 54, height: 54, borderRadius: '50%', background: U.violet}} />
          <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 28, color: U.white}}>Clientes</div>
        </div>
        <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'flex-end'}}>
          {messages.map((m, i) => {
            const at = MSG_TIMES[i];
            if (frame < at) return null;
            const s = interpolate(frame, [at, at + 6], [0.6, 1], {...clamp, easing: easeOut});
            const left = i % 3 !== 1;
            return (
              <div
                key={i}
                style={{
                  alignSelf: left ? 'flex-start' : 'flex-end',
                  maxWidth: '82%',
                  background: left ? '#2E2D3D' : U.violet,
                  color: U.white,
                  fontFamily: font.display,
                  fontWeight: 500,
                  fontSize: 30,
                  padding: '16px 22px',
                  borderRadius: 26,
                  transform: `scale(${s})`,
                  transformOrigin: left ? 'left bottom' : 'right bottom',
                  opacity: interpolate(frame, [at, at + 3], [0, 1], clamp),
                }}
              >
                {m}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- producto: reserva
const days = ['Lun 12', 'Mar 13', 'Mié 14', 'Jue 15', 'Vie 16'];
const hours = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00'];
const taken = new Set(['0-1', '1-0', '1-3', '2-2', '2-5', '4-0', '4-4', '0-4', '3-5']);
const PICK = {d: 3, h: 1};

const Booking: React.FC = () => {
  const frame = useCurrentFrame();
  // geometría de la grilla dentro de la ventana
  const gx = 135;
  const gy = 250;
  const cw = 226;
  const ch = 74;
  const target = {x: gx + PICK.d * cw + cw / 2, y: gy + 60 + PICK.h * ch + ch / 2};
  const move = prog(frame, 16, 26, easeInOut);
  const clickAt = 46;
  const cx = interpolate(move, [0, 1], [1300, target.x]);
  const cy = interpolate(move, [0, 1], [760, target.y]) + 4;
  const booked = frame >= clickAt + 3;
  const zoom = interpolate(frame, [8, 36, 62, 80], [1, 1.32, 1.32, 1], {...clamp, easing: easeInOut});
  const head = interpolate(frame, [0, 8, 14, 64, 76], [0, 1, 0, 0, 1], clamp);
  const toast = useSpring(clickAt + 6);
  const win = useSpring(0, {damping: 16});
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 30%, #2A2350 0%, ${U.ink} 70%)`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', zIndex: 2, top: 40, left: 0, right: 0, textAlign: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 64, color: U.white, letterSpacing: -2, opacity: head}}>
        Tus clientes <span style={{color: '#A996FF'}}>reservan solos.</span>
      </div>
      <div
        style={{
          width: 1400,
          height: 840,
          marginTop: 110,
          borderRadius: 26,
          background: U.white,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
          transform: `translateY(${(1 - win) * 120}px) scale(${zoom})`,
          transformOrigin: `${(target.x / 1400) * 100}% ${(target.y / 840) * 100}%`,
        }}
      >
        <div style={{height: 54, background: U.gray, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: `1px solid ${U.line}`}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 15, height: 15, borderRadius: '50%', background: c}} />
          ))}
          <div style={{marginLeft: 24, flex: 1, height: 32, borderRadius: 10, background: U.white, border: `1px solid ${U.line}`, fontFamily: font.mono, fontSize: 17, color: U.text, display: 'flex', alignItems: 'center', paddingLeft: 16}}>flujo.app/estudio-lumen</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '34px 120px 0'}}>
          <FlujoMark size={56} />
          <div>
            <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 38, color: U.ink}}>Estudio Lumen</div>
            <div style={{fontFamily: font.display, fontSize: 22, color: U.text}}>Elige un horario · Sesión de 45 min</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: gx, top: gy}}>
          <div style={{display: 'flex'}}>
            {days.map((d) => (
              <div key={d} style={{width: cw, height: 60, fontFamily: font.display, fontWeight: 700, fontSize: 24, color: U.ink, textAlign: 'center'}}>
                {d}
              </div>
            ))}
          </div>
          {hours.map((h, hi) => (
            <div key={h} style={{display: 'flex'}}>
              {days.map((_, di) => {
                const key = `${di}-${hi}`;
                const isPick = di === PICK.d && hi === PICK.h;
                const busy = taken.has(key);
                const pickedNow = isPick && booked;
                return (
                  <div key={key} style={{width: cw, height: ch, padding: 7}}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: font.display,
                        fontWeight: 700,
                        fontSize: 24,
                        background: pickedNow ? U.violet : busy ? U.gray : U.violetSoft,
                        color: pickedNow ? U.white : busy ? '#B5B5C3' : U.violet,
                        textDecoration: busy ? 'line-through' : undefined,
                        transform: isPick && frame >= clickAt && frame < clickAt + 6 ? 'scale(0.92)' : undefined,
                      }}
                    >
                      {pickedNow ? 'Reservado ✓' : h}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <Cursor x={cx} y={cy} down={frame >= clickAt && frame < clickAt + 5} />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 120,
          bottom: 80,
          background: U.white,
          borderRadius: 22,
          padding: '22px 28px',
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          transform: `translateY(${(1 - toast) * 160}px)`,
          opacity: toast,
        }}
      >
        <div style={{width: 52, height: 52, borderRadius: 16, background: U.mint, color: U.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, fontFamily: font.display}}>✓</div>
        <div>
          <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 26, color: U.ink}}>Nueva reserva · Jue 15, 10:00</div>
          <div style={{fontFamily: font.display, fontSize: 21, color: U.text}}>Ana M. reservó sin escribirte</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- funciones
const Card: React.FC<{at: number; children: React.ReactNode; title: string; tone: string}> = ({at, children, title, tone}) => {
  const s = useSpring(at, {damping: 13});
  return (
    <div style={{width: 500, height: 560, borderRadius: 36, background: U.white, padding: 44, boxShadow: '0 30px 80px rgba(18,18,26,0.12)', transform: `translateY(${(1 - s) * 140}px) rotate(${(1 - s) * 6}deg)`, opacity: s, display: 'flex', flexDirection: 'column'}}>
      <div style={{fontFamily: font.mono, fontSize: 20, letterSpacing: 4, color: tone}}>{title}</div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};

const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const local = (abs: number) => abs - S3;
  const pct = Math.round(interpolate(frame, [local(ZERO_AT), local(ZERO_AT) + 24], [23, 0], {...clamp, easing: easeOut}));
  const bell = Math.sin(Math.max(0, frame - local(REMIND_AT) - 6) * 0.9) * Math.exp(-Math.max(0, frame - local(REMIND_AT) - 6) / 12) * 18;
  const line = prog(frame, local(ZERO_AT), 26);
  return (
    <AbsoluteFill style={{background: U.gray, alignItems: 'center', justifyContent: 'center', gap: 48, flexDirection: 'row', paddingTop: 90}}>
      <div style={{position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 72, color: U.ink, letterSpacing: -3, opacity: prog(frame, 4, 12)}}>
        Todo pasa <span style={{color: U.violet}}>sin que escribas.</span>
      </div>
      <Card at={local(REMIND_AT)} title="RECORDATORIOS" tone={U.violet}>
        <div style={{fontSize: 90, transform: `rotate(${bell}deg)`, transformOrigin: '50% 10%', width: 'fit-content'}}>🔔</div>
        <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 40, color: U.ink, marginTop: 26, lineHeight: 1.1}}>Mañana 10:00 · Sesión con Ana</div>
        <div style={{display: 'flex', gap: 12, marginTop: 26}}>
          <div style={{background: U.violet, color: U.white, fontFamily: font.display, fontWeight: 700, fontSize: 24, padding: '12px 22px', borderRadius: 999}}>Confirmar</div>
          <div style={{background: U.gray, color: U.text, fontFamily: font.display, fontWeight: 700, fontSize: 24, padding: '12px 22px', borderRadius: 999}}>Mover</div>
        </div>
      </Card>
      <Card at={local(PAY_AT)} title="PAGO POR ADELANTADO" tone={U.mint}>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 120, color: U.ink, letterSpacing: -5}}>$25</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 10}}>
          <div style={{width: 40, height: 40, borderRadius: '50%', background: U.mint, color: U.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontFamily: font.display, fontSize: 24}}>✓</div>
          <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 32, color: U.mint}}>Pago recibido</div>
        </div>
        <div style={{fontFamily: font.display, fontSize: 24, color: U.text, marginTop: 18}}>Antes de la cita, no después.</div>
      </Card>
      <Card at={local(ZERO_AT) - 6} title="AUSENCIAS" tone={U.coral}>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 170, color: pct === 0 ? U.mint : U.coral, letterSpacing: -8, lineHeight: 1}}>{pct}%</div>
        <svg width="412" height="120" viewBox="0 0 412 120" style={{marginTop: 20}}>
          <polyline points="0,20 80,30 160,26 240,70 320,100 412,112" fill="none" stroke={U.mint} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="520" strokeDashoffset={520 * (1 - line)} />
        </svg>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cierre
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(0, {damping: 12});
  return (
    <AbsoluteFill style={{background: U.violet, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${0.85 + 0.15 * s})`, opacity: s}}>
        <FlujoMark size={170} color={U.violet} />
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 210, color: U.white, letterSpacing: -9}}>Flujo</div>
      </div>
      <div style={{fontFamily: font.display, fontWeight: 600, fontSize: 56, color: U.violetSoft, marginTop: 30, opacity: prog(frame, 14, 12)}}>Tu agenda, en piloto automático.</div>
      <div style={{marginTop: 50, background: U.white, color: U.violet, fontFamily: font.display, fontWeight: 800, fontSize: 36, padding: '22px 44px', borderRadius: 999, opacity: prog(frame, 30, 10), transform: `translateY(${(1 - prog(frame, 30, 14)) * 30}px)`}}>
        Prueba gratis 14 días · flujo.app
      </div>
    </AbsoluteFill>
  );
};

export const Saas: React.FC = () => (
  <AbsoluteFill style={{background: U.ink}}>
    <Scene from={0} to={S2} exit="up" name="Caos">
      <Chaos />
    </Scene>
    <Scene from={S2} to={S3} enter="up" exit="left" name="Reserva">
      <Booking />
    </Scene>
    <Scene from={S3} to={S4} enter="left" exit="left" name="Funciones">
      <Features />
    </Scene>
    <Scene from={S4} enter="left" name="Logo">
      <Outro />
    </Scene>
    <Flash at={S4 + 4} max={0.35} />
    <Grain opacity={0.035} />

    <Audio src={staticFile('vo/saas.wav')} />
    <Music name="tech_112" volume={0.55} duration={SAAS_DURATION} vo={vo} duck={0.5} fadeIn={20} delay={S2 - 36} />
    {MSG_TIMES.map((t, i) => (
      <Sfx key={i} name={i % 2 ? 'pop' : 'ding'} at={t} volume={i % 2 ? 0.35 : 0.18} />
    ))}
    <Sfx name="glitch" at={S2 - 6} volume={0.5} />
    <Sfx name="whoosh" at={S2 - 4} volume={0.4} />
    <Sfx name="click" at={S2 + 46} volume={0.8} />
    <Sfx name="ding" at={S2 + 52} volume={0.35} />
    <Sfx name="whoosh_short" at={S3} volume={0.4} />
    <Sfx name="pop" at={REMIND_AT} volume={0.45} />
    <Sfx name="cash" at={PAY_AT + 4} volume={0.35} />
    <Sfx name="pop" at={ZERO_AT} volume={0.45} />
    <Sfx name="impact" at={S4} volume={0.4} />
  </AbsoluteFill>
);
