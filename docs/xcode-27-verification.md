# Xcode 27 Verification — Expo SDK 57 Alignment

> Verified: 2026-10-12
>
> Scope: Expo SDK 57 patch alignment, iOS 27 SDK scene lifecycle, Xcode 27
> native build and startup

## Why the alignment was required

Expo's SDK 57 release notes state that apps built with the iOS 27 SDK must use
the UIKit scene-based lifecycle or they do not launch correctly on iOS 27, and
that SDK 57 adds this only as an opt-in from `expo@57.0.23`
(`ios.enableSceneSupport` in `expo-build-properties`). The repository was
locked to `expo@57.0.20`, so building with Xcode 27 required moving to a newer
SDK 57 patch before anything else.

## Toolchain

| Tool                  | Version                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| Xcode                 | 27.0 (27A266a), iOS 27.0 simulator runtime                                     |
| CocoaPods             | 1.16.2                                                                         |
| Node.js / npm         | 26.7.0 / 11.19.0 on the build host, see the note below (CI pins 24.13.0)       |
| Expo                  | 57.0.28, the npm `latest` tag on the verification date; SDK 58 is still `next` |
| React Native / React  | 0.86.3 / 19.2.3, unchanged                                                     |
| React Native Firebase | 25.1.0, unchanged                                                              |

Node.js 26.7.0 is outside the `engines` range declared in `package.json`
(`>=22.13 <25`). The `npm ci` runs, the lockfile regeneration, and every
`npm run validate` pass recorded here used that version, so none of them is a
run on the supported Node line. CI installs 24.13.0 from `.nvmrc` and is the
authoritative check for the engines range; this pass has not been repeated on
24.x locally.

## Changes

- `npx expo install --fix` moved `expo` to `~57.0.28`, eleven `expo-*`
  ranges, and `jest-expo` to the versions Expo recommends for it, with
  `expo-constants` and `expo-font` resolving to newer patches inside their
  existing ranges; `npx expo install --check` reports "Dependencies are up to
  date". Expo published 57.0.28 while the first pass of the day was on
  57.0.27, so the alignment, quality gate, and native builds were rerun on it.
- `package-lock.json` was regenerated. The previous lockfile no longer
  satisfied `npm ci` under npm 11.19 (two `@emnapi` entries were missing); a
  clean `npm ci` now installs 1732 packages without sync errors.
- `app.config.ts` enables `ios.enableSceneSupport`. Prebuild then makes
  `AppDelegate` conform to `ExpoReactNativeFactoryProvider` and adds a
  `UIApplicationSceneManifest` whose delegate class is
  `EXExpoAppSceneDelegate`.
- Two local config plugins handle a checkout path that contains a space.
  `plugins/with-react-native-bundle-script-quoting.js` quotes the
  `react-native-xcode.sh` command substitution in the app target.
  `plugins/with-expo-constants-script-quoting.js` rewrites the expo-constants
  "Generate app.config" phase in the generated Pods project. In
  `expo-constants@57.0.21` that phase passes the script path unquoted, and the
  script itself runs `basename $PROJECT_DIR` unquoted, so on such a path it
  exits 0 without writing `EXConstants.bundle/app.config`. Debug builds hide
  this because Metro serves the manifest; a Release build crashes at launch.
  The rewritten phase quotes the script path and passes the project root
  explicitly. The first version of this plugin only quoted the script path;
  the Release check below found the second problem.

## Quality gate

`npm run validate` passed after the alignment: Prettier, ESLint, strict
TypeScript for the app, Firebase tests, and Functions, the illustration
budget, 40 Jest suites with 124 tests, 12 Functions unit tests, and Expo Doctor
21/21, on both the 57.0.27 and the final 57.0.28 tree.

## iOS evidence

| Step                     | Command                                                                                    | Result                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generate native projects | `npx expo prebuild --clean`                                                                | Succeeded; CocoaPods installed                                                                                                                                            |
| Debug simulator build    | `xcodebuild -workspace ios/Hakeemi.xcworkspace -scheme Hakeemi -sdk iphonesimulator build` | Exit 0 on 57.0.27 and again on 57.0.28; the first two runs failed only on the unquoted script paths fixed above. Final rerun `** BUILD SUCCEEDED **` 2026-10-12 21:35 +04 |
| Native launch            | `xcrun simctl install` and `xcrun simctl launch` on iPhone 17, iOS 27.0                    | Development launcher rendered; FrontBoard reports a `UIWindowScene` for the process                                                                                       |
| JavaScript startup       | `npx expo start --dev-client --ios`                                                        | `iOS Bundled 16934ms node_modules/expo-router/entry.js (2285 modules)` on 57.0.27, then `699ms (2140 modules)` cached on 57.0.28; onboarding rendered both times          |

The final repair-cycle rerun regenerated `ios/` and `android/` with
`npx expo prebuild --clean` (CocoaPods installed, the generated Podfile carries
the already-quoted guard for the expo-constants script phase) and then built
Debug for the iPhone 17 simulator into a dedicated derived-data path on the
SSD; it finished at 2026-10-12 21:35 +04 with `** BUILD SUCCEEDED **`. That
rerun also used Node.js 26.7.0, so the engines-range caveat in the Toolchain
section applies to it as well.

The error-level device log after startup contains no crash. It shows iOS 27
deprecation assertions for `UIApplication` status-bar calls made by React
Native dependencies, the expected Firebase Installations 400 from the
committed emulator-only placeholder `GoogleService-Info.plist`, and a refused
React DevTools connection.

Xcode 27.0 in `-quiet` mode prints `error: the following command failed with
exit code 0 but produced no further output` for Swift compiles that only
emitted warnings. Builds still succeed; only archives treat it as fatal
(expo/expo#50279 and #50482 track it).

## iOS Release simulator evidence (13 October 2026)

This check ran after the expo-constants phase fix, from the SSD checkout path
that contains spaces.

| Step                    | Command                                                                                                                                            | Result                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Generate iOS project    | `npx expo prebuild --clean --platform ios`, then `pod install`                                                                                     | Succeeded; the generated Pods project carries the rewritten "Generate app.config" phase                                                         |
| Release simulator build | `xcodebuild -workspace ios/Hakeemi.xcworkspace -scheme Hakeemi -configuration Release -sdk iphonesimulator -derivedDataPath <new dir> clean build` | `** BUILD SUCCEEDED **` with Xcode 27.0 (27A266a) and the `preview` profile environment; the phase ran `getAppConfig.js`                        |
| Embedded manifest       | Inspect the built `Hakeemi.app` without modifying it                                                                                               | `EXConstants.bundle/app.config` present, with `name`, `slug`, `scheme`, `version`, `ios`, `plugins` and `sdkVersion`                            |
| Cold launch             | `xcrun simctl install` of the built app, then `xcrun simctl launch` on iPhone 17, iOS 27.0                                                         | Onboarding rendered from a fresh install; no crash report and no expo-constants manifest error in the device log; the process was still running |

The device log shows the expected Firebase Installations 400 from the
committed emulator-only placeholder `GoogleService-Info.plist`.

## Android evidence

| Step               | Command                                                                                                  | Result                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Debug APK          | `android/gradlew -p android assembleDebug -PreactNativeArchitectures=arm64-v8a`                          | `BUILD SUCCESSFUL`, 801 tasks, with `JAVA_HOME` set to OpenJDK 17.0.19 (Gradle 9.3.1, AGP 8.12) |
| Install and launch | `adb install -r`, `adb reverse tcp:8081`, `am start -a VIEW -d hakeemi://expo-development-client/?url=…` | Installed on a Pixel-7-class emulator, Android 16 (API 36, arm64-v8a); activity launched        |
| JavaScript startup | Metro from `npx expo start --dev-client`                                                                 | `Android Bundled 7229ms node_modules/expo-router/entry.js (2374 modules)`; onboarding rendered  |

Logcat shows `Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}`,
AppContext and JSI interop initialised, and no `AndroidRuntime` error or
native fatal.

The same build fails on JDK 24 and newer: AGP's `configureCMakeDebug` tasks
for `react-native-worklets` and `react-native-screens` abort on the JDK's
`WARNING: A restricted method in java.lang.System has been called`, which the
prefab child process prints to stderr. Adding `--enable-native-access` to the
Gradle daemon does not reach that child process, so the practical rule is a
JDK 17 to 21 for Android builds. Android Studio's bundled runtime is JBR 25 on
the verification host, so `JAVA_HOME` must point elsewhere.

## Not covered by this pass

- Physical-device validation on iOS 27 and Android 16 remains a release
  sign-off task; this pass used the iOS Simulator and the Android Emulator.
- No archive was produced. The only Release build is the simulator build
  described below.
