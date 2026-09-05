import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { dark, light } from "../theme";

/**
 * Brand canvas with two slowly drifting soft blobs. `mode` picks the palette;
 * `flipAt` (frame) optionally wipes dark mode in with a radial reveal
 * centered on `flipOrigin` (fractions of the frame).
 */
export const Backdrop: React.FC<{
  mode?: "light" | "dark";
  flipAt?: number;
  flipOrigin?: { x: number; y: number };
}> = ({ mode = "light", flipAt, flipOrigin = { x: 0.72, y: 0.5 } }) => {
  const frame = useCurrentFrame();

  const blobDrift = interpolate(frame, [0, 600], [0, 40]);

  const palette = mode === "dark" ? dark : light;

  const blobs = (p: typeof light, keySuffix: string) => (
    <>
      <div
        key={`a-${keySuffix}`}
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          backgroundColor: p.brandSoft,
          right: -280,
          top: -420,
          translate: `0px ${blobDrift}px`,
          opacity: 0.75,
        }}
      />
      <div
        key={`b-${keySuffix}`}
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          backgroundColor: p.accentSoft,
          left: -260,
          bottom: -330,
          translate: `0px ${-blobDrift * 0.6}px`,
          opacity: 0.55,
        }}
      />
    </>
  );

  const flipProgress =
    flipAt === undefined
      ? 0
      : interpolate(frame, [flipAt, flipAt + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.3, 0, 0.2, 1),
        });

  return (
    <AbsoluteFill
      style={{ backgroundColor: palette.canvas, overflow: "hidden" }}
    >
      {blobs(palette, "base")}
      {flipAt !== undefined && flipProgress > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: dark.canvas,
            clipPath: `circle(${flipProgress * 130}% at ${
              flipOrigin.x * 100
            }% ${flipOrigin.y * 100}%)`,
          }}
        >
          {blobs(dark, "flip")}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
