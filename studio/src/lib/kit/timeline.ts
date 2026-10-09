import type {VoData} from '../core';

// Ayudas para sincronizar el montaje con la locución (tiempos de Whisper → frames).
export const FPS = 30;
export const fr = (s: number) => Math.round(s * FPS);

const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]/g, '');

export const voTimeline = (vo: VoData) => {
  const find = (line: number, prefix: string, nth: number) => {
    const words = vo.lines[line].words.filter((x) => norm(x.text).startsWith(norm(prefix)));
    if (!words[nth]) throw new Error(`No encuentro «${prefix}» en la frase ${line} de ${vo.name}`);
    return words[nth];
  };
  return {
    /** frame en que empieza una palabra: (frase, comienzo de la palabra, n-ésima aparición) */
    w: (line: number, prefix: string, nth = 0) => fr(find(line, prefix, nth).start),
    /** frame en que termina una palabra */
    we: (line: number, prefix: string, nth = 0) => fr(find(line, prefix, nth).end),
    /** inicio / fin de una frase */
    ls: (line: number) => fr(vo.lines[line].start),
    le: (line: number) => fr(vo.lines[line].end),
    end: fr(vo.duration),
  };
};
