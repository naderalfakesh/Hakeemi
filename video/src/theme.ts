import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadPlexArabic } from "@remotion/google-fonts/IBMPlexSansArabic";

const jakarta = loadJakarta("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

const plexArabic = loadPlexArabic("normal", {
  weights: ["400", "500", "700"],
  subsets: ["arabic", "latin"],
});

export const fonts = {
  latin: jakarta.fontFamily,
  arabic: plexArabic.fontFamily,
};

// Mirrors src/theme/themes.ts in the app repo.
export const light = {
  brand: "#0A6765",
  brandPressed: "#07504F",
  brandSoft: "#DCEDEA",
  canvas: "#F5F8F5",
  surface: "#FBFDFC",
  surfaceBrand: "#E5F2EF",
  accent: "#B85241",
  accentSoft: "#FAE6E1",
  textPrimary: "#102726",
  textSecondary: "#506663",
  danger: "#A9333E",
};

export const dark = {
  brand: "#72D2CA",
  brandPressed: "#91E0D9",
  brandSoft: "#183E3A",
  canvas: "#071A18",
  surface: "#0D211F",
  surfaceBrand: "#123532",
  accent: "#EB9783",
  accentSoft: "#442923",
  textPrimary: "#EFF7F4",
  textSecondary: "#B4C7C2",
  danger: "#FFABB2",
};

// Sourced from the phone recording: 1320x2708 after the status bar crop.
export const FOOTAGE_W = 1320;
export const FOOTAGE_H = 2708;

// On-screen phone size in the 1920x1080 composition.
export const SCREEN_H = 880;
export const SCREEN_W = Math.round((SCREEN_H * FOOTAGE_W) / FOOTAGE_H); // 429

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
