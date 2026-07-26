import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { EASE_OUT } from "../theme";
import { Backdrop } from "./Backdrop";
import { PhoneFrame } from "./PhoneFrame";

/**
 * Standard chapter layout: caption on one side, phone on the other.
 * `mirrored` flips the layout (used by the RTL chapter). `phoneEnter`
 * animates the phone rising in at the start of the chapter.
 */
export const Chapter: React.FC<{
  caption: React.ReactNode;
  phone: React.ReactNode;
  mode?: "light" | "dark";
  mirrored?: boolean;
  phoneEnter?: boolean;
  flipAt?: number;
}> = ({ caption, phone, mode = "light", mirrored, phoneEnter, flipAt }) => {
  const frame = useCurrentFrame();

  const phoneRise = phoneEnter
    ? interpolate(frame, [0, 34], [140, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(...EASE_OUT),
      })
    : 0;
  const phoneOpacity = phoneEnter
    ? interpolate(frame, [0, 16], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill>
      <Backdrop
        mode={mode}
        flipAt={flipAt}
        flipOrigin={{ x: mirrored ? 0.28 : 0.72, y: 0.48 }}
      />
      <AbsoluteFill
        style={{
          flexDirection: mirrored ? "row-reverse" : "row",
          alignItems: "center",
          padding: "0 130px",
          gap: 60,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: mirrored ? "flex-end" : "flex-start",
          }}
        >
          {caption}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            translate: `0px ${phoneRise}px`,
            opacity: phoneOpacity,
          }}
        >
          <PhoneFrame
            tilt={mirrored ? 3.5 : -3.5}
            shadowColor={
              mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(16,39,38,0.28)"
            }
          >
            {phone}
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
