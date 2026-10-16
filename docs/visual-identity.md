# Visual identity and launch experience

> Established: 2026-10-13

## Mark

The Hakeemi mark is an uppercase H whose crossbar is a single heartbeat: the H
for Hakeemi, the beat for the pulse motif already used in the promo. It is one
continuous stroke weight with round caps, so it survives the iOS corner mask,
the Android adaptive circle and 44 px slots.

- Vector source: `assets/brand/hakeemi-mark.svg` (white glyph on transparent,
  100 x 100 mark space).
- Every raster asset is rendered from it with `npm run assets:brand`
  (`scripts/render-brand-assets.swift`, macOS, AppKit only). Edit the SVG, run
  the script, commit the outputs.

| Asset                                    | Use                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `assets/images/icon.png`                 | 1024 px full-bleed teal icon (legacy iOS slot, stores, web)                                                                        |
| `assets/expo.icon`                       | Icon Composer bundle for iOS 26: the same glyph layer on the teal automatic-gradient fill, so dark and tinted variants are derived |
| `assets/images/android-icon-*.png`       | Adaptive foreground (glyph inside the 66 % safe zone), solid background, monochrome (themed icons and the notification small icon) |
| `assets/images/splash-icon.png`, `-dark` | The tilted brand tile for the native splash, light (teal / white) and dark (mint / deep teal)                                      |
| `assets/images/brand-glyph.png`          | Glyph tinted at runtime by the `BrandMark` component                                                                               |
| `assets/images/favicon.png`              | 48 px web favicon                                                                                                                  |

Colours are the existing theme tokens (`brand`, `textInverse`, `canvas`);
typography stays the system font through `typeScale`. The wordmark is the
word "Hakeemi" in `titleSmall` beside the tile, in both locales.

## Launch

The native splash uses the canvas colour (`#F5F8F5` light, `#071A18` dark)
with the tile at 96 dp. `src/app/_layout.tsx` keeps the splash visible until
the auth session has restored, then fades it out (instantly under reduced
motion). The first React frame is `LaunchGate`, which draws the same tile at
the same size and position, so the hand-off does not jump. If restoration
takes longer than three seconds the splash is released and the gate shows the
"Restoring your session" status. No delay is added; the splash leaves as soon
as the first routed screen exists.

## First run

Onboarding is three steps (`OnboardingScreen`): language and appearance
choices (persisted as guest preferences; choosing Arabic reloads once into
RTL, as Profile does), how finding, comparing and booking works, and a plain
statement that permissions are only requested in context (calendar when a
visit is added to the calendar, reminders when turned on from Profile). Skip
and Continue both persist the versioned completion flag; returning visitors
land on Welcome, and authenticated or demo sessions are redirected by the
session guard before any onboarding route renders.
