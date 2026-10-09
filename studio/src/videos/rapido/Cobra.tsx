import React from 'react';
import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {font} from '../../brand';
import {clamp, easeInOut, easeOut, Flash, Grain, Music, prog, Sfx, useSpring, type VoData} from '../../lib/core';
import {Scene} from '../../lib/Whip';
import {Shake} from '../../lib/kit/Fx';
import {Icon} from '../../lib/kit/Graphics';
import {Count, Reveal, Slam} from '../../lib/kit/Type';
import {fr, voTimeline} from '../../lib/kit/timeline';
import voJson from '../../../public/voz/cobra.json';

// Video de marca para un SaaS ficticio de facturación y cobros: "Cobra".
const vo = voJson as VoData;
const t = voTimeline(vo);
const U = {
  ink: '#0B0F0E',
  ink2: '#151B19',
  line: '#26302C',
  green: '#00D084',
  mint: '#B6F5D8',
  paper: '#F5F7F4',
  gray: '#8A948F',
  red: '#FF5A5F',
  amber: '#FFB020',
  wa: '#25D366',
};

// tech_122: el último compás (10 × 1,967 s) cierra el video justo después de "cobra hoy".
const FINAL = fr(10 * 1.967);
export const COBRA_DURATION = FINAL + 36;

const S = {
  hook: 0,
  total: t.w(0, 'clientes') - 2,
  logo: t.ls(1),
  crear: t.w(1, 'creas') - 3,
  chase: t.ls(2),
  remind: t.w(2, 'con') - 3,
  wa: t.w(2, 'por', 1) - 3,
  pay: t.ls(3),
  money: t.w(3, 'y') - 2,
  end: t.ls(4),
};

// ---------------------------------------------------------------- piezas de interfaz
export const CobraMark: React.FC<{size: number; draw?: number}> = ({size, draw = 1}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" rx="28" fill={U.green} />
    <path d="M70 32 A26 26 0 1 0 70 68" fill="none" stroke={U.ink} strokeWidth="13" strokeLinecap="round" strokeDasharray="130" strokeDashoffset={130 * (1 - draw)} />
    <circle cx="71" cy="31" r="7.5" fill={U.ink} opacity={draw > 0.95 ? 1 : 0} />
  </svg>
);

const Phone: React.FC<{children: React.ReactNode; style?: React.CSSProperties; light?: boolean}> = ({children, style, light}) => (
  <div style={{position: 'absolute', width: 640, height: 1240, borderRadius: 80, background: light ? U.paper : U.ink2, border: `14px solid ${light ? '#D9DED9' : '#2A3330'}`, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.45)', ...style}}>
    <div style={{position: 'absolute', top: 18, left: '50%', marginLeft: -70, width: 140, height: 34, borderRadius: 20, background: light ? '#D9DED9' : '#000'}} />
    {children}
  </div>
);

const Row: React.FC<{name: string; amount: string; days: number; style?: React.CSSProperties}> = ({name, amount, days, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '26px 30px', borderBottom: `2px solid ${U.line}`, ...style}}>
    <div style={{width: 64, height: 64, borderRadius: 18, background: '#1F2926', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 800, fontSize: 28, color: U.mint}}>{name[0]}</div>
    <div style={{flex: 1}}>
      <div style={{fontFamily: font.display, fontWeight: 700, fontSize: 32, color: U.paper}}>{name}</div>
      <div style={{fontFamily: font.mono, fontSize: 22, color: U.red, marginTop: 4}}>VENCIDA · {days} DÍAS</div>
    </div>
    <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 36, color: U.paper}}>{amount}</div>
  </div>
);

const Cursor: React.FC<{x: number; y: number; down?: boolean}> = ({x, y, down}) => (
  <svg width="70" height="70" viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, transform: `scale(${down ? 0.85 : 1})`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))'}}>
    <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L17.5 14 Z" fill={U.paper} stroke={U.ink} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const typed = (text: string, frame: number, at: number, speed = 1.6) => text.slice(0, Math.max(0, Math.floor((frame - at) * speed)));

// ---------------------------------------------------------------- escenas
const DEBTS = [
  ['Estudio Nómada', '$1.200', 12],
  ['Café Ruta', '$850', 30],
  ['Clínica Sonríe', '$1.400', 21],
  ['Iron Club', '$600', 9],
  ['Panadería Sol', '$800', 45],
] as const;

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <Phone style={{left: 220, top: 640, transform: `translateY(${(1 - prog(frame, 0, 10)) * 600}px) rotate(-4deg)`}}>
        <div style={{padding: '90px 30px 20px', fontFamily: font.display, fontWeight: 800, fontSize: 44, color: U.paper}}>Por cobrar</div>
        {DEBTS.map(([n, a, d], i) => {
          const s = interpolate(frame, [4 + i * 5, 10 + i * 5], [0, 1], {...clamp, easing: easeOut});
          return <Row key={n} name={n} amount={a} days={d} style={{transform: `translateX(${(1 - s) * 700}px)`, opacity: s}} />;
        })}
      </Phone>
    </AbsoluteFill>
  );
};

const Total: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #3A1416 0%, ${U.ink} 70%)`}} />
);

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useSpring(0, {damping: 11, stiffness: 160});
  return (
    <AbsoluteFill style={{background: U.green, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${0.7 + 0.3 * s})`}}>
        <div style={{borderRadius: 60, boxShadow: '0 30px 60px rgba(0,0,0,0.2)', overflow: 'hidden', lineHeight: 0}}>
          <svg width={230} height={230} viewBox="0 0 100 100">
            <rect width="100" height="100" rx="28" fill={U.ink} />
            <path d="M70 32 A26 26 0 1 0 70 68" fill="none" stroke={U.green} strokeWidth="13" strokeLinecap="round" strokeDasharray="130" strokeDashoffset={130 * (1 - prog(frame, 2, 14))} />
            <circle cx="71" cy="31" r="7.5" fill={U.green} opacity={prog(frame, 14, 4)} />
          </svg>
        </div>
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 210, letterSpacing: -9, color: U.ink, clipPath: `inset(0 ${(1 - prog(frame, 4, 12)) * 100}% 0 0)`}}>Cobra</div>
      </div>
    </AbsoluteFill>
  );
};

const Crear: React.FC<{sendAt: number; tenAt: number}> = ({sendAt, tenAt}) => {
  const frame = useCurrentFrame();
  const card = useSpring(0, {damping: 14});
  const cx = interpolate(frame, [sendAt - 12, sendAt - 2], [900, 620], {...clamp, easing: easeInOut});
  const cy = interpolate(frame, [sendAt - 12, sendAt - 2], [1600, 1295], {...clamp, easing: easeInOut});
  const sent = frame >= sendAt + 2;
  const toast = spring({frame: frame - sendAt - 4, fps: 30, config: {damping: 12, stiffness: 200}});
  const ring = interpolate(frame, [0, tenAt + 6], [0, 1], {...clamp, easing: easeOut});
  const secs = Math.min(10, Math.round(ring * 10));
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <div style={{position: 'absolute', left: 110, right: 110, top: 640, borderRadius: 40, background: U.paper, padding: 50, transform: `translateY(${(1 - card) * 900}px)`, boxShadow: '0 50px 100px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: font.mono, fontSize: 26, letterSpacing: 4, color: U.gray}}>NUEVA FACTURA · #0142</div>
        {[
          ['Cliente', 'Estudio Nómada', 0],
          ['Concepto', 'Sesión de fotos', 6],
          ['Monto', '$1.200', 12],
        ].map(([label, value, at]) => (
          <div key={label as string} style={{marginTop: 34}}>
            <div style={{fontFamily: font.display, fontWeight: 600, fontSize: 26, color: U.gray}}>{label}</div>
            <div style={{marginTop: 8, height: 84, borderRadius: 18, border: `3px solid ${frame >= (at as number) && frame < (at as number) + 10 ? U.green : '#DDE2DE'}`, display: 'flex', alignItems: 'center', padding: '0 24px', fontFamily: font.display, fontWeight: 700, fontSize: 40, color: U.ink}}>
              {typed(value as string, frame, at as number, 2.2)}
            </div>
          </div>
        ))}
        <div style={{marginTop: 44, height: 110, borderRadius: 999, background: sent ? U.ink : U.green, color: sent ? U.green : U.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: font.display, fontWeight: 900, fontSize: 46, transform: `scale(${frame >= sendAt && frame < sendAt + 5 ? 0.95 : 1})`}}>
          {sent ? <Icon name="check" size={52} color={U.green} stroke={3} /> : null}
          {sent ? 'Enviada' : 'Enviar factura'}
        </div>
      </div>
      <Cursor x={cx} y={cy} down={frame >= sendAt && frame < sendAt + 5} />
      {/* cronómetro de 10 segundos */}
      <div style={{position: 'absolute', left: 425, top: 1500, width: 230, height: 230, transform: `scale(${toast})`}}>
        <svg width={230} height={230} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill={U.ink2} stroke={U.line} strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={U.green} strokeWidth="6" strokeDasharray="276.5" strokeDashoffset={276.5 * (1 - ring)} transform="rotate(-90 50 50)" strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 70, color: U.paper}}>{secs}s</div>
      </div>
    </AbsoluteFill>
  );
};

const Chase: React.FC = () => {
  const frame = useCurrentFrame();
  const path = (p: number) => ({x: 120 + p * 840, y: 1180 + Math.sin(p * Math.PI * 3) * 160});
  const coinP = interpolate(frame, [0, 46], [0.25, 1.05], {...clamp, easing: easeOut});
  const snakeP = interpolate(frame, [0, 46], [0, 0.98], {...clamp, easing: easeInOut});
  const caught = snakeP >= 0.9;
  const pts = new Array(26).fill(0).map((_, i) => path(Math.max(0, snakeP - i * 0.012)));
  const coin = path(Math.min(coinP, 0.98));
  const head = pts[0];
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path d={'M' + new Array(60).fill(0).map((_, i) => `${path(i / 59).x} ${path(i / 59).y}`).join(' L')} stroke={U.line} strokeWidth="6" fill="none" strokeDasharray="4 18" />
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} stroke={U.green} strokeWidth="44" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={head.x} cy={head.y} r="34" fill={U.green} />
        <circle cx={head.x + 12} cy={head.y - 10} r="6" fill={U.ink} />
      </svg>
      <div style={{position: 'absolute', left: coin.x - 70, top: coin.y - 70, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, #FFE18A, ${U.amber})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 70, color: '#7A4A00', transform: `scale(${caught ? 1.25 : 1})`, boxShadow: caught ? `0 0 60px ${U.amber}` : '0 10px 30px rgba(0,0,0,0.5)'}}>
        $
      </div>
    </AbsoluteFill>
  );
};

const Remind: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = [
    ['DÍA 1', 'Factura enviada'],
    ['DÍA 3', 'Recordatorio amable'],
    ['DÍA 7', 'Último aviso'],
  ];
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <div style={{position: 'absolute', left: 190, top: 760, width: 8, height: 760 * prog(frame, 0, 26), background: U.green, borderRadius: 4}} />
      {steps.map(([d, label], i) => {
        const at = 4 + i * 9;
        const s = spring({frame: frame - at, fps: 30, config: {damping: 11, stiffness: 240}});
        return (
          <div key={d} style={{position: 'absolute', left: 140, top: 720 + i * 300, display: 'flex', alignItems: 'center', gap: 40, opacity: frame >= at ? 1 : 0}}>
            <div style={{width: 110, height: 110, borderRadius: '50%', background: U.green, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`}}>
              <Icon name="check" size={60} color={U.ink} stroke={3} />
            </div>
            <div style={{transform: `translateX(${(1 - s) * 80}px)`}}>
              <div style={{fontFamily: font.mono, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: U.green}}>{d}</div>
              <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 56, color: U.paper}}>{label}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Whatsapp: React.FC<{mailAt: number}> = ({mailAt}) => {
  const frame = useCurrentFrame();
  const msg = 'Hola Ana 👋 Tu factura #0142 por $1.200 vence hoy. Págala en un clic: cobra.app/f/0142';
  const bub = spring({frame: frame - 2, fps: 30, config: {damping: 12, stiffness: 220}});
  const mail = spring({frame: frame - mailAt, fps: 30, config: {damping: 12, stiffness: 200}});
  return (
    <AbsoluteFill style={{background: '#0E1A15'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: '#13261E'}} />
      <div style={{position: 'absolute', left: 90, top: 640, maxWidth: 820, background: '#1E3A2E', borderRadius: '40px 40px 40px 8px', padding: '40px 46px', transform: `scale(${bub})`, transformOrigin: 'left bottom', fontFamily: font.display, fontWeight: 600, fontSize: 48, lineHeight: 1.25, color: U.paper, boxShadow: '0 30px 60px rgba(0,0,0,0.4)'}}>
        {typed(msg, frame, 4, 3.4)}
        <div style={{fontFamily: font.mono, fontSize: 24, color: U.mint, marginTop: 14, textAlign: 'right'}}>Cobra · automático ✓✓</div>
      </div>
      <div style={{position: 'absolute', left: 90, right: 90, top: 1260, borderRadius: 34, background: U.paper, padding: '34px 40px', display: 'flex', gap: 28, alignItems: 'center', transform: `translateY(${(1 - mail) * 700}px)`, boxShadow: '0 30px 60px rgba(0,0,0,0.4)'}}>
        <div style={{width: 96, height: 96, borderRadius: 24, background: U.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50}}>✉️</div>
        <div>
          <div style={{fontFamily: font.display, fontWeight: 800, fontSize: 40, color: U.ink}}>Recordatorio de pago</div>
          <div style={{fontFamily: font.display, fontSize: 32, color: U.gray}}>Factura #0142 · $1.200</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Pay: React.FC<{tapAt: number}> = ({tapAt}) => {
  const frame = useCurrentFrame();
  const ph = useSpring(0, {damping: 14});
  const paid = frame >= tapAt + 3;
  const ok = spring({frame: frame - tapAt - 3, fps: 30, config: {damping: 9, stiffness: 260}});
  const fx = interpolate(frame, [tapAt - 14, tapAt - 2], [780, 520], {...clamp, easing: easeInOut});
  const fy = interpolate(frame, [tapAt - 14, tapAt - 2], [1700, 1410], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{background: U.mint}}>
      <Phone light style={{left: 220, top: 420, transform: `translateY(${(1 - ph) * 900}px)`}}>
        <div style={{padding: '110px 44px 0'}}>
          <CobraMark size={90} />
          <div style={{fontFamily: font.mono, fontSize: 24, letterSpacing: 3, color: U.gray, marginTop: 40}}>FACTURA #0142 · ESTUDIO NÓMADA</div>
          <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 140, letterSpacing: -5, color: U.ink, marginTop: 10}}>$1.200</div>
          <div style={{fontFamily: font.display, fontSize: 32, color: U.gray}}>Sesión de fotos · vence hoy</div>
        </div>
        <div style={{position: 'absolute', left: 44, right: 44, bottom: 120, height: 130, borderRadius: 999, background: paid ? U.green : U.ink, color: paid ? U.ink : U.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: font.display, fontWeight: 900, fontSize: 52, transform: `scale(${frame >= tapAt && frame < tapAt + 5 ? 0.94 : 1})`}}>
          {paid ? (
            <>
              <div style={{transform: `scale(${ok})`}}>
                <Icon name="check" size={60} color={U.ink} stroke={3.2} />
              </div>
              Pagado
            </>
          ) : (
            'Pagar $1.200'
          )}
        </div>
      </Phone>
      {/* dedo */}
      <div style={{position: 'absolute', left: fx, top: fy, width: 120, height: 120, borderRadius: '50%', background: 'rgba(11,15,14,0.18)', border: `6px solid ${U.ink}`, transform: `scale(${frame >= tapAt && frame < tapAt + 5 ? 0.8 : 1})`, opacity: frame < tapAt + 12 ? 1 : 0}} />
      {paid &&
        new Array(14).fill(0).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const p = interpolate(frame - tapAt - 3, [0, 16], [0, 1], {...clamp, easing: easeOut});
          return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 480 * p - 12, top: 1480 + Math.sin(a) * 300 * p - 12, width: 24, height: 24, borderRadius: 6, background: i % 2 ? U.green : U.ink, transform: `rotate(${p * 300}deg)`, opacity: 1 - p}} />;
        })}
    </AbsoluteFill>
  );
};

const Money: React.FC = () => {
  const frame = useCurrentFrame();
  const chip = spring({frame: frame - 2, fps: 30, config: {damping: 12, stiffness: 200}});
  const bars = [0.35, 0.5, 0.42, 0.62, 0.55, 0.78, 1];
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 1180, height: 420, display: 'flex', alignItems: 'flex-end', gap: 22}}>
        {bars.map((h, i) => (
          <div key={i} style={{flex: 1, height: `${h * 100 * prog(frame, 4 + i * 2, 14)}%`, borderRadius: 18, background: i === bars.length - 1 ? U.green : '#1F2926'}} />
        ))}
      </div>
      <div style={{position: 'absolute', right: 110, top: 1040, padding: '18px 34px', borderRadius: 999, background: U.green, fontFamily: font.display, fontWeight: 900, fontSize: 52, color: U.ink, transform: `translateY(${(1 - chip) * -300}px) scale(${chip})`}}>+ $1.200</div>
    </AbsoluteFill>
  );
};

const End: React.FC<{lineAt: [number, number]}> = ({lineAt}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0);
  return (
    <AbsoluteFill style={{background: U.ink, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 560, display: 'flex', alignItems: 'center', gap: 34, transform: `scale(${0.8 + 0.2 * s})`, opacity: s}}>
        <CobraMark size={190} draw={prog(frame, 0, 14)} />
        <div style={{fontFamily: font.display, fontWeight: 900, fontSize: 190, letterSpacing: -8, color: U.paper}}>Cobra</div>
      </div>
      <div style={{position: 'absolute', top: 980, textAlign: 'center', fontFamily: font.display, fontWeight: 900, fontSize: 120, letterSpacing: -4, lineHeight: 1.05}}>
        <div style={{color: U.paper, clipPath: `inset(0 ${(1 - prog(frame, lineAt[0], 10)) * 100}% 0 0)`}}>Factura hoy.</div>
        <div style={{color: U.green, clipPath: `inset(0 ${(1 - prog(frame, lineAt[1], 10)) * 100}% 0 0)`}}>Cobra hoy.</div>
      </div>
      <div style={{position: 'absolute', top: 1400, fontFamily: font.mono, fontSize: 36, letterSpacing: 6, color: U.gray, opacity: prog(frame, lineAt[1] + 10, 10)}}>COBRA.APP</div>
    </AbsoluteFill>
  );
};

export const Cobra: React.FC = () => {
  const W = 7;
  const SEND_AT = t.w(1, 'envías') + 2;
  const TAP_AT = t.w(3, 'clic');
  return (
    <AbsoluteFill style={{background: U.ink}}>
      <Shake hits={[S.logo, SEND_AT, TAP_AT, FINAL]} amp={8}>
        <Scene from={S.hook} to={S.total} exit="up" dur={W} name="Deudas">
          <Hook />
        </Scene>
        <Scene from={S.total} to={S.logo} enter="up" exit="left" dur={W} name="Total">
          <Total />
        </Scene>
        <Scene from={S.logo} to={S.crear} enter="left" exit="up" dur={W} name="Logo">
          <Logo />
        </Scene>
        <Scene from={S.crear} to={S.chase} enter="up" exit="left" dur={W} name="Crear factura">
          <Crear sendAt={SEND_AT - S.crear} tenAt={t.w(1, 'segundos') - S.crear} />
        </Scene>
        <Scene from={S.chase} to={S.remind} enter="left" exit="up" dur={W} name="Persigue">
          <Chase />
        </Scene>
        <Scene from={S.remind} to={S.wa} enter="up" exit="left" dur={W} name="Recordatorios">
          <Remind />
        </Scene>
        <Scene from={S.wa} to={S.pay} enter="left" exit="up" dur={W} name="WhatsApp y correo">
          <Whatsapp mailAt={t.w(2, 'correo') - S.wa - 4} />
        </Scene>
        <Scene from={S.pay} to={S.money} enter="up" exit="left" dur={W} name="Paga">
          <Pay tapAt={TAP_AT - S.pay} />
        </Scene>
        <Scene from={S.money} to={S.end} enter="left" exit="up" dur={W} name="Dinero">
          <Money />
        </Scene>
        <Scene from={S.end} enter="up" dur={W} name="Cierre">
          <End lineAt={[t.w(4, 'factura') - S.end, t.w(4, 'cobra', 1) - S.end - 2]} />
        </Scene>

        {/* ---------- titulares ---------- */}
        <Slam from={S.hook} to={S.total} y={220} size={130} face="display" words={[{text: '¿CUÁNTO', at: 0}, {text: 'DINERO', at: t.w(0, 'dinero') - 2, color: U.red}, {text: 'TE DEBEN?', at: t.w(0, 'deben') - 2, br: true}]} />
        <Count from={S.total} to={S.logo} value={[0, 4850]} prefix="$" roll={t.w(0, 'mismo') - S.total} y={760} size={230} face="display" color={U.red} />
        <Reveal from={t.w(0, 'ahora') - 2} to={S.logo} lines={['ahora mismo.']} y={1120} size={120} face="serif" />
        <Reveal from={S.crear + 2} to={S.chase} lines={['FACTURA EN', '10 SEGUNDOS']} y={250} size={110} face="display" color={['#fff', U.green]} stagger={4} />
        <Reveal from={S.chase + 2} to={S.remind} lines={['COBRA PERSIGUE', 'EL PAGO POR TI']} y={420} size={110} face="display" color={['#fff', U.green]} stagger={4} />
        <Reveal from={S.remind + 2} to={S.wa} lines={['RECORDATORIOS', 'AUTOMÁTICOS']} y={330} size={110} face="display" color={['#fff', U.green]} stagger={4} />
        <Reveal from={S.wa + 2} to={S.pay} lines={['POR WHATSAPP', 'Y CORREO']} y={300} size={110} face="display" color={[U.wa, '#fff']} stagger={4} />
        <Reveal from={S.pay + 2} to={S.money} lines={['PAGA CON', 'UN CLIC']} y={150} size={110} face="display" color={[U.ink, U.ink]} stagger={4} shadow={false} />
        <Reveal from={S.money + 2} to={S.end} lines={['DIRECTO A', 'TU CUENTA']} y={330} size={130} face="display" color={['#fff', U.green]} stagger={4} />
        <Count from={S.money + 4} to={S.end} value={[8400, 9600]} prefix="$" roll={t.w(3, 'cuenta') - S.money} y={640} size={200} face="display" color={U.paper} />
      </Shake>

      <Flash at={S.logo} max={0.5} color={U.mint} />
      <Flash at={FINAL} max={0.4} color={U.mint} />
      <Grain opacity={0.05} />

      <Audio src={staticFile('voz/cobra.wav')} />
      <Music name="tech_122" volume={0.45} duration={COBRA_DURATION} vo={vo} duck={0.6} fadeIn={4} fadeOut={16} />
      {DEBTS.map((_, i) => (
        <Sfx key={i} name="pop" at={4 + i * 5} volume={0.3} />
      ))}
      <Sfx name="whoosh_short" at={S.total - 4} volume={0.4} />
      <Sfx name="riser" at={S.logo - 40} volume={0.25} />
      <Sfx name="impact" at={S.logo} volume={0.4} />
      <Sfx name="typing" at={S.crear} volume={0.35} />
      <Sfx name="click" at={SEND_AT} volume={0.7} />
      <Sfx name="ding" at={SEND_AT + 4} volume={0.35} />
      <Sfx name="whoosh_short" at={S.chase - 4} volume={0.4} />
      <Sfx name="swish" at={S.chase + 20} volume={0.4} />
      <Sfx name="cash" at={S.chase + 42} volume={0.35} />
      <Sfx name="whoosh_short" at={S.remind - 4} volume={0.4} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="pop" at={S.remind + 4 + i * 9} volume={0.4} />
      ))}
      <Sfx name="whoosh_short" at={S.wa - 4} volume={0.4} />
      <Sfx name="ding" at={S.wa + 4} volume={0.35} />
      <Sfx name="ding" at={t.w(2, 'correo') - 4} volume={0.3} />
      <Sfx name="whoosh_short" at={S.pay - 4} volume={0.4} />
      <Sfx name="click" at={TAP_AT} volume={0.7} />
      <Sfx name="cash" at={TAP_AT + 4} volume={0.5} />
      <Sfx name="whoosh_short" at={S.end - 4} volume={0.4} />
      <Sfx name="impact" at={FINAL} volume={0.35} />
    </AbsoluteFill>
  );
};
