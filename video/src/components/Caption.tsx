import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT, fonts } from "../theme";

type Palette = {
  brand: string;
  textPrimary: string;
  textSecondary: string;
};

const rise = (frame: number, from: number, distance = 26) => ({
  opacity: interpolate(frame, [from, from + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  translate: `0px ${interpolate(frame, [from, from + 22], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  })}px`,
});

/**
 * Chapter caption: eyebrow, headline, sub — staggered entrance. `rtl`
 * right-aligns and switches the headline to the Arabic font.
 */
export const Caption: React.FC<{
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
  palette: Palette;
  rtl?: boolean;
  headlineArabic?: boolean;
  from?: number;
}> = ({ eyebrow, headline, sub, palette, rtl, headlineArabic, from = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        alignItems: rtl ? "flex-end" : "flex-start",
        textAlign: rtl ? "right" : "left",
        maxWidth: 640,
      }}
    >
      <Interactive.Div
        name="Eyebrow"
        style={{
          fontFamily: fonts.latin,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 5,
          color: palette.brand,
          textTransform: "uppercase",
          ...rise(frame, from),
        }}
      >
        {eyebrow}
      </Interactive.Div>
      <Interactive.Div
        name="Headline"
        style={{
          fontFamily: headlineArabic ? fonts.arabic : fonts.latin,
          fontWeight: headlineArabic ? 700 : 800,
          fontSize: 84,
          lineHeight: 1.08,
          letterSpacing: headlineArabic ? 0 : -2.5,
          color: palette.textPrimary,
          direction: rtl ? "rtl" : "ltr",
          ...rise(frame, from + 5),
        }}
      >
        {headline}
      </Interactive.Div>
      <Interactive.Div
        name="Sub"
        style={{
          fontFamily: fonts.latin,
          fontWeight: 400,
          fontSize: 31,
          lineHeight: 1.45,
          color: palette.textSecondary,
          maxWidth: 540,
          ...rise(frame, from + 11),
        }}
      >
        {sub}
      </Interactive.Div>
    </div>
  );
};
