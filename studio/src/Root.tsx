import React from 'react';
import {Composition} from 'remotion';
import {loadFonts} from './fonts';
import {Cafe, CAFE_DURATION} from './videos/Cafe';
import {Inmobiliaria, INMO_DURATION} from './videos/Inmobiliaria';
import {calculatePitchMetadata, Pitch, pitchDefaults} from './videos/Pitch';
import {Podcast, PODCAST_DURATION} from './videos/Podcast';
import {Saas, SAAS_DURATION} from './videos/Saas';
import {Showreel, SHOWREEL_DURATION} from './videos/Showreel';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Podcast" component={Podcast} durationInFrames={PODCAST_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Cafe" component={Cafe} durationInFrames={CAFE_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Inmobiliaria" component={Inmobiliaria} durationInFrames={INMO_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Saas" component={Saas} durationInFrames={SAAS_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="Showreel" component={Showreel} durationInFrames={SHOWREEL_DURATION} fps={30} width={1920} height={1080} />
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
