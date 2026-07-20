# Current Session

- Current phase: Phase 4 in progress — native E2E follow-through remains after
  the calendar/notification/reminder checkpoint.
- Legacy baseline: `dade72b`, preserved by the `legacy-v1` tag.
- Phase 1 proof: [`docs/phase-1-verification.md`](docs/phase-1-verification.md).
- Phase 2 proof: [`docs/phase-2-verification.md`](docs/phase-2-verification.md).
- Phase 3 proof: [`docs/phase-3-verification.md`](docs/phase-3-verification.md).
- Development backend: `hakeemi-portfolio-dev`; the legacy `hakeemi` project is
  intentionally untouched.
- Backend foundation: Auth, Firestore, native app registrations, rules, indexes,
  emulator tests, and deterministic fictional seed tooling are configured. The
  development project contains the 24-document fictional seed.
- Native integration: Expo CNG configures React Native Firebase Auth, Firestore,
  Functions, Messaging, Expo Calendar, and Notifications. iOS Simulator,
  Android arm64, and static web export checks pass.
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
- Mobile booking: a safe AsyncStorage draft survives authentication, booking is
  blocked offline rather than queued, and typed details/review/confirmation
  routes invoke the idempotent callable with a stable Expo Crypto request ID.
- Appointment proof: iOS completed the full sign-up-to-confirmation journey,
  restored the owner appointment after process restart, and Android API 36.1
  built, installed, loaded Firestore availability, and rendered the slot actions.
- Appointment management: transactional cancellation and same-provider
  rescheduling now release/reserve slots atomically, enforce a 15-minute policy,
  preserve audit metadata, and use server-only idempotency receipts.
- Appointment experience: upcoming, past, cancelled, and detail routes are
  available with offline-aware cancel/reschedule hooks and tested confirmation
  states. Confirmed detail screens can add a non-sensitive event through the
  native Expo calendar adapter; web/Jest report an unavailable calendar.
- Notification experience: the Profile screen has explicit optional permission
  education, native FCM token registration uses a callable Function with token
  refresh updates, and typed appointment reminder payloads route to the detail
  screen after Auth restoration.
- Reminder delivery: a Pub/Sub-backed scheduled Function sends generic
  privacy-safe reminders in a bounded 24-hour window, records idempotent
  delivery receipts, and disables invalid device tokens without logging or
  sending sensitive details.
- Haptics: successful booking and destructive appointment confirmation use
  restrained native haptics with deterministic web/Jest adapters.
- Saved clinicians: authenticated users can bookmark active providers into an
  owner-only Firestore subcollection, toggle the bookmark from provider detail,
  and remove entries from the Profile shortlist with optimistic rollback.
- Interactive emulator identity: native journeys use the local
  `hakeemi-portfolio-dev` namespace to match the ignored service files;
  automated rules and contention tests stay isolated on `demo-hakeemi`.
- Phase 4 management quality: 33 app suites/98 tests, 12 Functions unit tests,
  5 appointment-management, 2 notification-token, and 1 appointment-reminder
  callable integration tests, 14 rules tests, 21 static routes, and Expo Doctor
  20/20 all pass.
- Next action: verify calendar/notification and management journeys natively on
  iOS and Android, then continue the inclusive/resilient Phase 5 pass.
- Phase 5 foundation: the root route now recovers from render failures with
  privacy-safe development logging, AppText keeps Dynamic Type enabled and
  applies RTL writing direction, and date/time formatters follow the selected
  English/Arabic locale; clinician counts and catalog labels now use Arabic
  plural/field data as well.
- Arabic localization: every screen reads copy from typed bilingual
  `LocalizedStrings` bundles via `useStrings` — including accessibility labels,
  validation schemas (message-parameterized factories), and auth/appointment
  error mappings localized at the presentation layer. Arabic plural rules cover
  clinician, review, and availability counts. English output stayed
  byte-identical.
- RTL layout: choosing Arabic persists the native direction through
  `I18nManager.allowRTL/forceRTL` (with rollback if toggled back before
  restart) and shows a restart hint under the language preference; directional
  arrows/chevrons mirror inside `DecorativeIcon`; onboarding decor uses logical
  `start`/`end` offsets. Web keeps LTR layout with RTL text direction.
- Offline-aware caching: discovery and the appointment list keep cached
  results when a refresh fails and surface a localized `StaleDataNotice`
  (offline or refresh-failed, with last update time) through a polite live
  region; error states remain for loads with no cached data. Recorded in ADR 0004. Bookings are still never queued offline.
- Motion and scaling polish: a shared `useAppMotion` hook exposes motion
  tokens plus the reduce-motion preference, and the root/auth/booking stacks
  switch to instant transitions when reduced motion is on. `AppText` caps
  Dynamic Type at 2× to protect dense rows, destructive/confirm actions
  (cancel, confirm cancellation, reschedule, confirm booking) carry localized
  accessibility hints, and the saved-clinician row meets the 44 pt target.
- Arabic copy review: a native-level MSA pass tightened grammar and
  consistency (dual/singular counts now drop the redundant numeral, «ملغى»,
  transitive reschedule label, unified «معرض الأعمال» terminology, natural
  greeting) across all bundles.
- Provider data localization: provider names, credentials, bios, and languages
  are bilingual end to end. Firestore keeps the English `displayName` string
  for ordering/cursors and adds optional `*Ar` fields; the mapper composes
  `LocalizedText` with English fallback for untranslated documents. The seed
  catalog, seed schema, and search terms (Arabic names/languages/specialties)
  are updated, and `hakeemi-portfolio-dev` was reseeded with the 24-document
  bilingual catalog.
- Native Arabic/RTL proof: an interactive iOS Simulator journey (dev build +
  seeded emulators) verified the language switch, restart hint, full RTL
  mirroring after relaunch, bilingual provider data, Arabic dates/currency,
  and correct plural forms. Screenshots live in `docs/images/*arabic-rtl*`.
  The run surfaced and fixed two native-only defects: Hermes lacks
  `Intl.PluralRules` (CLDR fallback added with parity tests) and the route
  error boundary crashed outside `AppThemeProvider` (now self-themed).
- Phase 5 open items: VoiceOver/TalkBack journeys and
  device-size/rotation/keyboard evidence on small phones and tablets.
- Phase 6 quality gate: GitHub Actions now runs the app, Firebase, Functions,
  rules, booking, management, notification-token, and scheduled-reminder
  contracts; EAS profiles remain explicit but signing/preview artifacts require
  external Expo and Apple/Google credentials.
- Source of truth: [`docs/ROADMAP.md`](docs/ROADMAP.md).
