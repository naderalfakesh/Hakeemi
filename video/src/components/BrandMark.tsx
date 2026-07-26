import React from "react";
import { light } from "../theme";

/**
 * The Hakeemi brand mark: Ionicons "pulse" on a teal rounded square —
 * recreated as a vector so it stays crisp at any size (the repo's icon.png is
 * still the default Expo icon).
 */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 160 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      backgroundColor: light.brand,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 ${size * 0.18}px ${size * 0.38}px -${size * 0.1}px rgba(10, 103, 101, 0.5)`,
    }}
  >
    <svg
      width={size * 0.58}
      height={size * 0.58}
      viewBox="0 0 512 512"
      fill="none"
    >
      <path
        d="M48 320h64l64-256 64 384 64-224 32 96h64"
        stroke="#FFFFFF"
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="432" cy="320" r="28" fill="#FFFFFF" />
    </svg>
  </div>
);
