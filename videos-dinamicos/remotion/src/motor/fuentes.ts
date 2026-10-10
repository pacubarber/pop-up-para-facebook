import {staticFile} from 'remotion';

// Tipografías de la marca CORTE (Google Fonts, variables). preparar.py las copia a public/fuentes.
const caras: Array<[familia: string, archivo: string, estilo: string, peso: string]> = [
  ['Inter Tight', 'inter-tight.ttf', 'normal', '100 900'],
  ['Inter Tight', 'inter-tight-italic.ttf', 'italic', '100 900'],
  ['Instrument Serif', 'instrument-serif.ttf', 'normal', '400'],
  ['Instrument Serif', 'instrument-serif-italic.ttf', 'italic', '400'],
  ['JetBrains Mono', 'jetbrains-mono.ttf', 'normal', '100 800'],
];

export const familia = {
  display: '"Inter Tight", sans-serif',
  serif: '"Instrument Serif", serif',
  mono: '"JetBrains Mono", monospace',
} as const;

let carga: Promise<void> | null = null;

export const cargarFuentes = () => {
  carga ??= Promise.all(
    caras.map(([fam, archivo, style, weight]) =>
      new FontFace(fam, `url(${staticFile(`fuentes/${archivo}`)})`, {style, weight}).load().then((f) => {
        (document.fonts as unknown as {add: (cara: FontFace) => void}).add(f);
      }),
    ),
  ).then(() => undefined);
  return carga;
};
