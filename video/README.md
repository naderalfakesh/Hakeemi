# Hakeemi promo video

A [Remotion](https://remotion.dev) project that turns the raw simulator
recordings in `../recordings/` into the promo video used in the repo README
and on the portfolio site.

The master includes an AI-generated Google Lyria music bed. Use the silent
master when publishing where soundtrack provenance or licensing is uncertain.

## Compositions

| ID             | Size      | Length | Purpose                                  |
| -------------- | --------- | ------ | ---------------------------------------- |
| `HakeemiPromo` | 1920×1080 | ~70 s  | Master promo (portfolio site, downloads) |
| `HakeemiLoop`  | 1200×750  | ~13 s  | Tight highlight loop (README GIF)        |

## Workflow

```bash
npm install

# 1. Regenerate the trimmed footage segments from ../recordings/*.mov
#    (VFR -> 30 fps CFR, status bar cropped). Requires ffmpeg.
./scripts/prepare-footage.sh

# 2. Preview / edit
npx remotion studio

# 3. Render
npx remotion render HakeemiPromo out/hakeemi-promo.mp4
npx remotion render HakeemiLoop out/hakeemi-loop.mp4
```

To create a silent copy of the rendered master:

```bash
ffmpeg -i out/hakeemi-promo.mp4 -c:v copy -an out/hakeemi-promo-silent.mp4
```

## Structure

- `scripts/prepare-footage.sh` — cuts the ~20 min of raw capture into the
  ~30 beats the video uses. Cut points, and the reasoning for the two-step
  seek strategy on VFR captures, are documented inline.
- `src/segments.ts` — manifest of every footage beat: duration, tap
  coordinates (in 1320×2708 source space), and when each tap fires.
- `src/components/` — the video design system: `PhoneFrame` (device bezel),
  `FootageClip` (freeze-extended playback), `TapIndicator` (brand tap
  ripple), `BeatTrack` (chains beats + click SFX), `Caption`, `Backdrop`
  (brand canvas, including the radial dark-mode wipe), `BrandMark`.
- `src/scenes/` — intro, the five chapters, outro.
- `src/Master.tsx` / `src/Loop.tsx` — the two compositions.

Brand palette and type ramp mirror `../src/theme/` (teal `#0A6765` /
`#72D2CA`, canvas `#F5F8F5` / `#071A18`, Plus Jakarta Sans + IBM Plex Sans
Arabic).
