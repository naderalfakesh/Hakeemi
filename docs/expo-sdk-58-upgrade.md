# Expo SDK 58 Upgrade

> Verified: 2026-10-17
>
> Scope: Expo SDK 57 to SDK 58 (stable), React Native 0.88, iOS scene
> lifecycle, Xcode 27 and Android release builds

## Versions

| Package                 | Before  | After   |
| ----------------------- | ------- | ------- |
| expo                    | 57.0.30 | 58.0.14 |
| react-native            | 0.86.3  | 0.88.0  |
| react / react-dom       | 19.2.3  | 19.3.0  |
| expo-router             | 57.0.28 | 58.0.23 |
| expo-notifications      | 57.0.23 | 58.1.5  |
| react-native-reanimated | 4.5.1   | 4.7.1   |
| react-native-worklets   | 0.10.1  | 0.13.0  |
| gesture-handler         | 2.32    | 3.3     |
| jest / jest-expo        | 29 / 57 | 30 / 58 |
| React Native Firebase   | 25.1.0  | 25.1.0  |

`expo` 58.0.14 was the npm `latest` tag (not a prerelease) on the
verification date. Every other Expo-managed version is the one
`npx expo install --fix` selects for it; `npx expo install --check` reports
the dependencies as up to date.

## Changes

- `ios.enableSceneSupport` is removed from `expo-build-properties`. SDK 58
  generates `SceneDelegate.swift` and the `UIApplicationSceneManifest` itself,
  and prebuild warns that the option is a no-op.
- `plugins/with-firebase-app-configure.js` adds `FirebaseApp.configure()` to
  the generated AppDelegate. SDK 58 starts React Native from the scene
  delegate, so the AppDelegate no longer contains the `factory.startReactNative(`
  call that `@react-native-firebase/app` (25.x, and 26.4.0 at the time of
  writing) uses as its insertion anchor, and the upstream plugin skips the
  call with a warning. The local plugin does nothing when the call is already
  present.
- `plugins/with-react-native-bundle-script-quoting.js` leaves the SDK 58
  bundle phase alone. The SDK 58 template already wraps the
  `react-native-xcode.sh` substitution in quotes, and the old rewrite turned
  that form back into an unquoted one.
- `expo-status-bar` is listed in `plugins`, as `npx expo install` requests.
- Jest uses `react-native-reanimated/jest/resolver.js`, which reanimated 4.7
  ships for its native-only modules, and `jest.setup.js` routes React Native
  0.88's private asset registry to the stub jest-expo already provides.
- React Native 0.87 made the strict TypeScript API the default: the onboarding
  pager ref is typed as `ScrollViewInstance`, and a list footer returns
  `undefined` instead of `null`.
- One `import/namespace` lint error is disabled inline. eslint-plugin-import
  does not recognise expo-notifications' compiled enum module as an ES module;
  the enum is exported at runtime and TypeScript checks the member.

## Behaviour to know about

- `expo-notifications` now shows notifications that arrive in the foreground
  unless a handler says otherwise. Hakeemi sets no notification handler, so
  appointment reminders received while the app is open are now shown.
- Android release builds run R8 (`android.enableMinifyInReleaseBuilds=true`).
  The release APK launches, initialises Firebase and reaches Firebase Auth
  without extra keep rules.
- The `@react-native-firebase/auth` openURL guard for `firebaseauth` links is
  no longer added, because the SDK 58 AppDelegate has no `openURL` override.
  Hakeemi uses email and password sign-in only, which does not use that
  redirect.

## Verification

- `npm ci` from the lockfile, `npx expo install --check`, Expo Doctor 20/20
  (local 1.20.4 and 1.21.5), and `npm run validate`: Prettier, ESLint, strict
  TypeScript, 47 Jest suites, Functions tests.
- All six Firebase emulator suites pass.
- iOS: Release simulator build with Xcode 27.0 and the iOS 27 SDK. On an
  iOS 27 simulator the app launches with a `UIWindowScene`, configures the
  default Firebase app, and renders onboarding, Welcome, Sign-in and the guest
  tabs. A synthetic sign-in reaches the Firebase Auth endpoint. `expo run:ios`
  boots the simulator, installs and launches the app while Device Hub is
  running.
- Android: `:app:assembleRelease` with JDK 17, launched on an API 36 emulator
  with the same flows and no fatal exceptions.

Successful sign-in, sign-out push-token cleanup and reminder delivery need a
real Firebase project and were covered by the emulator suites, not on device.
