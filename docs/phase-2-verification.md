# Phase 2 Verification

> Verified: 2026-07-20
>
> Final implementation commit: `a399348`
>
> Scope: secure accounts, server-owned profiles, live provider discovery, and
> synchronized app preferences

## Outcome

Phase 2 passes its definition of done. Native iOS runs with the React Native
Firebase Auth, Firestore, and Functions modules generated through Expo CNG. The
app reads the fictional provider catalogue from the development Firestore
project, while the full account lifecycle runs reproducibly against the local
Firebase Emulator Suite.

The split is deliberate: public cloud discovery proves the deployed data,
rules, and indexes; local authenticated testing proves the callable profile
boundary and owner-only writes without retaining test accounts or depending on
a paid Firebase plan.

## Native end-to-end evidence

The iPhone 17 Pro simulator on iOS 26.5 completed these flows through the
rendered UI and accessibility tree.

### Development project

1. Launch the Expo development build with cloud Firebase services enabled.
2. Open Find Care and receive all 6 fictional clinicians.
3. Select Cardiology and receive only Dr. Omar Rahman.
4. Open the provider detail route and load the matching clinic and ordered
   availability data.

![Cloud-backed Cardiology result](images/find-care-cloud.png)

![Cloud-backed provider detail](images/provider-detail-cloud.png)

### Emulator Suite

1. Create a fictional email/password account through the native sign-up form.
2. Reach the email-verification handoff state.
3. Execute `bootstrapUserProfile` with a valid Auth context. The callable ran
   more than once during Auth-state synchronization and returned the same
   server-owned profile, proving the idempotent path.
4. Load the authenticated profile in the app.
5. Change appearance to dark and preferred language to Arabic.
6. Read the exact owner preference document and verify `theme=dark` and
   `locale=ar` with a server timestamp.
7. Terminate the app process, relaunch it, and confirm Auth, profile, and
   preference restoration before navigation.
8. Delete the disposable Auth account and its exact profile and preference
   documents before exporting emulator state.

![Restored account with synchronized dark-mode preferences](images/profile-preferences-dark.png)

The first local preference read encountered a transient Firestore Emulator
`GOAWAY: too_many_pings` connection reset after the emulator had been restarted.
The designed retry action reconnected and completed successfully. This was
isolated to the local emulator session; the authenticated cloud preference
smoke test had already passed.

## Firebase development-project evidence

Project: `hakeemi-portfolio-dev`. The legacy `hakeemi` project was not changed.

- Firestore Native/Standard database in `me-central1`, with deletion protection
  enabled.
- Email/password Authentication enabled.
- iOS, Android, and web applications registered for the rebuilt app.
- 24 deterministic fictional seed documents loaded; no real clinician or
  patient data is present.
- All discovery and specialty-filter composite indexes report `READY`.
- Exact cloud queries return 6 providers, 6 specialties, ordered availability,
  and the expected specialty/cursor result.
- A disposable cloud Auth user passed an owner-only preference write/read smoke
  test. The Auth account and exact Firestore document were deleted afterward.

Cloud Functions and Cloud Storage remain emulator-only because provisioning and
deployment require enabling the Firebase Blaze plan. The application and
documentation do not claim those services are deployed.

## Build and quality evidence

| Check                   | Result                                                                   |
| ----------------------- | ------------------------------------------------------------------------ |
| iOS native build        | Expo CNG build linked RNFB App/Auth/Firestore/Functions 25.1.0; 0 errors |
| Android native build    | arm64 debug APK built successfully                                       |
| Static web export       | 17 routes exported successfully                                          |
| Application tests       | 20 Jest suites, 50 tests passed                                          |
| Function tests          | 3 tests passed                                                           |
| Firestore/Storage rules | 13 tests passed                                                          |
| Callable integration    | Auth + Firestore + Functions emulator test passed                        |
| TypeScript              | App, Firebase tests/tooling, and Functions strict checks passed          |
| Lint and formatting     | Passed                                                                   |
| Expo Doctor             | 20/20 checks passed                                                      |

`npm audit --omit=dev` reports 15 moderate advisories and no high or critical
advisories. The findings are in Expo and React Native Firebase dependency
chains; the proposed automatic fixes require incompatible downgrades, so they
were not applied.

## Security properties verified

- Public clients can read only active discovery resources and available slots.
- User profiles are readable only by their owner and cannot be created or
  mutated directly by the mobile client.
- App preferences accept only `en`/`ar`, `system`/`light`/`dark`, and a server
  timestamp under `users/{uid}/preferences/app`.
- Cross-user reads and writes fail in automated rules tests.
- Provider pagination uses a stable opaque cursor aligned with the Firestore
  ordering contract.
- Native Firebase configuration files remain untracked.

## Non-blocking warnings

- The iOS build reports generated-project warnings for duplicate C++ libraries
  and dependency analysis in Expo/RNFirebase/CocoaPods build phases.
- The Functions emulator used the host Node 26 runtime while the deployed
  contract targets Node 22. Function unit and integration tests still passed;
  production deployment remains deferred with billing.
- Jest reports a local Watchman recrawl warning.

None of these warnings originates in Hakeemi feature logic or invalidates the
verified Phase 2 flows.
