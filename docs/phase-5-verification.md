# Phase 5 Verification — Inclusive and Resilient Foundation

> Verified: 2026-07-20
>
> Scope: route recovery, privacy-safe development diagnostics, text scaling,
> locale-aware date/time formatting, RTL-aware text direction, and the full
> Arabic UI copy plus native RTL layout pass. On-device VoiceOver/TalkBack
> sign-off and a native-speaker Arabic copy review remain manual
> follow-through.

## Delivered foundation

- The root Expo Router layout exports an error boundary with a recoverable
  “Try again” state instead of exposing a red screen or a blank route.
- Development error logs record only a stable scope, error name, optional code,
  and redacted metadata. Error messages, patient/provider identity, tokens,
  email addresses, and passwords are not emitted by the safe logger.
- `AppText` keeps `allowFontScaling` enabled, exposes a minimum 44 pt control
  size through the design-system tokens, and applies RTL writing direction when
  the synchronized Arabic preference is active.
- Discovery, provider detail, appointment history/detail, and booking
  confirmation format dates, times, and currency through the active `en-AE` or
  `ar-AE` locale rather than hard-coding English formatting in those screens.
- Existing skeletons already stop their pulse animation when reduced motion is
  enabled; safe-area and keyboard-avoidance primitives remain in the shared
  route scaffolds.
- Discovery, appointment management, calendar, notification, and auth flows
  expose designed empty, offline, permission-denied, retry, and partial-data
  states. TanStack Query provides bounded caching and mutations refuse to queue
  booking while offline.
- Arabic-aware plural rules drive clinician counts, and specialty/clinic labels
  read the localized catalog fields rather than always selecting English.

## Arabic localization and RTL layout

- Every user-facing screen — onboarding, tabs, home, discovery, provider
  detail, booking, appointments, auth, profile, and the shell/error
  boundary — now reads its copy from typed bilingual `LocalizedStrings`
  bundles resolved through a `useStrings` hook, including accessibility
  labels, live-region announcements, empty/error states, and validation
  messages. English output is byte-identical to the previous literals.
- Domain layers stay English-only: auth validation schemas became
  message-parameterized factories, and auth/appointment failure codes map to
  localized copy at the presentation layer (`localizeAuthError`,
  `localizeAppointmentError`, booking-draft error codes).
- Plural-sensitive copy (clinician counts, reviews, available appointments)
  flows through `Intl.PluralRules` with full Arabic zero/one/two/few/many/other
  labels.
- Selecting Arabic persists the native layout direction through
  `I18nManager.allowRTL/forceRTL`, undoes a pending flip if the user switches
  back before restarting, and surfaces a restart hint under the language
  preference; web is unaffected. Directional arrow/chevron icons mirror
  automatically inside `DecorativeIcon`, non-directional glyphs do not, and
  absolute-positioned onboarding decor uses logical `start`/`end` offsets.
- Each screen area carries at least one Arabic-locale render test, and
  dedicated suites cover direction sync and icon mirroring.

## Offline-aware caching and staleness

- Discovery and the appointment list keep serving cached results when a
  refresh fails; the designed error states remain reserved for loads with no
  cached data at all.
- A shared `StaleDataNotice` announces offline or refresh-failed staleness in
  the active locale with the last successful update time, through a polite
  accessibility live region. A shared `useIsOffline` hook treats an unknown
  network state as online so the notice never flashes during startup.
- Bookings, cancellations, and reschedules still refuse to run offline and are
  never queued. The policy is recorded in ADR 0004.

## Motion, scaling, and target polish

- `useAppMotion` exposes the shared motion tokens plus the platform
  reduce-motion preference; the root, auth, and booking stacks fall back to
  instant transitions when reduced motion is requested, matching the skeleton
  shimmer's existing behavior.
- `AppText` keeps Dynamic Type enabled and caps scaling at 2× so dense rows
  (status pills, slot rows, chips) grow without breaking layout.
- Destructive and committing actions — cancel appointment, confirm
  cancellation, reschedule ("Move here"), and confirm booking — carry
  localized `accessibilityHint`s describing their outcome.
- The saved-clinician row in the profile meets the 44 pt minimum touch target.

## Quality evidence

| Check              | Result                         |
| ------------------ | ------------------------------ |
| Application tests  | 34 suites, 106 tests passed    |
| App lint/typecheck | Passed (ESLint, tsc, Prettier) |
| Static web export  | 21 routes exported             |
| Expo Doctor        | 20/20 checks passed            |
| Root error path    | Recoverable boundary component |

## Arabic copy review and bilingual provider data

- All Arabic bundles passed a native-level Modern Standard Arabic consistency
  review: singular/dual counts drop the redundant numeral («طبيبان», not
  «2 طبيبان»), «ملغى» replaces the common misspelling, the reschedule action
  uses the transitive «النقل إلى هنا», terminology is unified on
  «معرض الأعمال», and the home greeting reads naturally.
- Provider catalog data is bilingual end to end: names, credentials, bios,
  and languages render from `LocalizedText` in both locales. Firestore keeps
  the English `displayName` string for its composite ordering index and
  opaque cursors, adds optional `*Ar` fields, and the mapper falls back to
  English for untranslated documents so partially migrated data stays
  renderable.
- Seed tooling requires the Arabic fields, includes Arabic names, languages,
  and specialty names in the search terms, and the `hakeemi-portfolio-dev`
  24-document catalog was reseeded with the bilingual data.
- Fixture search matches both locales, so Arabic queries (for example
  «طب القلب») find providers in the portfolio web export as well.

## Remaining Phase 5 work

The remaining pass should run English/LTR plus Arabic/RTL auth, discovery,
booking, and management journeys on devices with Dynamic Type, VoiceOver, and
TalkBack, and gather keyboard/safe-area/rotation evidence on small phones and
tablets before Phase 5 can be marked complete.
