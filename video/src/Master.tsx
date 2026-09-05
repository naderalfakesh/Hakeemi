import React from "react";
import { interpolate, Sequence, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { whoosh } from "@remotion/sfx";
import { Intro, INTRO_FRAMES } from "./scenes/Intro";
import {
  ArabicScene,
  ArabicSfx,
  ARABIC_FRAMES,
  BookScene,
  BookSfx,
  BOOK_FRAMES,
  DarkScene,
  DarkSfx,
  DARK_FRAMES,
  DiscoverScene,
  DISCOVER_FRAMES,
  HelloScene,
  HELLO_FRAMES,
  ManageScene,
  MANAGE_FRAMES,
} from "./scenes/Chapters";
import { Outro, OUTRO_FRAMES } from "./scenes/Outro";

const T = 12; // transition length

const timing = springTiming({
  config: { damping: 200 },
  durationInFrames: T,
});

const scenes = [
  INTRO_FRAMES,
  HELLO_FRAMES,
  DISCOVER_FRAMES,
  BOOK_FRAMES,
  MANAGE_FRAMES,
  ARABIC_FRAMES,
  DARK_FRAMES,
  OUTRO_FRAMES,
];

export const MASTER_FRAMES =
  scenes.reduce((a, b) => a + b, 0) - T * (scenes.length - 1);

/** Start frame of scene i in the final timeline (transitions overlap). */
const sceneStart = (i: number) =>
  scenes.slice(0, i).reduce((a, b) => a + b, 0) - T * i;

// Music bed (Google Lyria, generated for this cut): 68.5 s, ends during the
// outro hold. Mixed under the UI sound design.
const MUSIC_FRAMES = Math.floor(68.5 * 30);

export const Master: React.FC = () => {
  return (
    <>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={HELLO_FRAMES} name="Hello">
          <HelloScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence
          durationInFrames={DISCOVER_FRAMES}
          name="Discover"
        >
          <DiscoverScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={BOOK_FRAMES} name="Book">
          <BookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence
          durationInFrames={MANAGE_FRAMES}
          name="Manage"
        >
          <ManageScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence
          durationInFrames={ARABIC_FRAMES}
          name="Arabic"
        >
          <ArabicScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={DARK_FRAMES} name="Dark">
          <DarkScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES} name="Outro">
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Music bed. */}
      <Sequence durationInFrames={MUSIC_FRAMES} name="Music">
        <Audio
          src={staticFile("music/promo-music.mp3")}
          volume={(f) =>
            interpolate(
              f,
              [0, 15, MUSIC_FRAMES - 50, MUSIC_FRAMES - 1],
              [0, 0.55, 0.55, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      </Sequence>

      {/* Scene-aligned sound effects. */}
      <Sequence from={sceneStart(3)} name="Book sfx">
        <BookSfx />
      </Sequence>
      <Sequence from={sceneStart(5)} name="Arabic sfx">
        <ArabicSfx />
      </Sequence>
      <Sequence from={sceneStart(6)} name="Dark sfx">
        <DarkSfx />
      </Sequence>
      {/* Chapter whooshes. */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Sequence
          key={i}
          from={sceneStart(i) + T - 6}
          durationInFrames={30}
          name={`Whoosh ${i}`}
        >
          <Audio src={whoosh} volume={0.16} />
        </Sequence>
      ))}
    </>
  );
};
