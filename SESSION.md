# Current Session

- Current phase: Phase 3 in progress — trustworthy appointment booking.
- Legacy baseline: `dade72b`, preserved by the `legacy-v1` tag.
- Phase 1 proof: [`docs/phase-1-verification.md`](docs/phase-1-verification.md).
- Phase 2 proof: [`docs/phase-2-verification.md`](docs/phase-2-verification.md).
- Development backend: `hakeemi-portfolio-dev`; the legacy `hakeemi` project is
  intentionally untouched.
- Backend foundation: Auth, Firestore, native app registrations, rules, indexes,
  emulator tests, and deterministic fictional seed tooling are configured. The
  development project contains the 24-document fictional seed.
- Native integration: Expo CNG configures React Native Firebase Auth, Firestore,
  and Functions. iOS Simulator, Android arm64, and static web export checks pass.
- Account UI: typed sign-in, sign-up, password recovery, and email verification
  routes are connected to a platform-safe Firebase Auth adapter.
- Session/profile: one app-level provider restores Auth before navigation, and
  an emulator-tested callable creates the server-owned user profile idempotently.
- Provider data: native builds now use a bounded React Native Firebase
  repository with Zod-validated DTO mappers; Jest and the static web portfolio
  export resolve an explicit deterministic fixture adapter.
- Server state: TanStack Query owns stable discovery/detail keys, retry and
  caching; provider discovery uses tested opaque Firestore cursor pages.
- Preferences: owner-only locale/theme choices sync through Firestore with
  optimistic updates and rollback; the theme preference updates the live app.
- Cloud verification: all provider indexes are ready. Exact discovery and
  specialty query contracts pass against the 6-provider development seed, and
  a disposable authenticated owner preference write/read passed with complete
  Auth and document cleanup.
- Billing boundary: Cloud Storage remains emulator-only; enabling it now
  requires the Blaze plan and an explicit billing decision.
- Native verification: cloud discovery/filter/detail, emulator-backed sign-up,
  idempotent profile bootstrap, owner preference writes, dark/Arabic sync, and
  cold-process restoration all pass. Disposable verification data was removed.
- Portfolio documentation: the README now presents the rebuilt product,
  evidence, architecture decisions, backend safeguards, and reproducible setup
  without claiming planned features as complete.
- Booking contract: executable server schemas now define valid request, slot,
  and appointment records; slot and appointment rules require bounded reads and
  keep all lifecycle writes server-controlled.
- Booking implementation: the authenticated `bookAppointment` callable now
  derives a deterministic appointment ID and atomically validates and reserves
  one server-owned slot. ADR 0003 records the retry and contention guarantees.
- Booking verification: a dedicated callable integration suite now covers
  success, safe replay, request-key conflicts, simultaneous contention, time
  bounds, provider ownership, missing slots, forged identity, and anonymous
  access.
- Mobile availability: discovery and provider details now share cached,
  Zod-validated availability queries bounded to a stable 14-day window; the
  provider screen presents all returned times with visit mode and timezone.
- Next action: build the authenticated date/time, visit detail, review, and
  confirmation journey on top of the proven booking callable.
- Source of truth: [`docs/ROADMAP.md`](docs/ROADMAP.md).
