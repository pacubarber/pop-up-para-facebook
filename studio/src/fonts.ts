import {continueRender, delayRender, staticFile} from 'remotion';

// Carga las fuentes locales (public/fonts) antes de renderizar el primer frame,
// así ningún frame sale con la tipografía de respaldo.
const faces: Array<[family: string, file: string, weight: string, style?: string]> = [
  ['Inter Tight', 'inter-tight-latin-400-normal.woff2', '400'],
  ['Inter Tight', 'inter-tight-latin-500-normal.woff2', '500'],
  ['Inter Tight', 'inter-tight-latin-600-normal.woff2', '600'],
  ['Inter Tight', 'inter-tight-latin-700-normal.woff2', '700'],
  ['Inter Tight', 'inter-tight-latin-800-normal.woff2', '800'],
  ['Inter Tight', 'inter-tight-latin-900-normal.woff2', '900'],
  ['Inter Tight', 'inter-tight-latin-800-italic.woff2', '800', 'italic'],
  ['JetBrains Mono', 'jetbrains-mono-latin-400-normal.woff2', '400'],
  ['JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'],
  ['JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'],
  ['Anton', 'anton-latin-400-normal.woff2', '400'],
  ['Instrument Serif', 'instrument-serif-latin-400-normal.woff2', '400'],
  ['Instrument Serif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'],
];

let loaded = false;

export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Cargando fuentes');
  Promise.all(
    faces.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
        weight,
        style: style ?? 'normal',
      });
      return face.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
