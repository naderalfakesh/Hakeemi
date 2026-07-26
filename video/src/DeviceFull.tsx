import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { BeatTrack, trackFrames } from "./components/BeatTrack";
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
import { dark, fonts, light } from "./theme";

// Full-bleed realistic device: no backdrop, the phone IS the frame.
// The status bar (Dynamic Island, clock, glyphs) and the home indicator are
// drawn — the raw capture had the status bar cropped off and the simulator
// never rendered a home indicator. Both follow the app theme.

const chapters = [
  helloBeats,
  discoverBeats,
  bookBeats,
  manageBeats,
  arabicBeats,
  darkBeats,
];
const chapterFrames = chapters.map(trackFrames);
export const DEVICE_FULL_FRAMES = chapterFrames.reduce((a, b) => a + b, 0);

const chapterStart = (i: number) =>
  chapterFrames.slice(0, i).reduce((a, b) => a + b, 0);

const FLIP_FRAME = chapterStart(5) + DARK_FLIP_FRAME;

const MUSIC_FRAMES = Math.min(Math.floor(68.5 * 30), DEVICE_FULL_FRAMES);
const MUSIC_VOLUME = 0.33;

// Geometry (canvas 1080x2310). Content pixels are 2.38x iOS points.
export const DEVICE_W = 1080;
export const DEVICE_H = 2310;
const BEZEL = 16;
const OUTER_RADIUS = 150;
const STATUS_H = 127;
const INNER_W = DEVICE_W - BEZEL * 2; // 1048

const StatusGlyphs: React.FC<{ color: string }> = ({ color }) => (
  <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
    {/* Cellular bars */}
    <rect x="0" y="22" width="7" height="11" rx="2" fill={color} />
    <rect x="11" y="17" width="7" height="16" rx="2" fill={color} />
    <rect x="22" y="12" width="7" height="21" rx="2" fill={color} />
    <rect x="33" y="7" width="7" height="26" rx="2" fill={color} />
    {/* Wi-Fi */}
    <path
      d="M78 15 C 86 8, 98 8, 106 15"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M83.5 22.5 C 89 17.5, 95 17.5, 100.5 22.5"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="92" cy="30" r="4.5" fill={color} />
    {/* Battery */}
    <rect
      x="138"
      y="9"
      width="48"
      height="24"
      rx="8"
      stroke={color}
      strokeWidth="3.5"
      opacity="0.45"
    />
    <rect x="143" y="14" width="32" height="14" rx="4" fill={color} />
    <path d="M189 16 v10 a5 5 0 0 0 0-10" fill={color} opacity="0.45" />
  </svg>
);

const StatusBar: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const palette = isDark ? dark : light;
  return (
    <div
      style={{
        height: STATUS_H,
        backgroundColor: palette.canvas,
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Clock (iOS keeps it on the left even in RTL) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 375,
          textAlign: "center",
          fontFamily: fonts.latin,
          fontWeight: 700,
          fontSize: 46,
          letterSpacing: 0.5,
          color: palette.textPrimary,
        }}
      >
        9:41
      </div>
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 25,
          translate: "-50% 0",
          width: 295,
          height: 90,
          borderRadius: 999,
          backgroundColor: "#000000",
        }}
      />
      {/* Right glyphs */}
      <div
        style={{
          position: "absolute",
          right: 62,
          top: (STATUS_H - 40) / 2,
        }}
      >
        <StatusGlyphs color={palette.textPrimary} />
      </div>
    </div>
  );
};

export const DeviceFull: React.FC = () => {
  const frame = useCurrentFrame();
  const isDark = frame >= FLIP_FRAME;

  const cornerColor = isDark ? dark.canvas : light.canvas;
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cornerColor }}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        {/* Bezel */}
        <AbsoluteFill
          style={{
            borderRadius: OUTER_RADIUS,
            backgroundColor: "#0D1514",
            padding: BEZEL,
          }}
        >
          {/* Screen */}
          <div
            style={{
              width: INNER_W,
              height: DEVICE_H - BEZEL * 2,
              borderRadius: OUTER_RADIUS - BEZEL,
              overflow: "hidden",
              position: "relative",
              backgroundColor: isDark ? dark.canvas : light.canvas,
              display: "flex",
              flexDirection: "column",
              isolation: "isolate",
            }}
          >
            <StatusBar isDark={isDark} />
            {/* App content */}
            <div style={{ flex: 1, position: "relative" }}>
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
              {/* Home indicator */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 19,
                  translate: "-50% 0",
                  width: 366,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: isDark
                    ? "rgba(239, 247, 244, 0.85)"
                    : "rgba(13, 21, 20, 0.85)",
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Music bed (60% of the master's level). */}
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

      {/* Chapter-aligned sound effects. */}
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
