# Phase 1 Verification

> Verified: 2026-07-19
>
> Final implementation commit: `d426031`
>
> Scope: modern Expo foundation and fixture-backed provider discovery

## Outcome

Phase 1 passes its definition of done. The Expo SDK 57 development build runs
with the New Architecture on current iOS and Android simulators, and the same
guest journey works on both platforms:

1. open the explicit fictional-data portfolio entry;
2. enter the Home experience;
3. browse featured providers and next availability;
4. open Find Care;
5. search for `Malayalam` and receive only Dr. Priya Menon;
6. open the provider profile and inspect availability, fee, visit modes,
   languages, and clinics.

The rendered iOS accessibility tree was inspected with AXe. The Android
activity, UI hierarchy, fatal logs, and screenshots were inspected with ADB and
UIAutomator. No app-level runtime errors remained after the fixes described
below.

## Native build evidence

| Platform                  | Environment                                                         | Command                                   | Result                                                          |
| ------------------------- | ------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| iOS                       | Xcode 26.6, iPhone 17 Pro simulator, iOS 26.5                       | `npm run ios -- --device "iPhone 17 Pro"` | Build succeeded with 0 errors; installed, bundled, and launched |
| Android                   | Android Studio JBR 21, Medium Phone emulator, Android 16 / API 36.1 | `npm run android`                         | 455 Gradle tasks completed; APK installed and launched          |
| Generated native projects | Expo CNG                                                            | `npx expo prebuild --clean --no-install`  | Succeeded for iOS and Android                                   |
| Optional web export       | Expo Router static export                                           | `npx expo export --platform web`          | Succeeded with 13 static routes                                 |

The generated `ios/` and `android/` directories remain ignored as required by
the CNG architecture decision.

## Quality gate

`npm run validate` passed after the native smoke tests:

- Prettier: pass;
- ESLint: pass;
- strict TypeScript: pass;
- Jest: 9 suites and 22 tests passed;
- Expo Doctor: 20/20 checks passed.

## Issues found by native verification

### Hermes collection compatibility

Hermes did not provide `Array.prototype.toSorted` in the tested native runtime,
although the Node-based test environment did. The fixture repository entered
its designed error state on the first iOS run. Provider, specialty, and slot
sorting now operates on arrays already copied by `filter` or `map` and uses the
widely supported `sort` method. Commit: `0645243`.

### Decorative icon announcements

VoiceOver exposed Ionicons font glyphs as meaningless labels on provider
screens. A shared `DecorativeIcon` primitive now removes purely visual icons
from the accessibility tree while interactive parents retain explicit labels.
The behavior has regression coverage. Commit: `d426031`.

## Non-blocking upstream warnings

- The first iOS build reports generated-project warnings for a duplicate C++
  library and the Expo Dev Launcher build phase dependency analysis.
- The Android build reports deprecations from Expo and React Native dependency
  sources plus Gradle features scheduled for removal in Gradle 10.
- Jest reports a local Watchman recrawl warning; test execution still passes.
- `npm audit` reports 11 moderate advisories through Expo tooling, ultimately
  including the `xcode` to `uuid` chain. The suggested automated resolutions
  are incompatible major-version downgrades, so no audit fix was applied. Track
  the Expo dependency chain during SDK upgrades.

None of these warnings originates in Hakeemi feature code or blocks the Phase 1
development builds. They remain visible here rather than being hidden or
silenced without an upstream-compatible resolution.
