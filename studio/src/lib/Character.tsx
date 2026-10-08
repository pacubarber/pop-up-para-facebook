import React from 'react';

// Personajes geométricos para el clip de podcast (estilo ilustración plana).
// `mouth` (0–1) se maneja con la amplitud real de la locución.

export type CharacterLook = {
  skin: string;
  skinShade: string;
  hair: string;
  top: string;
  topShade: string;
  longHair?: boolean;
  beard?: boolean;
};

export const looks: Record<string, CharacterLook> = {
  valeria: {
    skin: '#E2A882',
    skinShade: '#C98E6A',
    hair: '#2B1A14',
    top: '#F5B83D',
    topShade: '#D99A22',
    longHair: true,
  },
  diego: {
    skin: '#B97A55',
    skinShade: '#9C6342',
    hair: '#161210',
    top: '#2E7D6B',
    topShade: '#246454',
    beard: true,
  },
};

export const Character: React.FC<{
  look: CharacterLook;
  mouth: number;
  blink: boolean;
  tilt?: number;
  mic?: 'left' | 'right';
  style?: React.CSSProperties;
}> = ({look, mouth, blink, tilt = 0, mic = 'right', style}) => {
  const m = Math.max(0, Math.min(1, mouth));
  const micX = mic === 'right' ? 1 : -1;
  return (
    <svg viewBox="0 0 600 600" style={style}>
      {/* pelo largo por detrás */}
      {look.longHair && (
        <path
          d="M190 300 C180 170 240 150 300 150 C370 150 425 180 410 300 C405 380 430 440 445 470 L155 470 C175 430 195 380 190 300 Z"
          fill={look.hair}
          transform={`rotate(${tilt} 300 300)`}
        />
      )}
      {/* torso */}
      <path d="M95 600 C95 480 180 430 300 430 C420 430 505 480 505 600 Z" fill={look.top} />
      <path d="M300 430 C250 430 225 445 215 470 C250 480 350 480 385 470 C375 445 350 430 300 430 Z" fill={look.topShade} />
      {/* cuello */}
      <rect x="268" y="350" width="64" height="100" rx="26" fill={look.skinShade} />
      <g transform={`rotate(${tilt} 300 320)`}>
        {/* cabeza */}
        <ellipse cx="300" cy="285" rx="92" ry="108" fill={look.skin} />
        <ellipse cx="208" cy="292" rx="16" ry="24" fill={look.skinShade} />
        <ellipse cx="392" cy="292" rx="16" ry="24" fill={look.skinShade} />
        {/* pelo */}
        {look.longHair ? (
          <path d="M206 262 C200 190 250 160 305 162 C365 164 400 200 396 262 C370 230 330 214 300 212 C262 214 230 232 206 262 Z" fill={look.hair} />
        ) : (
          <path d="M210 250 C205 185 255 165 305 166 C360 168 398 195 392 250 C380 222 350 208 300 208 C255 208 222 222 210 250 Z" fill={look.hair} />
        )}
        {look.beard && (
          <path
            d="M212 300 C214 360 250 393 300 393 C350 393 386 360 388 300 C376 340 350 350 300 350 C250 350 224 340 212 300 Z"
            fill={look.hair}
            opacity={0.92}
          />
        )}
        {/* cejas */}
        <rect x="243" y="250" width="42" height="9" rx="4.5" fill={look.hair} />
        <rect x="315" y="250" width="42" height="9" rx="4.5" fill={look.hair} />
        {/* ojos */}
        <ellipse cx="264" cy="282" rx="8" ry={blink ? 1.5 : 10} fill="#1A1210" />
        <ellipse cx="336" cy="282" rx="8" ry={blink ? 1.5 : 10} fill="#1A1210" />
        {/* boca */}
        <ellipse cx="300" cy="342" rx={20 + 4 * m} ry={3 + 17 * m} fill="#5A1F1A" />
        {m > 0.25 && <rect x={286} y={333 - 17 * m + 12} width="28" height="6" rx="3" fill="#F4EBDD" opacity={0.9} />}
        {/* audífonos */}
        <path d="M196 285 C190 160 410 160 404 285" fill="none" stroke="#1C1C1F" strokeWidth="16" strokeLinecap="round" />
        <rect x="176" y="250" width="40" height="80" rx="18" fill="#26262B" />
        <rect x="384" y="250" width="40" height="80" rx="18" fill="#26262B" />
      </g>
      {/* micrófono con brazo */}
      <g transform={micX < 0 ? 'translate(600 0) scale(-1 1)' : undefined}>
        <path d="M600 560 L470 470 L420 410" fill="none" stroke="#2B2B30" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="372" y="330" width="62" height="118" rx="31" fill="#1C1C1F" transform="rotate(-28 403 389)" />
        <rect x="380" y="342" width="46" height="60" rx="23" fill="#3A3A41" transform="rotate(-28 403 389)" />
      </g>
    </svg>
  );
};
