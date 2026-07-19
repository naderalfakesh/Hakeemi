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

Run all emulators with:

```sh
npm run firebase:emulators
```

The services bind to all local interfaces so iOS Simulator and Android Emulator
can connect. The Emulator UI and hub remain bound to `127.0.0.1`. Do not expose
these ports on an untrusted network.

Authorization tests use the reserved synthetic project ID `demo-hakeemi`:

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

Local native configuration lives under ignored `.firebase/development/` paths:

- `.firebase/development/google-services.json`
- `.firebase/development/GoogleService-Info.plist`

EAS preview and production environments will supply equivalent files through
file environment variables rather than source control.

Expo CNG reads `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICES_INFO_PLIST` from the
build environment and falls back to the ignored development files above. A
clean native rebuild is required whenever an RNFirebase module is added or
removed:

```sh
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

The app connects Auth, Firestore, and Functions to `127.0.0.1` on iOS Simulator
and `10.0.2.2` on Android Emulator when
`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`. Production and preview environments
must set it to `false`.

## References

- [Configure Authentication providers with Firebase CLI](https://firebase.google.com/docs/auth/configure-providers-cli)
- [Cloud Firestore locations](https://firebase.google.com/docs/firestore/locations)
- [Cloud Functions locations](https://firebase.google.com/docs/functions/locations)
- [Cloud Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
