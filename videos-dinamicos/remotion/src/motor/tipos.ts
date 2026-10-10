// Forma del JSON que describe un video (videos/*.json).
//
// Cualquier tiempo puede ser un número (segundos) o una referencia a la voz, que se resuelve
// con los tiempos de Whisper antes de renderizar (ver tiempo.ts):
//   "@L3"            inicio de la línea 3 del guion        "@L3.fin"        su final
//   "@L3/cuarto"     la palabra "cuarto" dentro de la línea 3 ("@L3/cuarto#2" segunda vez, ".fin" su final)
//   "@cuarto#2"      segunda vez que se dice "cuarto" en todo el video
//   "@fin"           final de la locución
// y todas admiten un desfase: "@L3/cuarto-0.1", "@L5.fin+0.25".

export type Tiempo = number | string;

export type Anim = 'golpe' | 'sube' | 'aparece' | 'escribe' | 'desliza' | 'ninguna';

export type Bloque = {
  texto: string;
  en?: Tiempo; // cuándo aparece (si falta: al empezar la escena)
  sale?: Tiempo; // cuándo se va
  x?: number; // centro (alinear "centro"), borde izquierdo ("izq") o derecho ("der")
  y: number; // centro vertical
  ancho?: number; // para tam "auto" y el ajuste de línea
  alinear?: 'centro' | 'izq' | 'der';
  fuente?: 'display' | 'serif' | 'mono';
  peso?: number;
  italica?: boolean;
  tam?: number | 'auto';
  tamMax?: number;
  interlineado?: number;
  color?: string;
  tracking?: number; // en em, p. ej. -0.04
  mayus?: boolean;
  contorno?: number; // grosor del trazo: texto hueco
  opacidad?: number;
  anim?: Anim;
  sync?: boolean; // cada palabra entra cuando la voz la dice
  escalonado?: number; // sin sync: segundos entre palabra y palabra
  acentos?: string[]; // palabras en color de acento
  colorAcento?: string;
  cps?: number; // caracteres por segundo para "escribe"
  cursor?: boolean;
  tachar?: Tiempo;
  subrayar?: Tiempo;
  partir?: Tiempo; // se parte en diagonal (como el logo)
  etiqueta?: string; // color de fondo: el texto va dentro de una pastilla
  rot?: number;
  // lo completa tiempo.ts
  _palabras?: number[];
};

export type Grafico = {tipo: string; en?: Tiempo; sale?: Tiempo; encima?: boolean} & Record<string, unknown>;

export type Entrada = {
  tipo: 'corte' | 'barrido' | 'empuje' | 'zoom' | 'circulo' | 'diagonal';
  dur?: number;
  dir?: 'arriba' | 'abajo' | 'izq' | 'der';
  x?: number;
  y?: number;
  angulo?: number;
};

export type Escena = {
  id?: string;
  desde: Tiempo;
  hasta?: Tiempo; // si falta: hasta que empieza la siguiente
  fondo?: string;
  entrada?: Entrada;
  camara?: {zoom?: [number, number]; x?: [number, number]; y?: [number, number]};
  textos?: Bloque[];
  graficos?: Grafico[];
};

export type Capa = {tipo: string} & Record<string, unknown>;

export type Sonido = {t: Tiempo; id: string; vol?: number; alinear?: 'inicio' | 'ataque' | 'pico'};

export type Golpe = {t: Tiempo; tipo: 'zoom' | 'sacudida' | 'flash' | 'invertir'; fuerza?: number; dur?: number; color?: string};

export type Spec = {
  nombre: string;
  ancho?: number;
  alto?: number;
  fps?: number;
  duracion?: Tiempo;
  poster?: number; // segundo que se usa como portada
  tema: Record<string, string>;
  voz?: {guion: string; archivo: string; volumen?: number};
  escenas: Escena[];
  capas?: Capa[];
  sonidos?: Sonido[];
  golpes?: Golpe[];
};

export type Palabra = {texto: string; inicio: number; fin: number};
export type Linea = {texto: string; inicio: number; fin: number; palabras: Palabra[]};
export type VozData = {nombre: string; dur: number; lineas: Linea[]};
export type InfoSonido = {dur: number; ataque: number; pico: number};

export type Props = {spec: Spec; voz?: VozData | null; sfx?: Record<string, InfoSonido> | null};

/** Lo que reciben gráficos y capas para dibujarse. */
export type Ctx = {
  t: number;
  fps: number;
  W: number;
  H: number;
  tema: Record<string, string>;
  voz: VozData | null | undefined;
  dur: number;
  tinta: string; // color de texto que contrasta con el fondo actual
};
