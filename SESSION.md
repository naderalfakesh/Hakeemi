# Current Session

- Current phase: Phase 2 in progress — secure accounts and live provider data.
- Legacy baseline: `dade72b`, preserved by the `legacy-v1` tag.
- Phase 1 proof: [`docs/phase-1-verification.md`](docs/phase-1-verification.md).
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
- Cloud verification: the primary provider-list index is ready and the
  specialty-ordering index is deployed and completing its background build.
  The exact native contract reads 6 providers, 6 specialties, and ordered slots
  from the seeded development project.
- Billing boundary: Cloud Storage remains emulator-only; enabling it now
  requires the Blaze plan and an explicit billing decision.
- Next action: persist locale/theme preferences behind the existing owner-only
  rules and close Phase 2 with end-to-end verification.
- Source of truth: [`docs/ROADMAP.md`](docs/ROADMAP.md).
