# ADR 0001: Adopt Expo with Continuous Native Generation

- Status: Accepted
- Date: 2026-07-19
- Decision owners: Hakeemi maintainers

## Context

The legacy application was created with React Native 0.64.1 and manually tracks
its iOS and Android projects. It uses React Native Firebase Auth and Firestore,
but it contains no product-specific Java, Kotlin, Objective-C, Swift, or C++
implementation. Maintaining the native projects therefore adds upgrade and
release work without preserving a unique native capability.

The rebuild needs current React Native, native Firebase SDKs, notifications,
calendar access, deep links, reliable preview builds, and room for future custom
native functionality. It must also be easy to reproduce as a public portfolio
project.

At the time of this decision, Expo SDK 57 is the current stable line and targets
React Native 0.86, React 19.2.3, Node.js 22.13 or later, Android API 36, and iOS
16.4 or later.

## Decision

Use Expo SDK 57 with:

- the React Native New Architecture;
- Expo Router and typed routes;
- `expo-dev-client` rather than an Expo Go-only workflow;
- Continuous Native Generation (CNG);
- generated `ios/` and `android/` directories excluded from version control;
- React Native Firebase configured through Expo config plugins;
- EAS development, preview, and production build profiles;
- native integrations added through Expo modules, community native libraries,
  config plugins, or a local Expo Module as requirements demand.

The stable Expo SDK/RN pairing must be rechecked immediately before the new
scaffold is generated. A patch or canary release is not allowed without a
separate recorded decision and verification plan.

## Why this is the senior portfolio choice

The goal is not to avoid native development. The goal is to automate generated
native configuration while retaining the ability to diagnose and extend the
native application. The project will still exercise native builds, signing,
Firebase native SDKs, permissions, notifications, calendars, platform-specific
behavior, and real-device testing.

Choosing a manually maintained bare scaffold solely as a portfolio signal would
opt into recurring native diff work without a product requirement. The ADR,
config plugins, clean prebuild verification, and documented escape hatch show
more architectural judgment than preserving unnecessary generated files.

## Consequences

### Positive

- React Native and native project upgrades start from a known Expo template.
- Native configuration is declarative, reviewable, and regenerable.
- EAS can create reproducible development and preview builds.
- Expo Router provides typed, deep-linkable routes without nested navigator
  boilerplate.
- The app can use React Native Firebase and other custom native dependencies
  through its own development client.

### Costs

- Any native dependency change requires rebuilding the development client.
- Direct edits inside generated native directories will be discarded.
- Native customizations must be expressed as a config plugin or module.
- Expo SDK release compatibility constrains the React Native version.

## Escape hatch

If a product requirement cannot be implemented cleanly with an Expo module,
community library, config plugin, or local Expo Module:

1. document the requirement and rejected plugin/module approaches in a new ADR;
2. verify the native change on both platforms;
3. decide whether to keep the customization in a local module or start tracking
   the native projects;
4. retain Expo CLI and EAS where they continue to provide value.

Moving to tracked native projects is an architecture change, not an “eject”
failure mode.

## Alternatives considered

### Upgrade the existing bare project in place

Rejected. The distance between React Native 0.64 and 0.86 crosses the New
Architecture transition and multiple native build-system generations. The
existing native projects contain no product-specific implementation worth
carrying through that upgrade chain.

### Create a new bare React Native Community CLI project

Rejected for the current requirements. It provides direct control, but that
control is not needed by the product and makes routine upgrades and public
reproduction more expensive.

### Use Expo Go and the Firebase JavaScript SDK

Rejected. Expo Go is useful for early prototyping, but Hakeemi is intended to
demonstrate a production-shaped development build and use native Firebase
services such as Crashlytics and messaging.

## References

- [Expo SDK version matrix](https://docs.expo.dev/versions/latest/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Using React Native Firebase with Expo](https://docs.expo.dev/guides/using-firebase/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
