import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {Cafe, CAFE_DURATION} from './videos/Cafe';
import {Inmobiliaria, INMO_DURATION} from './videos/Inmobiliaria';
import {calculatePitchMetadata, Pitch, pitchDefaults} from './videos/Pitch';
import {Podcast, PODCAST_DURATION} from './videos/Podcast';
import {Saas, SAAS_DURATION} from './videos/Saas';
import {Showreel, SHOWREEL_DURATION} from './videos/Showreel';
import {Brasa, BRASA_DURATION} from './videos/rapido/Brasa';
import {Cobra, COBRA_DURATION} from './videos/rapido/Cobra';
import {Fresca, FRESCA_DURATION} from './videos/rapido/Fresca';
import {Disciplina, DISCIPLINA_DURATION} from './videos/stock/Disciplina';
import {Mexico, MEXICO_DURATION} from './videos/stock/Mexico';
import {Nadie, NADIE_DURATION} from './videos/stock/Nadie';
import {Oceano, OCEANO_DURATION} from './videos/stock/Oceano';
import {Restaurante, RESTAURANTE_DURATION} from './videos/stock/Restaurante';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Podcast" component={Podcast} durationInFrames={PODCAST_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Cafe" component={Cafe} durationInFrames={CAFE_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Inmobiliaria" component={Inmobiliaria} durationInFrames={INMO_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Saas" component={Saas} durationInFrames={SAAS_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="Showreel" component={Showreel} durationInFrames={SHOWREEL_DURATION} fps={30} width={1920} height={1080} />
    {/* v2: voz OpenAI sin silencios + video real de Mixkit */}
    <Composition id="Disciplina" component={Disciplina} durationInFrames={DISCIPLINA_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Nadie" component={Nadie} durationInFrames={NADIE_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Mexico" component={Mexico} durationInFrames={MEXICO_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Restaurante" component={Restaurante} durationInFrames={RESTAURANTE_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Oceano" component={Oceano} durationInFrames={OCEANO_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Fresca" component={Fresca} durationInFrames={FRESCA_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Brasa" component={Brasa} durationInFrames={BRASA_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Cobra" component={Cobra} durationInFrames={COBRA_DURATION} fps={30} width={1080} height={1920} />
    <Composition
      id="Pitch"
      component={Pitch}
      defaultProps={pitchDefaults}
      calculateMetadata={calculatePitchMetadata}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
