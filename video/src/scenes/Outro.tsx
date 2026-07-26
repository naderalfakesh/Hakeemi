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
import { dark, EASE_OUT, fonts } from "../theme";

export const OUTRO_FRAMES = 200;

const CHIPS = [
  "Expo SDK 57",
  "React 19",
  "TypeScript",
  "Expo Router",
  "Firebase",
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.7, stiffness: 130 },
  });

  const fadeUp = (from: number) => ({
    opacity: interpolate(frame, [from, from + 16], [0, 1], {
      extrapolateLeft: "clamp" as const,
      extrapolateRight: "clamp" as const,
    }),
    translate: `0px ${interpolate(frame, [from, from + 20], [22, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(...EASE_OUT),
    })}px`,
  });

  return (
    <AbsoluteFill>
      <Backdrop mode="dark" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <Interactive.Div name="App icon" style={{ scale: String(pop) }}>
          <BrandMark size={148} />
        </Interactive.Div>
        <Interactive.Div
          name="Wordmark"
          style={{
            fontFamily: fonts.latin,
            fontWeight: 800,
            fontSize: 104,
            letterSpacing: -3,
            color: dark.textPrimary,
            ...fadeUp(8),
          }}
        >
          Hakeemi
        </Interactive.Div>
        <Interactive.Div
          name="Tech chips"
          style={{
            display: "flex",
            gap: 18,
            ...fadeUp(20),
          }}
        >
          {CHIPS.map((chip) => (
            <div
              key={chip}
              style={{
                fontFamily: fonts.latin,
                fontWeight: 600,
                fontSize: 27,
                color: dark.brand,
                backgroundColor: dark.brandSoft,
                borderRadius: 999,
                padding: "14px 30px",
              }}
            >
              {chip}
            </div>
          ))}
        </Interactive.Div>
        <Interactive.Div
          name="Repo link"
          style={{
            fontFamily: fonts.latin,
            fontWeight: 600,
            fontSize: 34,
            color: dark.textPrimary,
            ...fadeUp(34),
          }}
        >
          github.com/naderalfakesh/Hakeemi
        </Interactive.Div>
        <Interactive.Div
          name="Footnote"
          style={{
            fontFamily: fonts.latin,
            fontWeight: 400,
            fontSize: 25,
            color: dark.textSecondary,
            ...fadeUp(44),
          }}
        >
          Portfolio demo · all clinicians and availability are fictional
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
