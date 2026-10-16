# Firebase development environment

The rebuilt application uses the isolated Firebase project
`hakeemi-portfolio-dev`. The legacy project `hakeemi` must not be used by the
modern client or deployment scripts.

## Provisioned resources

| Resource         | Configuration                                                  |
| ---------------- | -------------------------------------------------------------- |
| Firebase project | `hakeemi-portfolio-dev` (`Hakeemi Portfolio Dev`)              |
| Cloud Firestore  | Native mode, `me-central1` (Doha), deletion protection enabled |
| Authentication   | Email/password provider enabled                                |
| Android app      | `com.naderalfakesh.hakeemi`                                    |
| iOS app          | `com.naderalfakesh.hakeemi`                                    |
| Web app          | CLI-managed default app used to provision Auth configuration   |
| Cloud Storage    | Emulator only; no billing account attached                     |
| Cloud Functions  | Emulator workspace only; deployment deferred                   |

The mobile app identifiers and Firebase client configuration are public
identifiers, not authorization secrets. Even so, the generated
`google-services.json` and `GoogleService-Info.plist` files stay out of Git so
development, preview, and production builds cannot be mixed accidentally.

## Local backend

Run all emulators, including Pub/Sub for scheduled reminder functions, with:

```sh
npm run firebase:emulators:seeded
```

The interactive suite deliberately uses the `hakeemi-portfolio-dev` namespace
because the iOS and Android service files — the committed emulator placeholders
or the ignored real files — identify that project. All services used by the app
are connected to localhost before any reads or writes; keep the full suite
running while using this command. On a fresh clone it starts clean and seeds
the fictional catalogue once the emulators are ready; state is exported to the
ignored `.firebase/emulator-data` directory on exit. Later runs import the
saved local state and automatically roll fictional provider availability
forward from the current UTC date, so a previously exported snapshot cannot
leave the calendar with expired slots. Confirmed appointments keep their
reserved slots; the rolling seed only updates availability that is still open.

No Firebase login or credentials are required for any emulator command,
including the interactive seeded suite.

Use `npm run firebase:emulators` only when you intentionally need a clean,
unseeded suite.

The services bind to all local interfaces so iOS Simulator and Android Emulator
can connect. The Emulator UI and hub remain bound to `127.0.0.1`. Do not expose
these ports on an untrusted network.

Automated authorization, profile, and booking tests use the reserved synthetic
project ID `demo-hakeemi`:

```sh
npm run firebase:rules:test
```

No cloud login is required for this command, and attempts to reach non-emulated
services fail by design.

Seed an ephemeral Firestore emulator with validated fictional data:

```sh
npm run firebase:seed:emulator:exec
```

When the full Emulator Suite is already running, use
`npm run firebase:seed:emulator` instead. The seed uses stable document IDs and
rolls availability forward from the current UTC date, so rerunning it updates
the same catalogue rather than creating duplicates. Pass
`-- --reference-date YYYY-MM-DD` to the Functions seed script when a fixed
reference date is needed for diagnosis.

## Intentional deployment

There is no committed `.firebaserc`. Every cloud operation must name the target
project:

```sh
npx firebase deploy --only auth,firestore --project hakeemi-portfolio-dev
```

Run the emulator authorization suite before deploying rule changes. Cloud
Storage is excluded because new Firebase Storage buckets require the Blaze
pay-as-you-go plan. If Storage becomes necessary, attach billing manually, add a
budget alert first, and document the decision.

The cloud seed is deliberately separate and allowlisted:

```sh
npm run firebase:seed:development
```

It requires Google Application Default Credentials for the Firebase owner and
refuses any project other than `hakeemi-portfolio-dev`.

## Generated mobile configuration

Native builds resolve their Google service files in this order:

1. Explicit `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICES_INFO_PLIST`
   environment paths (EAS preview and production supply real files through
   file environment variables rather than source control).
2. Ignored local files for a real project:
   `.firebase/development/google-services.json` and
   `.firebase/development/GoogleService-Info.plist`.
3. Committed emulator-only placeholders in `firebase/templates/emulator/`,
   which contain no real identifiers and let a fresh clone build and run
   against the Emulator Suite without a Firebase project. Cloud features such
   as FCM device registration do not work with the placeholders.

A clean native rebuild is required whenever an RNFirebase module is added or
removed, or when the resolved service files change:

```sh
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

The app connects Auth, Firestore, and Functions to `127.0.0.1` on iOS Simulator
and `10.0.2.2` on Android Emulator when
`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`. Production and preview environments
must set it to `false`; the flag is only accepted together with
`EXPO_PUBLIC_APP_ENV=development`, and `src/config/env.ts` rejects any other
combination at startup.

Release bundles fail closed. Metro compiles `__DEV__` to `true` for development
bundles and `false` for release bundles (`expo run:ios --configuration Release`,
`expo run:android --variant release`, and every EAS preview or production
build). A development bundle may run without a `.env` file and falls back to the
development channel, `hakeemi-portfolio-dev`, and the Emulator Suite. A release
bundle receives no defaults: a missing or blank `EXPO_PUBLIC_APP_ENV`,
`EXPO_PUBLIC_FIREBASE_PROJECT_ID`, or `EXPO_PUBLIC_USE_FIREBASE_EMULATORS`, or
an emulator flag set to `true`, throws while the environment module loads, so
the app stops at startup rather than reaching `127.0.0.1`. The native Firebase
initializer applies the same rule a second time and only connects the emulators
when the bundle is a development bundle and the channel is `development`. The
`eas.json` profiles set all three variables explicitly for every profile.

The authenticated `bootstrapUserProfile` callable owns creation and
reconciliation of `users/{uid}`. Firestore rules deny direct client creation and
mutation. Its unit and emulator integration checks are available through:

```sh
npm run test:functions
npm run firebase:profile:test
```

Cloud Functions remain emulator-only until a deliberate Blaze billing decision
is made; no billing account is attached by this repository workflow.

## References

- [Configure Authentication providers with Firebase CLI](https://firebase.google.com/docs/auth/configure-providers-cli)
- [Cloud Firestore locations](https://firebase.google.com/docs/firestore/locations)
- [Cloud Functions locations](https://firebase.google.com/docs/functions/locations)
- [Cloud Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
