# Hakeemi Modernization Roadmap

> Status: Phase 5 release sign-off in progress; Phase 6 delivery and performance work next
>
> Baseline: `dade72b` on `master`
>
> Last updated: 2026-10-13
>
> Product type: portfolio-quality patient appointment application; not a clinical product

## Executive decision

Rebuild Hakeemi on **Expo SDK 57, React Native 0.86, React 19.2, the New
Architecture, Expo Router, Continuous Native Generation (CNG), and an Expo
development build**. Continue to use React Native Firebase, backed by a newly
defined Firestore and Cloud Functions contract.

This is intentionally not an Expo Go-only app. It will use native Firebase
SDKs, notifications, calendar integration, and production build profiles. Expo
is the framework and native-project lifecycle; React Native remains the runtime,
and native escape hatches remain available through config plugins and Expo
Modules.

The current application has no custom Java, Kotlin, Objective-C, Swift, or C++
feature that justifies manually maintaining native projects. Keeping it bare
only to signal seniority would preserve maintenance cost without demonstrating
better judgment. The stronger portfolio story is a documented migration from a
2021 bare app to a modern, production-shaped Expo application that still uses
native dependencies and native build tooling.

The exact stable Expo SDK must be rechecked at the start of implementation. SDK
57 is the current stable target at the time of this plan. Official references:

- [React Native recommends using a framework such as Expo for new apps](https://reactnative.dev/)
- [Expo SDK 57 targets React Native 0.86 and React 19.2](https://docs.expo.dev/versions/latest/)
- [Expo development builds support production apps and custom native code](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native Firebase is supported with Expo development builds](https://docs.expo.dev/guides/using-firebase/)
- [CNG can regenerate native projects and keep native configuration declarative](https://docs.expo.dev/workflow/continuous-native-generation/)

## 1. Product vision

### One sentence

Hakeemi is a calm, trustworthy mobile experience for discovering a suitable
doctor, booking an available appointment without double-booking, and managing
upcoming care in English or Arabic.

### Audience

- Primary: a patient evaluating doctors and booking an appointment.
- Secondary: a recruiter or engineering leader evaluating product judgment,
  React Native depth, architecture, testing, accessibility, and delivery craft.
- Demo operators: contributors who need a reproducible local environment with
  seeded, fictional data.

### Portfolio outcome

The repository should demonstrate seniority through evidence rather than
claims:

- a reasoned Expo-versus-bare architecture decision;
- migration discipline and reversible milestones;
- clear separation of routes, features, server state, and platform services;
- atomic backend booking behavior and tested authorization rules;
- accessibility, RTL, offline/error states, and performance budgets;
- CI, reproducible environments, preview builds, observability, and release
  documentation;
- concise ADRs explaining tradeoffs and rejected alternatives.

### Constraints

- Work directly on the current default branch, `master`, as requested.
- Preserve the 2021 implementation in Git history and tag the baseline before
  replacing the scaffold.
- Keep every commit focused, runnable where practical, and independently
  reviewable.
- Use fictional demo data only. Do not position the app as HIPAA, GDPR, UAE
  health-regulation, or clinical-compliance ready.
- Build and test on both iOS and Android; web is optional and must not delay the
  native portfolio result.
- Prefer current stable, Expo-compatible package versions installed through
  `npx expo install` where applicable.

## 2. Current-state audit

### Repository baseline

| Area            | Current state                                                       | Consequence                                                                |
| --------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Runtime         | React Native 0.64.1, React 17, TypeScript 4.2                       | About five years of framework and toolchain drift                          |
| Native projects | Manually maintained `ios/` and `android/`                           | Large upgrade surface despite no custom native feature                     |
| Architecture    | Legacy bridge-era project                                           | Must move to the mandatory New Architecture used by current React Native   |
| Navigation      | React Navigation 5 with nested drawer, stack, and modal stacks      | High boilerplate; function values are passed in route params               |
| Backend         | React Native Firebase Auth and Firestore                            | Backend exists only as direct client calls; no server contract in the repo |
| Booking model   | Appointment objects embedded in each doctor document                | Leaks user IDs, grows documents, and permits booking races                 |
| Profile         | Hard-coded user and appointment data                                | The core post-booking experience is not real                               |
| Search/filter   | Search field and service selection are visual only                  | Primary discovery UI does not affect data                                  |
| Localization    | English and Turkish toggle                                          | Not persisted; no RTL; Turkish appears inherited from the original concept |
| UI foundation   | Custom components, theme values, 7 stories, 12 tests/snapshots      | Useful intent, but the design system and test stack are obsolete           |
| Quality         | No CI, E2E, emulator tests, rules, error boundary, or release setup | Cannot establish production readiness                                      |
| Native release  | Android release build uses the debug signing key                    | Must never be carried into a modern release setup                          |
| Configuration   | Firebase mobile config files are tracked                            | Existing project access and rules must be audited before reuse             |
| Reproducibility | `node_modules` absent and no current build proof                    | Legacy runtime capture is best-effort, not a migration blocker             |

### Code and product issues to retire

- `useAuth` is created independently in multiple consumers, creating repeated
  auth subscriptions instead of one application-level session owner.
- Registration creates the Auth user before asynchronously creating the user
  profile; failure can leave partial state.
- The client can list every user through `api.users.list`, which should not be a
  patient capability.
- Booking uses `arrayUnion` on a doctor document, with no transaction, unique
  slot, appointment status, audit timestamps, timezone, cancellation, or
  rescheduling.
- Doctor documents expose appointment user IDs to any client allowed to read the
  doctor.
- Profile and upcoming appointments are hard-coded; search and specialty
  selection are non-functional.
- Route params carry callbacks, which are not serializable and make deep links,
  state restoration, and E2E flows fragile.
- Loading relies mostly on spinners, errors rely on transient snackbars, and
  useful empty/retry states are missing.
- Fixed illustration dimensions and narrow-layout assumptions do not safely
  handle small phones, tablets, rotation, or large text.
- Snapshot-heavy tests verify render trees rather than business outcomes.
- The Jest config references `jest/setupTests.js`, which is not present in the
  repository.

## 3. Source-based design audit

No runnable legacy build or complete screen capture set is currently available.
The audit below uses the checked-in screen/component source and the repository
banner. It must be validated with actual screenshots during preflight if the
legacy toolchain can still run.

Legend: **P** = pass, **W** = needs work, **F** = fail, **—** = not applicable
to the static screen.

| Screen          | Hierarchy | Spacing | Type | Color | Grid | Components | Icons | Motion | Empty | Loading | Error | Theme | Density | Responsive | A11y |
| --------------- | --------- | ------- | ---- | ----- | ---- | ---------- | ----- | ------ | ----- | ------- | ----- | ----- | ------- | ---------- | ---- |
| Welcome         | W         | W       | W    | W     | W    | P          | —     | F      | —     | —       | F     | F     | W       | F          | F    |
| Sign in         | W         | W       | W    | W     | W    | P          | W     | F      | —     | W       | W     | F     | W       | W          | F    |
| Sign up         | W         | W       | W    | W     | W    | P          | W     | F      | —     | W       | W     | F     | W       | W          | F    |
| Forgot password | W         | W       | W    | W     | W    | P          | W     | F      | —     | W       | W     | F     | W       | W          | F    |
| Home            | W         | W       | W    | W     | W    | W          | W     | F      | F     | W       | F     | F     | W       | F          | F    |
| Doctors         | W         | W       | W    | W     | W    | W          | W     | F      | F     | W       | F     | F     | W       | W          | F    |
| Doctor profile  | W         | W       | W    | W     | W    | W          | W     | F      | F     | W       | W     | F     | W       | W          | F    |
| Schedule dialog | W         | W       | W    | W     | W    | W          | W     | F      | F     | W       | W     | F     | F       | F          | F    |
| Profile         | W         | W       | W    | W     | W    | W          | —     | F      | F     | W       | F     | F     | W       | W          | F    |

### Kill, elevate, redesign

| Existing element                       | Decision                 | Reason                                                                                          |
| -------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Drawer as primary navigation           | Remove                   | Hides the three core destinations and adds a redundant stack layer                              |
| COVID “Stay Home” card                 | Remove                   | Time-bound 2021 content no longer serves the booking task                                       |
| Language toggle on Welcome and Profile | Redesign                 | Language is valuable, but a binary switch does not scale or explain the choice                  |
| Avatar-only “recent doctors” row       | Redesign                 | Fast access is useful, but faces without names, specialty, or availability are ambiguous        |
| Eight equal medical-service tiles      | Redesign                 | Selection is useful, but equal visual weight and non-functional filtering create cognitive load |
| Search                                 | Elevate                  | Provider discovery is a primary intent and must lead to useful results immediately              |
| Next available appointment             | Elevate                  | This is the decisive booking information and belongs on list cards and provider profiles        |
| Booking confirmation and management    | Elevate                  | This is the product's promise, not an incidental modal                                          |
| Decorative background pattern          | Remove or greatly reduce | It competes with content and does not strengthen trust                                          |

## 4. Target experience and information architecture

### Core journey

1. Open the app in demo mode or sign in.
2. Search by doctor, specialty, service, language, or clinic.
3. Compare providers using credentials, rating summary, location, visit mode,
   fee, and next availability.
4. Review a provider and choose a date and available time.
5. Confirm visit mode and a non-sensitive reason category.
6. Receive an atomic booking confirmation.
7. View, add to the device calendar, reschedule, or cancel the appointment.
8. Receive a reminder that deep-links to the appointment.

### Navigation

Use four visible bottom tabs instead of a drawer:

| Tab          | Purpose                                                        | Primary action               |
| ------------ | -------------------------------------------------------------- | ---------------------------- |
| Home         | Greeting, next appointment, specialties, recommended providers | Resume care or find a doctor |
| Find care    | Search, filters, results, recent searches                      | Choose a provider            |
| Appointments | Upcoming and past appointments                                 | Manage the next appointment  |
| Profile      | Personal details, saved providers, language, theme, privacy    | Update preferences           |

Stack and modal routes:

- onboarding;
- sign in, sign up, and password reset;
- provider details;
- filter sheet;
- booking flow: date/time → visit details → review → confirmation;
- appointment detail;
- notifications and calendar permission education;
- settings, legal disclaimer, and about this demo.

Every detail route must be deep-linkable. Route params contain stable IDs and
simple serializable values only.

### Feature priorities

#### Must ship

- guest/demo entry plus email/password authentication;
- provider discovery, search, specialty filters, and provider details;
- real availability and atomically safe booking;
- upcoming/past appointment lists;
- cancellation and rescheduling rules;
- fictional seed data and Firebase Emulator Suite support;
- English and Arabic with RTL layout;
- light/dark themes, large text support, screen reader labels, reduced motion;
- loading skeletons, actionable empty/error states, offline read behavior;
- iOS and Android preview builds, CI, tests, and a portfolio-grade README.

#### Should ship

- saved providers;
- add appointment to the device calendar;
- notification reminders and deep links;
- Google and Apple sign-in after email auth is stable;
- analytics event taxonomy and Crashlytics breadcrumbs;
- provider pagination and recent searches.

#### Could ship after launch

- map-based clinic discovery;
- home-screen appointment widget;
- biometric app lock;
- calendar conflict hints;
- web read-only provider catalogue.

## 5. Deliberately not building

- A clinician/admin app. Seed scripts and Firebase Admin tooling will manage demo
  providers and slots.
- Medical records, prescriptions, diagnostic advice, symptom checking, or free
  text containing sensitive health information.
- Video consultations, chat, payments, insurance claims, or real provider
  credential verification.
- Real multi-clinic scheduling complexity such as waitlists, recurring visits,
  group appointments, or staff rostering.
- Claims of regulatory compliance. The architecture will apply sensible privacy
  and security practices, but certification is outside a portfolio project.
- A custom native module invented only to prove native skill. Add native code
  only when a product requirement needs it.
- A production web application unless native milestones are complete.

## 6. Visual direction

### Design thesis

“Quiet clinical confidence”: calm surfaces, decisive hierarchy, compact but
readable provider information, and motion that explains state rather than
decorates it. The app should feel contemporary without looking like a generic
teal healthcare template.

### Foundation tokens

These are implementation targets, subject to contrast verification on real
devices:

| Token group | Direction                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Canvas      | Warm off-white `#F7F8F5`; dark canvas based on deep blue-black rather than pure black                    |
| Surface     | White/light neutral cards; dark surfaces use brightness steps and borders                                |
| Brand       | Deep teal around `#0B6B69`, with a pale teal support surface                                             |
| Ink         | Deep ink around `#112326`; muted copy around `#5B6B6E`                                                   |
| Accent      | Restrained warm coral for highlights, never as the only state indicator                                  |
| Semantic    | Separate success, warning, destructive, and information tokens with WCAG AA contrast                     |
| Spacing     | 4-point base with primary rhythm at 8, 12, 16, 24, 32, and 48                                            |
| Radius      | 12 for controls, 16 for cards, 24 for large sheets; pills only for tags/status                           |
| Type        | System-first semantic type ramp; choose an Arabic-capable pair only after glyph and Dynamic Type testing |
| Motion      | 160–240 ms micro-interactions, natural spring for selection, reduced-motion alternative                  |
| Targets     | Minimum 44×44 pt interactive area; 48 pt preferred for primary controls                                  |

### Component system

- `Screen`, `Surface`, `Stack`, and safe-area primitives;
- semantic `Text` variants rather than arbitrary sizes;
- `Button`, `IconButton`, `TextButton`, and destructive confirmation patterns;
- `TextField`, `SearchField`, `SelectField`, validation message, and password
  affordances;
- provider card in compact, featured, and saved contexts;
- specialty chip, filter chip, status badge, and visit-mode selector;
- date strip, time-slot grid, appointment card, timeline row;
- skeleton, empty state, inline error, banner, toast, and retry state;
- bottom sheet and confirmation dialog with accessible focus behavior;
- theme-aware icon family and illustration guidelines.

### Screen-level redesign intent

| Screen         | Primary hierarchy change                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| Onboarding     | One clear promise, one primary CTA, secondary sign-in, unobtrusive language access |
| Authentication | Short forms, inline validation, password-manager support, calm recovery states     |
| Home           | Next appointment first for returning users; discovery first for new users          |
| Find care      | Search and filters remain visible; result cards expose decision-making information |
| Provider       | Trust details and next availability precede long biography/contact content         |
| Booking        | One decision per step, sticky primary action, visible progress, clear timezone     |
| Confirmation   | Summarize what happened, provide calendar/reminder actions, link to appointment    |
| Appointments   | Upcoming and history segmentation with status and recovery actions                 |
| Profile        | Real data and preferences; remove the ornamental static appointment section        |

## 7. Target technical stack

This table is the stack chosen when the roadmap was written and is kept as the
plan of record. The "Planned vs. actual" table after it records where the
delivered application differs and names the artifact that shows the current
state.

| Layer                  | Choice                                                                        | Why                                                                           |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Mobile framework       | Expo SDK 57 / RN 0.86 / React 19.2                                            | Current stable framework pairing at plan time                                 |
| Native lifecycle       | CNG + `expo-dev-client`; generated `ios/` and `android/` ignored              | Declarative upgrades with full native-library access                          |
| Architecture           | React Native New Architecture                                                 | Required by current React Native and the forward path for libraries           |
| Routing                | Expo Router with typed routes                                                 | Deep links, simpler route ownership, serializable navigation                  |
| Language               | Strict TypeScript                                                             | Reliable contracts across routes, features, Firebase, and tests               |
| Server state           | TanStack Query                                                                | Cache, retry, invalidation, mutations, and offline-aware reads                |
| UI state               | Local React state and narrowly scoped contexts                                | Avoid a global store until a concrete cross-feature need exists               |
| Forms                  | React Hook Form + Zod                                                         | Typed validation and reusable form contracts                                  |
| Backend SDK            | React Native Firebase                                                         | Retains native Firebase services, Crashlytics, and FCM in a development build |
| Backend                | Firebase Auth, Firestore, Cloud Functions, Storage, App Check, Emulator Suite | Existing domain fit with a repository-owned server contract                   |
| Lists/images/motion    | FlashList, `expo-image`, Reanimated                                           | Production list, image, and transition behavior                               |
| Localization           | i18next + Expo Localization; English and Arabic                               | Existing investment with persisted locale and RTL support                     |
| Unit/integration tests | Jest Expo + React Native Testing Library                                      | User-observable component and feature behavior                                |
| Backend tests          | Functions tests + `@firebase/rules-unit-testing` + emulators                  | Booking correctness and authorization proofs                                  |
| E2E                    | Maestro on iOS and Android                                                    | Readable native journey coverage and screenshot automation                    |
| CI/CD                  | GitHub Actions + EAS Build/Update/Submit profiles                             | Repeatable checks, installable previews, and release evidence                 |
| Observability          | Crashlytics, Performance Monitoring, structured analytics                     | Production-shaped diagnosis without exposing sensitive content                |

### Planned vs. actual

Rows not listed here are delivered as planned. Checked against the working
tree on 2026-10-13.

| Layer               | Planned                                        | Actual                                                                                                                                                                                                    | Evidence                                                                                        |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Backend             | Includes App Check                             | Auth, Firestore, Cloud Functions, Security Rules, and the Emulator Suite are in use; Storage rules are defined but no client Storage feature exists; App Check is not configured                          | `firebase/`, `firebase.json`, completion checklist below                                        |
| Lists/images/motion | FlashList, `expo-image`, Reanimated            | React Native `FlatList` and `Image` with Reanimated; neither `@shopify/flash-list` nor `expo-image` is installed                                                                                          | `package.json`                                                                                  |
| Localization        | i18next + Expo Localization                    | Typed bilingual string catalogs, locale-aware formatting, and `I18nManager` layout direction in `src/localization/`; neither package is installed                                                         | `src/localization/`, `package.json`, `docs/phase-5-verification.md`                             |
| E2E                 | Maestro on iOS and Android                     | No Maestro flows, `e2e/` directory, or CI E2E job. Native journeys are interactive iOS Simulator runs recorded with screenshots; Android hardware, VoiceOver/TalkBack, and permission dialogs remain open | `docs/phase-3-verification.md`, `docs/phase-4-verification.md`, `docs/phase-5-verification.md`  |
| CI/CD               | GitHub Actions + EAS Build/Update/Submit       | GitHub Actions and EAS Build profiles only; `eas.json` has no `update` or `submit` section, and signed preview builds are still open                                                                      | `.github/workflows/ci.yml`, `.github/workflows/dependency-health.yml`, `eas.json`               |
| Observability       | Crashlytics, Performance Monitoring, analytics | None instrumented; the privacy-safe analytics contract is documented only                                                                                                                                 | `package.json` (no Crashlytics, Performance, or Analytics packages), `docs/analytics-events.md` |

### Proposed repository structure

```text
src/
  app/                         # Expo Router routes and layouts only
    (auth)/
    (tabs)/
    appointments/
    booking/
    providers/
  components/
    ui/                        # Design-system primitives
    feedback/                  # Empty, error, loading, toast
  features/
    auth/
    appointments/
    providers/
    profile/
    saved-providers/
  services/
    firebase/
    notifications/
    calendar/
    analytics/
  providers/                   # App-level provider composition
  design-system/               # Tokens, themes, typography, motion
  i18n/
  lib/
  types/
functions/
  src/
    appointments/
    notifications/
firebase/
  firestore.rules
  firestore.indexes.json
  storage.rules
  seed/
e2e/
docs/
  adr/
  ROADMAP.md
```

Route files orchestrate feature components. They do not contain Firestore
queries, data mapping, validation schemas, or large style objects.

## 8. Backend architecture

### Why Firebase remains the recommendation

Firebase keeps the rebuild focused on React Native while still allowing a
serious server contract. The current app already uses the native Firebase SDK,
and Expo officially supports that migration through development builds. A
relational backend would also be valid for scheduling, but changing both mobile
platform and backend paradigm adds scope without improving the core portfolio
story enough to justify it.

The new design fixes the weak data model instead of preserving it.

### Data model

All timestamps are server timestamps stored in UTC. User-visible scheduling
also stores the IANA timezone used when the appointment was created.

#### `users/{uid}` — Phase 2

- `displayName: string`
- `email: string`
- `photoURL: string | null`
- `locale: 'en' | 'ar'`
- `timezone: string`
- `theme: 'system' | 'light' | 'dark'`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Only the owner may read or update approved profile fields.

#### `providers/{providerId}` — Phase 1 local fixture, Phase 2 Firestore

- `displayName: string`
- `slug: string`
- `specialtyIds: string[]`
- `credentialSummary: string`
- `bio: string`
- `languages: string[]`
- `clinicIds: string[]`
- `visitModes: ('in_person' | 'video')[]`
- `consultationFee: { amount: number; currency: string } | null`
- `ratingSummary: { average: number; count: number } | null`
- `image: { url: string; blurhash: string; alt: string } | null`
- `isFeatured: boolean`
- `isActive: boolean`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Clients may read active providers. Only trusted server/admin tooling may write.

#### `specialties/{specialtyId}` — Phase 1 fixture, Phase 2 Firestore

- localized `name`
- localized `description`
- `icon: string`
- `sortOrder: number`
- `isActive: boolean`

#### `clinics/{clinicId}` — Phase 2

- localized `name`
- localized `address`
- `location: GeoPoint`
- `timezone: string`
- `phone: string`
- `isActive: boolean`

#### `availabilitySlots/{slotId}` — Phase 3

- `providerId: string`
- `clinicId: string | null`
- `visitMode: 'in_person' | 'video'`
- `startsAt: Timestamp`
- `endsAt: Timestamp`
- `timezone: string`
- `status: 'available' | 'held' | 'booked' | 'blocked'`
- `appointmentId: string | null`
- `version: number`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Slot documents are queryable by provider/date/status. Clients may read
available slots. Only trusted functions/admin tooling may write slot state.

#### `appointments/{appointmentId}` — Phase 3

- `patientId: string`
- `providerId: string`
- `slotId: string`
- `clinicId: string | null`
- `visitMode: 'in_person' | 'video'`
- `reasonCategory: string | null`
- `startsAt: Timestamp`
- `endsAt: Timestamp`
- `timezone: string`
- `status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'`
- `cancelledAt: Timestamp | null`
- `cancelledBy: 'patient' | 'provider' | 'system' | null`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Patients may read their own appointments. Creation, slot changes, and status
transitions happen only through callable functions.

#### `users/{uid}/savedProviders/{providerId}` — Phase 4

- `providerId: string`
- `createdAt: Timestamp`

#### `users/{uid}/deviceTokens/{tokenId}` — Phase 4

- `token: string`
- `platform: 'ios' | 'android'`
- `locale: 'en' | 'ar'`
- `enabled: boolean`
- `updatedAt: Timestamp`

A device token is enabled for at most one account: the one that most recently
registered it from the device holding it. Registering a token disables every
other account's record of the same token in the same transaction (served by a
composite collection-group index on `enabled` and `token`), and sign-out
disables the signing-out
account's record through `unregisterDeviceToken` before Firebase sign-out.
Presenting the raw token is the possession proof; a hash alone is never
accepted. A sign-out that cannot reach the server (offline, timeout, server
error) is recorded on the device and retried the next time an account is signed
in there, so an offline sign-out is not an immediate remote disable. Until that
retry, or until another account registers the same token, the server still
holds the record. A token that FCM reports as unregistered is disabled by the
reminder job on its first delivery attempt.

#### `appointmentReminders/{reminderId}` — Phase 4

- `appointmentId: string`
- `status: 'sending' | 'sent' | 'skipped' | 'failed' | 'abandoned'`
- `attempts: number`
- `outcomeCode: string` (an FCM error code or a short reason such as
  `delivered`, `no-enabled-tokens`, `appointment-not-confirmed`,
  `legacy-receipt`)
- `sendIssuedAt: Timestamp`, written just before the first FCM call
- `claimedAt`, `createdAt`, `updatedAt: Timestamp`

The reminder ID is a hash of the appointment ID, and the collection is
server-only. Each run first retries `failed` receipts, then claims the
appointments whose start lies 24 hours ahead inside the 15-minute window. A
claim is a transaction that increments `attempts`; `sent`, `skipped` and
`abandoned` receipts are never claimed again, and a `sending` receipt is never
reclaimed once `sendIssuedAt` is set. Only a failure with no successful
recipient and a known-undelivered send is retried: an error before the first
FCM call, a rejected first call, or per-token delivery failures that the next
attempt can fix (FCM unavailable, rate limits). Such a failure leaves the
receipt `failed` for later runs, at most three attempts in total and only
while the appointment is still confirmed and has not started; the nominal
48-hour lookback from the due time never binds first because the appointment
starts 24 hours after the reminder falls due. Once any device may have
received the reminder (a later locale batch or the bookkeeping after a send
fails) the receipt records `sent` or `abandoned` and the error is logged, never
retried; if that final receipt write fails too, the receipt stays `sending`
with `sendIssuedAt` and is left alone. Credential, permission, sender,
argument, and invalid-document errors are not retried and mark the receipt
`abandoned`. Receipts written before `attempts` existed are settled
`abandoned` with `legacy-receipt`, since the old code recorded `failed` for
post-send errors too. Every failure is logged with the hashed reminder ID, the
attempt number, and the error code only; appointment, patient, token, and
error-message text never reach the logs or the receipt. Notification copy is
generic and chosen per device from the stored locale: Arabic for `ar` and its
regional variants, English otherwise. FCM itself gives no exactly-once
guarantee; the job only never issues a second send for a reminder it may
already have delivered.

### Relationships and privacy boundary

- A provider has many slots, but provider documents never contain patient IDs.
- A slot has at most one appointment.
- A user has many appointments and saved providers.
- Public provider data and private patient data live in different collections.
- Analytics and crash logs must never include appointment reason, email, token,
  or other sensitive values.

### Callable function surface

| Function                   | Phase | Auth              | Responsibility                                                                 |
| -------------------------- | ----- | ----------------- | ------------------------------------------------------------------------------ |
| `bookAppointment`          | 3     | Patient           | Transactionally verify an available slot, create appointment, mark slot booked |
| `cancelAppointment`        | 4     | Owner             | Validate cancellation policy, cancel appointment, reopen slot atomically       |
| `rescheduleAppointment`    | 4     | Owner             | Atomically release old slot and reserve new slot                               |
| `registerDeviceToken`      | 4     | User              | Store a normalized FCM token without exposing other users' tokens              |
| `unregisterDeviceToken`    | 4     | User              | Disable one account's record of a device token the caller can present          |
| `sendAppointmentReminders` | 4     | Scheduled service | Send reminders and record delivery-safe metadata                               |

Firestore transactions are mandatory for slot state changes. Firebase documents
transactions as atomic and retryable on concurrent edits:
[Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).

### Backend environments

- A project-matched `hakeemi-portfolio-dev` namespace for interactive native
  emulator journeys; synthetic `demo-*` IDs for isolated automated tests.
- Separate Firebase development and production projects if a hosted demo is
  published.
- EAS environment/file secrets for native configuration files; no service
  account keys in the mobile repository.
- Security Rules and indexes tracked in Git and deployed through CI.
- App Check enabled after local/emulator workflows are proven.
- Rules tested with the Emulator Suite before deployment:
  [Firebase rules testing guidance](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

## 9. Migration strategy

Do not attempt a dependency-by-dependency upgrade from React Native 0.64 to the
current stack. The compatibility distance is too large, the native scaffold has
no valuable customization, and a clean current Expo scaffold is easier to
verify.

1. Tag the current commit as `legacy-v1` before scaffold replacement.
2. Record the repository inventory, current Firebase project identifiers, and
   any legacy build evidence available.
3. Scaffold a clean Expo SDK 57 app outside the repository and copy in only the
   reviewed generated configuration.
4. Keep the old implementation recoverable through the tag, not through a
   permanent `legacy/` directory in the working tree.
5. Rebuild behavior feature by feature. Reuse copy, useful SVG concepts, and
   domain knowledge only after licensing and visual review; do not mechanically
   port old screen components.
6. Use CNG: ignore generated `ios/` and `android/` directories. Express native
   configuration through app config and config plugins.
7. If a future native change cannot reasonably be modeled by CNG, document the
   exception in an ADR and either create a local Expo Module/config plugin or
   deliberately start tracking native projects.

## 10. Delivery phases

### Phase 0 — Preserve and prove the baseline ✅

_Completed: 2026-07-19, commit `b2aca92`. See `docs/legacy-baseline.md`._

_Goal: create a safe, documented starting point before the scaffold changes._

_Depends on: roadmap approval_

_Estimated effort: one short session_

#### Tasks

- [x] Commit this roadmap separately.
- [x] Tag `dade72b` as `legacy-v1` and record the tag in this document.
- [x] Inspect the existing Firebase console/project ownership, Authentication
      providers, Firestore data, indexes, and Security Rules without changing them.
- [x] Decide whether the old Firebase project will be retired or preserved as a
      read-only historical environment.
- [x] Attempt a best-effort legacy install/build in a compatible isolated
      toolchain; do not block the rebuild if it cannot compile.
- [x] Capture every reachable legacy screen on iOS and Android if the build runs.
      The native build did not reach compilation; the source audit and banner are
      the retained visual record.
- [x] Record any reusable copy/assets and their license/source.
- [x] Add `docs/adr/0001-expo-cng.md` with the final platform decision.

#### Definition of done

- Legacy code is recoverable by tag.
- The inaccessible legacy Firebase project is explicitly excluded from reuse.
- The rebuild can start without relying on an unrecorded legacy behavior.

#### Commit checkpoints

1. `docs: add Hakeemi modernization roadmap`
2. `docs: record legacy baseline and Expo architecture decision`

### Phase 1 — Ship a modern, browseable app ✅

_Completed: 2026-07-19, final implementation commit `d426031`. See
`docs/phase-1-verification.md`._

_Goal: a user can open a modern Expo app, browse realistic fictional providers,
and inspect provider details using local fixtures._

_Depends on: Phase 0_

_Estimated effort: two to three sessions_

#### Setup

- [x] Replace the legacy scaffold with a clean Expo SDK 57 TypeScript project.
- [x] Configure CNG, `expo-dev-client`, New Architecture, npm scripts, and Node
      version metadata.
- [x] Configure Expo Router under `src/app` with typed routes and four tab
      destinations.
- [x] Configure strict TypeScript, ESLint, Prettier, import aliases, environment
      validation, and pre-commit checks.
- [x] Add development, preview, and production EAS profiles without credentials.

#### Design system

- [x] Implement semantic color, spacing, radius, typography, elevation, and
      motion tokens for light and dark themes.
- [x] Build accessible text, button, icon button, field, chip, surface, skeleton,
      empty-state, and inline-error primitives.
- [x] Add a development-only component catalogue or current React Native
      Storybook if it is cleanly compatible with the development build.
- [x] Add interaction tests for component states and accessibility labels.

#### Frontend

- [x] Implement onboarding/demo entry and the tab shell.
- [x] Create typed local provider, specialty, clinic, and slot fixtures.
- [x] Implement Home, Find Care, provider results, and provider details.
- [x] Make search and specialty filters functional against fixtures.
- [x] Add loading, empty, error, and retry variants to every data surface.
- [x] Use only serializable route parameters.

#### Definition of done

- The app launches on current iOS and Android simulators/devices.
- A guest can browse, search, filter, and open a provider profile.
- Light and dark themes render without hard-coded component colors.
- Typecheck, lint, component tests, and `expo-doctor` pass.

#### Commit checkpoints

1. `chore: replace legacy scaffold with Expo SDK 57`
2. `build: configure Expo Router and development builds`
3. `chore: add strict quality tooling and test harness`
4. `feat: add Hakeemi design foundations`
5. `feat: add accessible UI primitives and component catalogue`
6. `feat: add tab navigation and demo entry`
7. `feat: add fixture-backed provider discovery`

### Phase 2 — Connect secure accounts and live provider data ✅

_Completed: 2026-07-20, final implementation commit `a399348`. See
`docs/phase-2-verification.md`._

_Goal: users can create an account or sign in, and provider discovery reads from
a reproducible Firebase environment._

_Depends on: Phase 1_

_Estimated effort: two sessions_

#### Backend

- [x] Initialize Firebase configuration for Auth, Firestore, Functions, Storage,
      indexes, rules, and Emulator Suite.
- [x] Create environment-safe React Native Firebase config plugins and
      development build configuration.
- [x] Add deterministic fictional seed data for providers, specialties, clinics,
      and future slots.
- [x] Write default-deny Firestore and Storage rules.
- [x] Write rules tests for public provider reads, private user reads/writes, and
      denied cross-user access.

#### Mobile

- [x] Add one application-level auth/session provider.
- [x] Implement email/password sign-up, sign-in, sign-out, password reset, and
      verification states with typed validation.
- [x] Create the user profile through one idempotent server-controlled flow.
- [x] Add bounded Firebase adapters and DTO-to-domain mappers.
- [x] Add TanStack Query keys, caching, and provider cursor pagination.
- [x] Replace local provider fixtures with Firestore repositories while keeping
      an explicit demo data adapter for tests/previews.
- [x] Persist locale/theme preferences without storing secrets in general
      storage.

#### Definition of done

- The full auth lifecycle works against emulators and a development project.
- Auth restoration does not flash the wrong navigation state.
- Provider discovery works from seeded Firestore data.
- Unauthorized reads/writes fail in automated rules tests.

#### Commit checkpoints

1. `build: add Firebase emulators and environment configuration`
2. `test: add Firestore rules and authorization coverage`
3. `chore: add deterministic Firestore seed data`
4. `build: configure React Native Firebase for Expo`
5. `feat: add typed authentication flows`
6. `feat: add user profile bootstrap and session restoration`
7. `feat: connect provider discovery to Firestore`

### Phase 3 — Make booking trustworthy ✅

_Completed: 2026-07-20, final implementation commit `b05f2b0`. See
`docs/phase-3-verification.md`._

_Goal: an authenticated patient can book one real available slot and receive a
reliable confirmation without double-booking._

_Depends on: Phase 2_

_Estimated effort: two to three sessions_

#### Backend

- [x] Implement `availabilitySlots` and `appointments` indexes and rules.
- [x] Implement `bookAppointment` as an authenticated callable Cloud Function
      using a Firestore transaction.
- [x] Validate slot ownership, status, time bounds, and allowed request fields on
      the server.
- [x] Make idempotency/retry behavior explicit so a repeated client request does
      not create duplicate appointments.
- [x] Add unit/integration tests for success, contention, duplicate attempts,
      expired slots, unauthenticated calls, and forged patient IDs.

#### Mobile

- [x] Query availability by provider and bounded date window.
- [x] Build the date/time, visit detail, review, and confirmation screens.
- [x] Show timezone and visit mode at each decision point.
- [x] Prevent submission when offline; preserve safe draft choices locally.
- [x] Use a mutation state machine with disabled duplicate submission, clear
      errors, and post-success cache reconciliation.
- [x] Show the confirmed appointment in the Appointments tab.

#### Definition of done

- Two simultaneous requests cannot reserve the same slot.
- A confirmed booking survives reload and appears only to its owner.
- The complete happy path and common failures are covered in emulator tests and
  one interactive native journey on the iOS Simulator, recorded in
  `docs/phase-3-verification.md`; no automated E2E suite exists.

#### Commit checkpoints

1. `feat: add availability and appointment data contracts`
2. `feat(functions): add transactional appointment booking`
3. `test(functions): cover booking contention and authorization`
4. `feat: add provider availability experience`
5. `feat: add guided booking and confirmation flow`
6. `test(e2e): cover appointment booking`

### Phase 4 — Manage appointments and native follow-through ✅

_Goal: patients can manage upcoming care and use meaningful native integrations
after booking._

_Depends on: Phase 3_

_Estimated effort: two sessions_

#### Backend

- [x] Implement atomic `cancelAppointment` and `rescheduleAppointment`
      functions with policy validation and audit timestamps.
- [x] Implement owner-scoped device-token registration through a callable
      Function.
- [x] Implement scheduled reminder delivery.
- [x] Prevent reminder payloads and logs from including sensitive fields.
- [x] Add indexes and tests for upcoming/history queries and status transitions.

#### Mobile

- [x] Implement upcoming, past, cancelled, and appointment-detail states.
- [x] Add cancellation and rescheduling with clear consequences and optimistic
      feedback only where rollback is safe.
- [x] Add saved providers as an owner-only subcollection.
- [x] Add calendar permission education and “Add to calendar” through an Expo
      native API, with unavailable web/Jest adapters.
- [x] Add notification permission education, token refresh handling, and typed
      deep links into appointment details.
- [x] Add restrained haptics to successful booking and destructive confirmation.

#### Definition of done

- Cancel and reschedule are atomic and reflected across slots and appointments.
- Calendar and notification denial leave the core app fully usable.
- Notification taps open the correct appointment route.
- Saved clinician references are owner-scoped, optimistic in the UI, and remain
  removable from the authenticated profile shortlist.
- An interactive iOS Simulator journey covers booking, rescheduling,
  cancellation, and signed-out isolation (`docs/phase-4-verification.md`);
  automated E2E is not implemented.

#### Commit checkpoints

1. `feat(functions): add appointment cancellation and rescheduling`
2. `feat: add appointment management experience`
3. `feat: add saved providers`
4. `feat: add appointment calendar follow-through`
5. `feat(functions): deliver privacy-safe appointment reminders`
6. `test(e2e): cover appointment management`

### Phase 5 — Make the experience inclusive and resilient

_Goal: Hakeemi feels deliberate across language, theme, assistive technology,
device size, network state, and failure conditions._

_Depends on: Phase 4_

_Estimated effort: two sessions_

#### Localization and accessibility

- [x] Complete English and Arabic copy, plural rules, date/time formatting, and
      locale persistence.
- [x] Mirror layout intentionally for RTL; verify icons whose meaning must not
      mirror.
- [x] Test Dynamic Type/font scaling, screen reader order/labels, focus after
      navigation, 44 pt targets, contrast, reduced motion, and reduced transparency.
- [ ] Validate VoiceOver and TalkBack for auth, search, booking, and management
      journeys.

#### Resilience and polish

- [x] Replace generic spinners with layout-matched skeletons where useful.
- [x] Add designed empty, offline, partial-data, permission-denied, and retry
      states.
- [x] Add route-level error boundaries and safe structured logging.
- [x] Define query caching and stale-data indicators; never queue a booking while
      offline.
- [x] Tune keyboard avoidance and safe areas, and verify constrained tablet
      layouts in the iOS Simulator.
- [ ] Complete rotation and physical small-phone sign-off.
- [x] Apply purposeful transitions and shared motion tokens with reduced-motion
      fallbacks.

#### Definition of done

- Core E2E journeys pass in English/LTR and Arabic/RTL.
- Core journeys are usable with VoiceOver and TalkBack.
- The app remains understandable under slow/offline/error states.
- Light and dark screenshots pass visual review on small and large devices.

#### Commit checkpoints

1. `feat: add Arabic localization and RTL support`
2. `feat: add accessible theme and text scaling support`
3. `feat: add resilient loading empty and error states`
4. `feat: add offline-aware provider caching`
5. `feat: refine responsive motion and keyboard behavior`

### Phase 6 — Production engineering and release confidence

_Goal: every change is verified automatically and installable preview builds are
easy to produce and diagnose._

_Depends on: Phase 5_

_Estimated effort: two sessions_

#### Quality and performance

- [x] Define a test pyramid and minimum critical-path coverage; avoid percentage
      targets that reward low-value snapshots.
- [x] Add CI jobs for install, formatting, lint, typecheck, unit/integration
      tests, Firebase rules/functions tests, and `expo-doctor`.
- [x] Add scheduled dependency health checks and an Expo/RN upgrade policy.
- [ ] Profile provider lists, search input, provider details, and booking on
      representative iOS and Android devices.
- [x] Set and enforce a bundled illustration budget: 150 KB per asset and 1 MB
      total, with a measured 808.8 KB baseline for 16 WebP files.
- [ ] Set measurable budgets for cold start, interaction latency, list frame
      drops, and JS bundle growth; record actual baseline/results.

#### Security and delivery

- [ ] Enable App Check in monitor mode, verify legitimate traffic, then enforce
      it for supported services.
- [ ] Add Crashlytics and Performance Monitoring with privacy-safe metadata.
- [x] Define analytics events for discovery and booking without recording health
      or identity details.
- [x] Configure EAS development, simulator, preview, and production profiles
      with explicit environment boundaries.
- [ ] Adopt fingerprint runtime versioning before enabling OTA updates.
- [ ] Configure signing through EAS credentials; never reuse the legacy Android
      debug signing setup.
- [ ] Produce installable iOS and Android preview builds and run the full smoke
      checklist on real devices.

#### Definition of done

- A clean checkout can reproduce checks and emulator tests.
- CI blocks regressions on every commit/PR.
- Preview builds install and complete the primary flow on both platforms.
- Crash/error diagnostics contain enough context without sensitive data.

#### Commit checkpoints

1. `ci: add mobile and Firebase quality gates`
2. `test: expand critical path integration coverage`
3. `perf: add budgets and optimize discovery flows`
4. `feat: add privacy-safe observability`
5. `security: enable Firebase App Check`
6. `build: configure signed EAS preview and production profiles`

### Phase 7 — Publish the portfolio case study

_Goal: a reviewer can understand the product, architecture, tradeoffs, and proof
of quality within minutes._

_Depends on: Phase 6_

_Estimated effort: one session_

#### README and documentation

- [x] Replace the current README with a concise case-study structure.
- [x] Create an original in-app illustration set and current native screenshot
      gallery using fictional data.
- [x] Replace the template Expo app icon and legacy repository hero with an
      original Hakeemi identity.
- [x] Record a short demo video/GIF of the core journey.
- [x] Explain the 2021-to-2026 rebuild and link the `legacy-v1` tag.
- [x] Document the Expo/CNG decision and the native development-build model.
- [x] Include an architecture diagram, feature list, stack, directory map,
      setup steps, emulator seed instructions, scripts, test commands,
      accessibility/localization notes, and privacy disclaimer.
- [ ] Add an installable preview build link and QR code.
- [ ] Include measured performance and quality results only after they exist.
- [x] Credit the historical Figma inspiration without presenting the new UI as a
      free-template implementation.
- [x] Remove the visitor badge and vague “production ready” wording.
- [x] Add `CONTRIBUTING.md`, license decision, and release notes if the repository
      is intended for public reuse.

#### Portfolio wording principles

- Use ownership verbs: “architected,” “modeled,” “migrated,” “measured,” and
  “validated.”
- Pair every claim with an artifact: ADR, test, diagram, preview build, or metric.
- Explain rejected alternatives and tradeoffs in a short “Engineering decisions”
  section.
- Be explicit that data and providers are fictional and that Hakeemi is a
  portfolio demonstration, not a live medical service.

#### Definition of done

- A new contributor can run the mobile app and Firebase emulators from the
  README.
- A reviewer can see the core flow without installing the app.
- All screenshots match the released build and contain no personal data.
- The repository presents senior engineering work without unsupported claims.

#### Commit checkpoints

1. `docs: add architecture and contributor guides`
2. `docs: add verified setup testing and release instructions`
3. `docs: publish Hakeemi portfolio case study`
4. `chore: prepare modernized portfolio release`

## 11. Build order summary

| Phase | User-visible outcome                                | Backend growth                            | Sessions |
| ----- | --------------------------------------------------- | ----------------------------------------- | -------- |
| 0     | Safe historical baseline                            | Existing project audited                  | 1        |
| 1     | Browse/search fictional providers in the modern app | Local fixture contracts                   | 2–3      |
| 2     | Real accounts and live provider discovery           | Users, providers, specialties, clinics    | 2        |
| 3     | Safe appointment booking                            | Slots, appointments, booking function     | 2–3      |
| 4     | Manage appointments and native follow-through       | Status functions, saved providers, tokens | 2        |
| 5     | RTL, accessibility, offline/error resilience        | No major schema change                    | 2        |
| 6     | Tested installable preview builds                   | App Check, observability, delivery        | 2        |
| 7     | Public portfolio case study                         | No schema change                          | 1        |

## 12. Schema evolution map

| Collection          | Phase 1       | Phase 2   | Phase 3 | Phase 4                               |
| ------------------- | ------------- | --------- | ------- | ------------------------------------- |
| `users`             | —             | ✓         |         | + preferences validation              |
| `providers`         | local fixture | ✓         |         |                                       |
| `specialties`       | local fixture | ✓         |         |                                       |
| `clinics`           | local fixture | ✓         |         |                                       |
| `availabilitySlots` | local fixture | seed only | ✓       | + cancellation/reschedule transitions |
| `appointments`      | —             | —         | ✓       | + status transitions                  |
| `savedProviders`    | —             | —         | —       | ✓                                     |
| `deviceTokens`      | —             | —         | —       | ✓                                     |

## 13. Commit and verification policy

### Commit rules

- Use Conventional Commit-style messages shown in the phase checkpoints.
- One concern per commit; do not mix design-system work, backend schema, and
  README changes.
- Prefer 2–5 logical files/groups per commit, except generated scaffold or lock
  file changes where the scope is inherently larger.
- Stage explicit paths so unrelated user changes are never swept into a commit.
- Do not commit when required checks for the touched layer are red.
- Record the phase completion date and commit hash in this roadmap.
- Work on `master` as requested. Do not force-push or rewrite the legacy history.
- Create lightweight rollback tags at major release boundaries if useful.

### Verification ladder

| Change type               | Required before commit                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Documentation             | Markdown/link review; commands checked against scripts                 |
| Tokens/components         | Typecheck, lint, focused tests, component catalogue review             |
| Screen/feature            | Typecheck, lint, unit/integration tests, iOS/Android smoke             |
| Firebase rules/functions  | Emulator tests including denied paths and concurrency                  |
| Native integration/config | `expo-doctor`, clean prebuild, iOS and Android development build       |
| Phase boundary            | Full CI, relevant E2E, device screenshots, roadmap status update       |
| Release                   | Real-device smoke, preview builds, privacy review, README verification |

## 14. Risks and decisions needed during execution

| Risk                                                  | Handling                                                                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Access to the old Firebase console is unavailable     | Treat it as abandoned, create new projects, and document the old configuration without probing production data                           |
| Old Firebase rules expose data                        | Disable/lock down the old project only after ownership and impact are confirmed                                                          |
| Legacy app cannot build                               | Preserve source/tag and reconstruct behavior from source; do not spend the rebuild budget reviving RN 0.64                               |
| Expo SDK changes before Phase 1                       | Recheck stable SDK/RN pairing and update this roadmap/ADR before scaffolding                                                             |
| Arabic typography changes the visual system           | Test glyph metrics before selecting custom fonts; system fonts are the safe default                                                      |
| Firestore search is insufficient                      | Start with bounded client-side search for seeded demo scale; document Algolia/Typesense as a scale trigger, not a speculative dependency |
| Appointment timezones/DST create edge cases           | Store UTC plus IANA timezone, generate slots server-side, and test DST boundaries                                                        |
| “Healthcare app” implies real-world safety/compliance | Keep data fictional, minimize health fields, and show a clear portfolio disclaimer                                                       |
| Scope grows into two-sided marketplace                | Keep provider/admin operations in seed/Admin tooling for this release                                                                    |

## 15. Completion checklist

The modernization is complete only when:

- [x] The current Expo SDK and New Architecture run on iOS and Android.
- [x] A user can discover, book, view, reschedule, and cancel an appointment.
- [x] Double-booking and cross-user data access are prevented by tested server
      logic and rules.
- [ ] English/LTR and Arabic/RTL core journeys pass accessibility review.
- [x] Offline, loading, empty, error, permission-denied, and retry states are
      designed and tested.
- [x] CI and explicit EAS development/preview/production profiles are configured.
- [ ] Signed preview artifacts, observability, and App Check are configured.
- [ ] Performance budgets have measured results, not aspirational numbers.
- [x] The README is a reproducible portfolio case study with current screenshots.
- [ ] All phases and hashes are recorded here and the working tree is clean.

## Current position

Phases 0 through 4 are complete. The Expo SDK 57 product slice builds and runs
on current iOS and Android simulators, and appointment management, calendar,
notifications, scheduled reminders, haptics, and saved clinicians are all
implemented. Phase 1 platform proof is recorded in
`docs/phase-1-verification.md`; cloud-backed discovery, native accounts,
server-owned profiles, and synchronized preferences are recorded in
`docs/phase-2-verification.md`; transactional booking and durable confirmation
are recorded in `docs/phase-3-verification.md`.

The new `hakeemi-portfolio-dev` project contains the deterministic fictional
seed, while the inaccessible legacy project remains untouched. The booking
callable prevents double reservations, safe mobile drafts survive
authentication, owner appointments survive a native process restart, and
management callables atomically transition appointment/slot state with
server-only operation receipts. Confirmed appointment details can request
calendar access and create a non-sensitive event through the native Expo
adapter; web and Jest intentionally report the unavailable state. Optional
notification permission, owner-scoped FCM token registration, refresh handling,
typed appointment notification routing, scheduled generic reminders, idempotent
delivery receipts, and native haptics are also in place.
Disposable emulator verification data was removed after the checks. Cloud
Functions and Storage deployment remain an explicit Blaze-plan boundary. The
native iOS management journey (book → reschedule → cancel, in Arabic/RTL
against the seeded emulators) was completed interactively in the iOS Simulator
and is recorded with screenshots in `docs/phase-4-verification.md`; it is not an
automated E2E suite. An Android-hardware pass and the calendar/notification
permission dialogs remain for release sign-off.

Phase 5 implementation is substantially complete: the app has a recoverable
route error boundary, privacy-safe development logging, font scaling,
RTL-aware text direction, locale-aware date/time formatting, reduced-motion
navigation, and stale-data behavior. The full Arabic UI copy ships through typed
bilingual string catalogs covering every screen, validation message, error
mapping, and accessibility label, with Arabic plural rules for all counts.
Selecting Arabic persists the native RTL layout direction through
`I18nManager` with a restart hint, directional icons mirror automatically,
and onboarding decor uses logical offsets. The inclusive/resilient work is
recorded in `docs/phase-5-verification.md`. The Arabic copy has been through
a native-level consistency review, provider catalog data (names, credentials,
bios, languages) is bilingual with English fallback for untranslated
documents, and the development seed was re-run with the bilingual catalog.
Dynamic Type, dark mode, accessibility-tree order, and tablet layout have
native evidence. Spoken VoiceOver/TalkBack journeys, rotation, physical
small-phone checks, Android hardware, and native permission-dialog checks
remain release sign-off work.

Phase 6 groundwork is also present: CI runs the full application and Firebase
matrix, a weekly dependency-health workflow checks Expo alignment and security
advisories, the testing and privacy-safe analytics contracts are documented,
and EAS profiles define development, simulator, preview, and production
environments. Signing, installable preview artifacts, App Check, observability,
analytics instrumentation, and measured performance budgets remain open.

The new visual identity includes a welcome hero, three feature illustrations,
six fictional clinician portraits, six state illustrations, and an updated
native screenshot gallery. Onboarding now uses four full-screen steps with one
illustration and message per page plus Back, Next, Skip, progress, and touch
swiping; it no longer stacks a vertical welcome above an embedded carousel.
The pages use native horizontal slide-out/slide-in transitions, reverse their
physical order for Arabic RTL, and make button navigation instant when reduced
motion is requested. Skip and final Continue persist a versioned AsyncStorage
completion flag and lead to a separate signed-out Welcome route. Returning
visitors therefore bypass onboarding and land on Welcome, which exclusively
owns Create account, Sign in, and Explore demo. The portfolio/fictional-data
disclaimer remains outside onboarding. Provider portraits now use repaired
source artwork with complete hair, head-covering, and head silhouettes plus
consistent transparent headroom; `contain` fitting keeps the full composition
visible at card and profile sizes without sharp canvas-edge cuts. All 16
illustrations are native-safe WebP files totaling 819.1 KB, down from roughly
4.6 MB, and CI enforces 150 KB per-file/1 MB aggregate budgets.

The 21 July 2026 onboarding/avatar refinement is complete in reviewable commits.
`d89c762` removed the repeated disclaimer, and its interim finish-step auth
placement was superseded by `a5dcff4`, which introduced the persisted onboarding
gate and standalone Welcome route. `abec842` added native paged motion, touch
swiping, RTL order, and reduced-motion behavior. `ac3b7d6` replaced all six
visibly cropped portrait sources with identity-preserving, naturally framed
artwork. The refreshed iOS screenshots in `docs/images/` record the final state.

The 5 September 2026 release-readiness pass is recorded in reviewable commits.
`ee0380c` merged the Remotion promo project, the README highlight loop, and the
70-second promo; `3154058` added a silent master and documented that the music
bed is AI-generated (Google Lyria), removed the high-severity Functions
advisory, and made the weekly dependency-health job audit both dependency trees
and scan the checked-out tree for secrets independently of Expo Doctor
(`443ccfd`). `679d9c2` aligned every Expo SDK 57 package with the current patch
releases and regenerated the lockfile so `npm ci` and Expo Doctor are green
again. `da96760` replaced the Expo template icon, adaptive icon, monochrome,
splash mark, favicon, and iOS Icon Composer bundle with the Hakeemi pulse mark
already used in the promo, and removed the unreferenced 2021 repository banner.
A history scan found one token-bearing legacy Storage URL (`person.png` in the
`hakeemi` project, which is reachable from the owner account despite earlier
notes) and the public legacy client API key; both remain in Git history by
design and are tracked as release hygiene, not as an incident.

The 12 October 2026 toolchain pass moved native builds to Xcode 27.0 (27A266a)
and the iOS 27 SDK. Expo's SDK 57 release notes state that apps built with the
iOS 27 SDK must use the UIKit scene-based lifecycle, which SDK 57 supports only
from `expo@57.0.23` as an opt-in; the locked `57.0.20` predated it. The pass
therefore ran `npx expo install --fix`, which moved `expo` to `~57.0.28` (the
npm `latest` tag; SDK 58 stays out of scope while it is `next`) together with
the `expo-*` packages and `jest-expo`, while React Native stayed at 0.86.3 and
React Native Firebase at 25.1.0. `app.config.ts` now enables `ios.enableSceneSupport`
through `expo-build-properties`, so prebuild makes the generated AppDelegate
conform to `ExpoReactNativeFactoryProvider` and adds a scene manifest that
points at Expo's `EXExpoAppSceneDelegate`. Two local config plugins under
`plugins/` handle a checkout whose path contains a space (such as the external
SSD). One quotes the `react-native-xcode.sh` command substitution at the end of
the template's "Bundle React Native code and images" phase. The other extends
the generated Podfile's `post_install` hook to rewrite the expo-constants
"Generate app.config" phase: `expo-constants@57` leaves both the script path
and the script's own `basename $PROJECT_DIR` unquoted, so the phase silently
wrote no `app.config` and a Release build crashed at launch. The rewritten
phase quotes the path and passes the project root explicitly; a clean Release
simulator build from the SSD then embedded `app.config` and launched to
onboarding (13 October 2026, `docs/xcode-27-verification.md`). The lockfile was regenerated because
the previous one no longer satisfied `npm ci` under npm 11.19, and a clean
`npm ci` followed by `npm run validate` is green again. Native evidence is
recorded in `docs/xcode-27-verification.md`.

The 13 October 2026 release-configuration pass made the public environment
fail closed. `src/config/env.ts` now resolves the three `EXPO_PUBLIC_*`
variables per bundle type: a development bundle (`__DEV__`) keeps the
emulator-first defaults so a fresh clone runs without a `.env` file, while a
release bundle receives no defaults and throws at module load when a variable
is missing or blank or when emulator mode is requested, and the emulator flag
is only accepted together with the `development` channel. The native Firebase
initializer repeats the check and connects the Emulator Suite only from a
development bundle on the development channel, so a Release build cannot reach
`127.0.0.1` or `10.0.2.2` even if its variables were wrong. Unit tests cover
the resolver, the module load under both bundle types, and the initializer
guard. `eas.json` already sets all three variables on every profile; all
three profiles, including `production`, still target `hakeemi-portfolio-dev`,
and `app.config.ts` carries no EAS project ID, so the production mapping is an
open owner decision rather than a code change.

The 13 October 2026 reminder-delivery pass made reminder failures observable
and retryable without widening what the job knows or logs. The scheduled job
now logs each failed delivery through the Functions structured logger with the
hashed reminder ID, attempt number, and error code; retries deliveries that
failed before any device could have received them (three attempts in total,
only while the appointment is still confirmed and upcoming, which with the
24-hour lead bounds retries well inside the nominal 48-hour lookback); records
`sent` or `abandoned` without retrying once a send has been issued, and leaves a
`sending` receipt alone when even that final write fails; marks credential,
permission, sender, and argument failures `abandoned`; settles receipts from
before this change as `abandoned` rather than guessing whether they were
delivered; and sends Arabic generic copy to devices whose stored locale is `ar`
or an `ar-*` variant. Receipts gained `attempts`, `outcomeCode` and
`sendIssuedAt` fields and an `abandoned` status; existing receipts need no
migration. The Functions unit suite covers the copy, locale resolution, and
error classification, and the emulator reminder suite covers retry, the attempt
cap, non-retryable failures, cancellation before a retry, per-locale delivery,
rejected-token cleanup, post-send bookkeeping and later-batch failures without
a second delivery, legacy receipts, and the absence of token, email, and
appointment detail from the captured logs.

The 13 October 2026 identity and first-run pass replaced the stock Ionicons
pulse glyph with an original Hakeemi mark: an uppercase H whose crossbar is a
single heartbeat, drawn once as `assets/brand/hakeemi-mark.svg` and rendered
into every icon, adaptive-icon, splash, favicon and in-app asset by
`npm run assets:brand` (`scripts/render-brand-assets.swift`). The native splash
now uses the light or dark canvas colour with the tilted brand tile, the root
layout holds the splash until the session has restored and then fades it out
(instantly under reduced motion, with a three-second release so the in-app
gate takes over if restoration stalls), and the first React frame is a
`LaunchGate` drawing the same tile at the same size, so launch no longer cuts
from teal to a spinner. Onboarding is three first-run steps instead of four
slides: language and appearance choices persisted as guest preferences, a
find/compare/book summary, and a statement that calendar and notification
access are requested only in context. Skip and Continue keep the versioned
completion flag, Welcome still owns Create account / Sign in / Explore demo,
and the session guard still redirects authenticated and demo users before any
onboarding route renders. Details are in `docs/visual-identity.md`.

## Next execution queue

1. Measure cold start, interaction latency, list frame stability, and JS bundle
   size on representative iOS and Android builds; the bundled illustration
   payload now has a measured and enforced budget.
2. Complete the manual Phase 5/4 sign-off matrix: VoiceOver, TalkBack, rotation,
   a physical small phone, Android hardware, and calendar/notification denial.
3. Add privacy-safe Crashlytics, Performance Monitoring, and analytics, then
   enable App Check in monitor mode before considering enforcement.
4. Log in to EAS (`eas login`), configure signing through EAS credentials, and
   attach signed preview builds with an install link and QR code. Account-backed
   booking in a preview build also needs the Cloud Functions deployed to
   `hakeemi-portfolio-dev` (Blaze boundary); demo mode works without them.
   Before the first cloud build, decide whether the `production` profile keeps
   targeting `hakeemi-portfolio-dev` or gets its own Firebase project and real
   Google service files, and run `eas build:configure` so `app.config.ts`
   carries the EAS project ID.
5. Revoke or regenerate the `person.png` download token in the legacy `hakeemi`
   Storage bucket and confirm the legacy client API key is restricted; then
   decide whether the `promo` soundtrack stays AI-generated or is replaced.
