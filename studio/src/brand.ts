// Identidad de CORTE — una sola fuente de verdad para colores y tipografías.
// La web (web/assets/site.css) y la guía de marca usan exactamente estos valores.

export const brand = {
  name: 'CORTE',
  tagline: 'Cada corte cuenta.',
  descriptor: 'Estudio de edición de video',
  handle: '@corte.studio',
  web: 'cortestudio.co',
} as const;

export const color = {
  ink: '#0C0C0E', // Negro Sala — fondo principal
  panel: '#17171A', // Grafito — superficies
  line: '#2A2A2F', // líneas y bordes
  bone: '#F2EEE6', // Hueso — texto principal
  muted: '#8C8A84', // texto secundario
  red: '#FF3B1F', // Rojo Corte — acento (botón REC)
  redDeep: '#C9260E', // rojo para fondos claros
} as const;

export const font = {
  display: '"Inter Tight", "Inter", sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  impact: '"Anton", "Inter Tight", sans-serif',
} as const;

// Ritmo base de la música de marca (120 BPM a 30 fps = 15 frames por tiempo).
export const FPS = 30;
export const BEAT = 15;
