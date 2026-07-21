# Phase 6 Verification — Quality Gates and Release Boundary

> Verified: 2026-07-20

## Delivered

- GitHub Actions runs install, formatting, lint, strict app/Firebase/Functions
  type checks, Jest, Functions unit tests, Expo Doctor, Firestore rules, and
  every callable/emulator contract: profile bootstrap, booking, appointment
  management, notification-token registration, and scheduled reminders.
- The workflow uses the checked-in `.nvmrc`, npm lockfiles, Java 21 for Firebase
  emulators, read-only repository permissions, cancellation of superseded runs,
  and a 30-minute ceiling for the full emulator matrix.
- `eas.json` contains development, simulator, preview, and production profiles
  with explicit environment boundaries and `requireCommit: true`.
- The 16 bundled illustrations use native-safe WebP and total 808.8 KB, down
  from roughly 4.6 MB. `npm run assets:check` enforces 150 KB per file and 1 MB
  aggregate as part of local validation and CI.

## Intentionally open release gates

EAS signing credentials and installable preview artifacts require an Expo owner
login and Apple/Google credentials, so they are not fabricated in source. App
Check enforcement, Crashlytics/Performance Monitoring, privacy-safe analytics
instrumentation, performance budgets, and real-device VoiceOver/TalkBack smoke
evidence also require project-console, measurement, or hardware work. Weekly
dependency-health scheduling is now delivered. The development Firebase project
remains the only configured project; production deployment still requires an
explicit billing and operations decision.
