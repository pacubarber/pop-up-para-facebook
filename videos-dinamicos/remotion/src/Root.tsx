// Una composición por cada JSON de videos/ (el id es su "nombre").
import React from 'react';
import {Composition} from 'remotion';
import {calcular} from './motor/tiempo';
import type {Spec} from './motor/tipos';
import {Video} from './motor/Video';

declare const require: {context: (dir: string, sub: boolean, re: RegExp) => {keys: () => string[]; (k: string): Spec}};
const videos = require.context('../videos', false, /\.json$/);

export const Root: React.FC = () => (
  <>
    {videos.keys().map((k) => {
      const spec = videos(k);
      return (
        <Composition
          key={spec.nombre}
          id={spec.nombre}
          component={Video}
          durationInFrames={300}
          fps={spec.fps ?? 30}
          width={spec.ancho ?? 1080}
          height={spec.alto ?? 1920}
          defaultProps={{spec, voz: null, sfx: null}}
          calculateMetadata={calcular}
        />
      );
    })}
  </>
);
