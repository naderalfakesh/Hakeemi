import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BrandMark } from "../components/BrandMark";
import { EASE_OUT, fonts, light } from "../theme";

export const INTRO_FRAMES = 118;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 140 },
  });

  return (
    <AbsoluteFill>
      <Backdrop mode="light" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 44,
        }}
      >
        <Interactive.Div name="App icon" style={{ scale: String(pop) }}>
          <BrandMark size={172} />
        </Interactive.Div>
        <Interactive.Div
          name="Wordmark"
          style={{
            fontFamily: fonts.latin,
            fontWeight: 800,
            fontSize: 128,
            letterSpacing: -4,
            color: light.textPrimary,
            opacity: interpolate(frame, [12, 28], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${interpolate(frame, [12, 34], [30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EASE_OUT),
            })}px`,
          }}
        >
          Hakeemi
        </Interactive.Div>
        <Interactive.Div
          name="Tagline"
          style={{
            fontFamily: fonts.latin,
            fontWeight: 400,
            fontSize: 40,
            color: light.textSecondary,
            opacity: interpolate(frame, [26, 44], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${interpolate(frame, [26, 48], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EASE_OUT),
            })}px`,
          }}
        >
          Care, without the runaround.
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
