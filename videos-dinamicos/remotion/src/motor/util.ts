// Curvas de animación y colores compartidos por todo el motor.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Avance 0→1 de una animación que empieza en t0 y dura d segundos. */
export const prog = (t: number, t0: number, d: number) => (d <= 0 ? (t >= t0 ? 1 : 0) : clamp((t - t0) / d));

export const easeOut = (p: number, k = 3) => 1 - Math.pow(1 - clamp(p), k);
export const easeIn = (p: number, k = 3) => Math.pow(clamp(p), k);
export const easeIO = (p: number) => {
  const x = clamp(p);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Sale de largo y vuelve (overshoot). */
export const back = (p: number, s = 1.7) => {
  const x = clamp(p) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** Resorte amortiguado: 0 en lt=0, oscila y se asienta en 1. */
export const spring = (lt: number, freq = 4.5, damp = 7) =>
  lt <= 0 ? 0 : 1 - Math.exp(-damp * lt) * Math.cos(2 * Math.PI * freq * lt);

/** Ruido determinista suave (para sacudidas y temblores). */
export const wobble = (t: number, seed = 0) =>
  Math.sin(t * 61.3 + seed * 12.9) * 0.5 + Math.sin(t * 37.1 + seed * 4.1) * 0.3 + Math.sin(t * 97.7 + seed) * 0.2;

export type Tema = Record<string, string>;

/** Un color del JSON puede ser un token del tema ("tinta", "acento"…) o un hex. */
export const col = (c: string | undefined, tema: Tema, fallback = 'tinta') => {
  const k = c ?? fallback;
  return tema[k] ?? k;
};

export const luminancia = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length < 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const esClaro = (hex: string) => luminancia(hex) > 0.5;
