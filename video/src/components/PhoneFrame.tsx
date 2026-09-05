import React from "react";
import { Interactive } from "remotion";
import { SCREEN_H, SCREEN_W } from "../theme";

const BEZEL = 14;
const OUTER_RADIUS = 64;

/**
 * Minimal, brand-neutral device frame. The footage already has the status bar
 * cropped away, so the frame is a clean slab: dark bezel, big radius, soft
 * floating shadow. Children fill the screen area.
 */
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  tilt?: number;
  shadowColor?: string;
}> = ({ children, tilt = 0, shadowColor = "rgba(16, 39, 38, 0.28)" }) => {
  return (
    <Interactive.Div
      name="Phone frame"
      style={{
        width: SCREEN_W + BEZEL * 2,
        height: SCREEN_H + BEZEL * 2,
        borderRadius: OUTER_RADIUS,
        backgroundColor: "#0D1514",
        padding: BEZEL,
        boxShadow: `0 48px 90px -24px ${shadowColor}, 0 12px 28px -12px ${shadowColor}`,
        transform: `perspective(1800px) rotateY(${tilt}deg)`,
      }}
    >
      <div
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: OUTER_RADIUS - BEZEL,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#F5F8F5",
          // Keep the rounded corners crisp over video.
          isolation: "isolate",
        }}
      >
        {children}
      </div>
    </Interactive.Div>
  );
};
