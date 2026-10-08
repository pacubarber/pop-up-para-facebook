import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VoData, VoWord} from './core';

type Page = {words: VoWord[]; start: number; end: number; voice: string};

const norm = (w: string) => w.toLowerCase().replace(/[^\wáéíóúñü]/gi, '');

/** Agrupa las palabras de la locución en "páginas" cortas, estilo reels. */
export const buildPages = (vo: VoData, maxWords = 3, maxChars = 16): Page[] => {
  const pages: Page[] = [];
  for (const line of vo.lines) {
    let cur: VoWord[] = [];
    const flush = () => {
      if (cur.length) pages.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end, voice: line.voice});
      cur = [];
    };
    for (const w of line.words) {
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
      if (cur.length >= maxWords || (cur.length && chars > maxChars)) flush();
      cur.push(w);
      if (/[,.;:!?…]$/.test(w.text)) flush();
    }
    flush();
  }
  // cada página dura hasta que empieza la siguiente (sin huecos cortos)
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    const gap = next ? next.start - pages[i].end : 1;
    pages[i].end = gap < 0.6 && next ? next.start : pages[i].end + 0.25;
  }
  return pages;
};

export const Captions: React.FC<{
  vo: VoData;
  fontFamily: string;
  fontSize?: number;
  color?: string;
  activeColor?: string;
  activeBg?: string;
  stroke?: string;
  uppercase?: boolean;
  emphasis?: Record<string, string>; // palabra → color especial
  maxWords?: number;
  maxChars?: number;
  activeScale?: number;
  style?: React.CSSProperties;
}> = ({
  vo,
  fontFamily,
  fontSize = 92,
  color = '#fff',
  activeColor = '#FFD23F',
  activeBg,
  stroke = 'rgba(0,0,0,0.9)',
  uppercase = true,
  emphasis = {},
  maxWords,
  maxChars,
  activeScale = 0.08,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pages = React.useMemo(() => buildPages(vo, maxWords, maxChars), [vo, maxWords, maxChars]);
  const page = pages.find((p) => t >= p.start - 0.05 && t < p.end);
  if (!page) return null;
  const enter = spring({frame: frame - Math.round(page.start * fps), fps, config: {damping: 12, stiffness: 220, mass: 0.5}});
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: fontSize * 0.04,
        fontFamily,
        fontSize,
        lineHeight: 1.08,
        textAlign: 'center',
        transform: `scale(${0.82 + 0.18 * enter})`,
        ...style,
      }}
    >
      {page.words.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.02;
        const spoken = t >= w.start;
        const special = emphasis[norm(w.text)];
        const pop = spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 10, stiffness: 300, mass: 0.4}});
        const text = uppercase ? w.text.toUpperCase() : w.text;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              position: 'relative',
              margin: `0 ${fontSize * 0.16}px`,
              transformOrigin: '50% 70%',
              color: special ?? (active && !activeBg ? activeColor : color),
              opacity: spoken ? 1 : 0.55,
              transform: `scale(${active ? 1 + activeScale * pop : 1}) rotate(${active && activeScale ? -1.5 * pop : 0}deg)`,
              WebkitTextStroke: stroke ? `${fontSize * 0.05}px ${stroke}` : undefined,
              paintOrder: 'stroke fill',
              textShadow: '0 6px 24px rgba(0,0,0,0.35)',
              padding: activeBg ? '0 0.12em' : undefined,
              borderRadius: activeBg ? fontSize * 0.16 : undefined,
              background: activeBg && active ? activeBg : 'transparent',
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};
