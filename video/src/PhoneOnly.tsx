import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { Backdrop } from "./components/Backdrop";
import { BeatTrack, trackFrames } from "./components/BeatTrack";
import { PhoneFrame } from "./components/PhoneFrame";
import {
  arabicBeats,
  ArabicSfx,
  bookBeats,
  BookSfx,
  darkBeats,
  DarkSfx,
  discoverBeats,
  helloBeats,
  manageBeats,
} from "./scenes/Chapters";
import { DARK_FLIP_FRAME } from "./segments";
import { dark, light, EASE_OUT } from "./theme";

// Caption-free cut: the phone is the whole show. Same beats, taps and UI
// sounds as the master, portrait canvas, no intro/outro cards.

const chapters = [
  helloBeats,
  discoverBeats,
  bookBeats,
  manageBeats,
  arabicBeats,
  darkBeats,
];

const chapterFrames = chapters.map(trackFrames);
export const PHONE_ONLY_FRAMES = chapterFrames.reduce((a, b) => a + b, 0);

const chapterStart = (i: number) =>
  chapterFrames.slice(0, i).reduce((a, b) => a + b, 0);

// Global frame at which the in-app theme flips (darkBeats' first beat).
const FLIP_FRAME = chapterStart(5) + DARK_FLIP_FRAME;

// The music track is 68.5 s; this cut is shorter, so fade it out at the end.
const MUSIC_FRAMES = Math.min(Math.floor(68.5 * 30), PHONE_ONLY_FRAMES);
const MUSIC_VOLUME = 0.33;

// Canvas is 1080x1920; scale the 880px-tall phone to nearly full height.
const PHONE_SCALE = 1.86;

export const PhoneOnly: React.FC = () => {
  const frame = useCurrentFrame();

  const rise = interpolate(frame, [0, 34], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const enterOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop
        mode="light"
        flipAt={FLIP_FRAME}
        flipOrigin={{ x: 0.5, y: 0.5 }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          translate: `0px ${rise}px`,
          opacity: enterOpacity,
        }}
      >
        <div style={{ scale: String(PHONE_SCALE) }}>
          <PhoneFrame tilt={0} shadowColor="rgba(16, 39, 38, 0.3)">
            <Series>
              {chapters.map((beats, i) => (
                <Series.Sequence
                  key={i}
                  durationInFrames={chapterFrames[i]}
                  name={`Chapter ${i}`}
                >
                  <BeatTrack
                    beats={beats}
                    tapColor={i === 5 ? dark.brand : light.brand}
                  />
                </Series.Sequence>
              ))}
            </Series>
          </PhoneFrame>
        </div>
      </AbsoluteFill>

      {/* Music bed at 60% of the master's level. */}
      <Sequence durationInFrames={MUSIC_FRAMES} name="Music">
        <Audio
          src={staticFile("music/promo-music.mp3")}
          volume={(f) =>
            interpolate(
              f,
              [0, 15, MUSIC_FRAMES - 55, MUSIC_FRAMES - 3],
              [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      </Sequence>

      {/* Chapter-aligned sound effects (ding, reload, theme switch). */}
      <Sequence from={chapterStart(2)} name="Book sfx">
        <BookSfx />
      </Sequence>
      <Sequence from={chapterStart(4)} name="Arabic sfx">
        <ArabicSfx />
      </Sequence>
      <Sequence from={chapterStart(5)} name="Dark sfx">
        <DarkSfx />
      </Sequence>
    </AbsoluteFill>
  );
};
