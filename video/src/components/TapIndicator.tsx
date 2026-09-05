import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

const DURATION = 15;

/**
 * Brand-styled tap ripple. Positioned by the parent (absolute, centered on
 * the tap point). `from` is the frame at which the tap fires.
 */
export const TapIndicator: React.FC<{
  from: number;
  color: string;
  size?: number;
}> = ({ from, color, size = 84 }) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0 || t > DURATION) {
    return null;
  }

  const discOpacity = interpolate(t, [0, 3, 10, DURATION], [0, 0.9, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const discScale = interpolate(t, [0, 4, DURATION], [0.5, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ringScale = interpolate(t, [2, DURATION], [0.6, 2.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ringOpacity = interpolate(t, [2, 6, DURATION], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `4px solid ${color}`,
          opacity: ringOpacity,
          scale: String(ringScale),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.18,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 24px 2px ${color}`,
          border: "3px solid rgba(255,255,255,0.85)",
          opacity: discOpacity,
          scale: String(discScale),
        }}
      />
    </div>
  );
};
