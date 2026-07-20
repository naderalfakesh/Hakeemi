# ADR 0002: Isolate Firebase environments and develop emulator-first

- Status: Accepted
- Date: 2026-07-19

## Context

The legacy repository referenced the Firebase project `hakeemi`. Its deployed
data model, authorization rules, and operational state are not documented in
source control. Reusing that project would mix an unverified 2021 backend with
the rebuilt client and make destructive mistakes harder to detect.

The portfolio rebuild needs a reproducible backend that can be tested without
network access, populated only with fictional data, and promoted deliberately.

## Decision

- Leave the legacy `hakeemi` project untouched.
- Use `hakeemi-portfolio-dev` as the owned development project.
- Place the development Firestore database and 2nd-generation Functions in
  `me-central1` (Doha), close to the portfolio app's UAE audience.
- Use `hakeemi-portfolio-dev` for the interactive Emulator Suite so native SDK
  requests, callable routes, and seeded data share the project ID embedded in
  the ignored Firebase service files. The app connects every used service to
  localhost before issuing requests.
- Use the synthetic project ID `demo-hakeemi` for automated authorization,
  profile, and booking tests. Firebase reserves the `demo-` prefix for projects
  that cannot accidentally address live resources.
- Do not commit `.firebaserc`. Cloud commands must name their target explicitly
  with `--project hakeemi-portfolio-dev`.
- Do not commit native Firebase service configuration files. Local development
  uses ignored files; EAS environments will provide file variables later.
- Keep Firestore and Storage default-deny. Client access is granted only for
  named paths and is verified against the Emulator Suite before deployment.
- Keep Cloud Storage emulator-only until a billing account and budget alert are
  deliberately approved. Since February 2026, Firebase requires the Blaze plan
  to provision or access Cloud Storage buckets.
- Use a Node.js 22 TypeScript Functions workspace, matching Firebase's current
  supported runtimes, even though the mobile workspace may run on Node.js 24.

## Consequences

- Local development and automated authorization tests do not require cloud
  credentials.
- A developer must explicitly choose a real project for any deployment.
- Expo development builds are required once React Native Firebase is linked;
  Expo Go is not a supported runtime for the native SDK.
- A future production project will be separate from both development and the
  legacy backend.
- Firestore and Authentication can be exercised against the development
  project without enabling Cloud Storage billing.

## References

- [Firebase CLI project aliases and open-source guidance](https://firebase.google.com/docs/cli#project_aliases)
- [Choose a Firebase project for the Emulator Suite](https://firebase.google.com/docs/emulator-suite/connect_firestore#choose_a_firebase_project)
- [Test Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Use Firebase with Expo](https://docs.expo.dev/guides/using-firebase/)
- [Supported Cloud Functions runtimes](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version)
