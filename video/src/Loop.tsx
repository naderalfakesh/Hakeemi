import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./components/Backdrop";
import { BrandMark } from "./components/BrandMark";
import type { Beat } from "./components/BeatTrack";
import { BeatTrack, beatFrames, trackFrames } from "./components/BeatTrack";
import { PhoneFrame } from "./components/PhoneFrame";
import { segments, DARK_FLIP_FRAME } from "./segments";
import { dark, EASE_OUT, fonts, light, SCREEN_H, SCREEN_W } from "./theme";

// A tight highlight loop for the GitHub README (rendered as a GIF).

const loopBeats: Beat[] = [
  { seg: segments.findcareOpen, lead: 4, hold: 6 },
  { seg: segments.pickDay, lead: 2 },
  { seg: segments.pickSlot, hold: 6 },
  { seg: segments.confirmation, rate: 1.2, hold: 6 },
  { seg: segments.langSwitch, rate: 1.5, hold: 2 },
  { seg: segments.darkPre, rate: 1.5, hold: 10 },
];

export const LOOP_FRAMES = trackFrames(loopBeats);

const labels = [
  "Find the right clinician",
  "Real availability",
  "Real availability",
  "Transactional booking",
  "Arabic · native RTL",
  "Light & dark",
];

const starts = loopBeats.map((_, i) =>
  loopBeats.slice(0, i).reduce((a, b) => a + beatFrames(b), 0),
);

const FLIP_FRAME = starts[5] + Math.round(DARK_FLIP_FRAME / 1.5);

const PHONE_SCALE = 0.68;

export const Loop: React.FC = () => {
  const frame = useCurrentFrame();

  const isDark = frame >= FLIP_FRAME + 7;
  const beatIndex = starts.filter((s) => frame >= s).length - 1;
  const label = labels[Math.max(0, beatIndex)];
  const labelStart = starts[Math.max(0, beatIndex)];
  // Merge repeated labels into one continuous chip.
  const effectiveStart =
    beatIndex > 0 && labels[beatIndex - 1] === label
      ? starts[beatIndex - 1]
      : labelStart;

  const palette = isDark ? dark : light;

  return (
    <AbsoluteFill>
      <Backdrop
        mode="light"
        flipAt={FLIP_FRAME}
        flipOrigin={{ x: 0.68, y: 0.5 }}
      />
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            maxWidth: 460,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMark size={64} />
            <span
              style={{
                fontFamily: fonts.latin,
                fontWeight: 800,
                fontSize: 52,
                letterSpacing: -1.5,
                color: palette.textPrimary,
              }}
            >
              Hakeemi
            </span>
          </div>
          <div
            key={effectiveStart}
            style={{
              fontFamily: fonts.latin,
              fontWeight: 700,
              fontSize: 40,
              lineHeight: 1.2,
              color: palette.brand,
              opacity: interpolate(
                frame,
                [effectiveStart, effectiveStart + 10],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              translate: `0px ${interpolate(
                frame,
                [effectiveStart, effectiveStart + 14],
                [16, 0],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(...EASE_OUT),
                },
              )}px`,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: fonts.latin,
              fontWeight: 400,
              fontSize: 24,
              color: palette.textSecondary,
            }}
          >
            React Native · Expo · TypeScript · Firebase
          </div>
        </div>
        <div
          style={{
            width: SCREEN_W * PHONE_SCALE + 40,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{ scale: String(PHONE_SCALE), transformOrigin: "center" }}
          >
            <div style={{ width: SCREEN_W, height: SCREEN_H }}>
              <PhoneFrame tilt={-3}>
                <BeatTrack beats={loopBeats} tapColor={light.brand} muteTaps />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
