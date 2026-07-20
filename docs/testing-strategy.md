# Testing Strategy

> The pyramid is enforced by what each layer is allowed to trust, not by a
> coverage percentage. A change ships when its critical path is asserted at
> the cheapest layer that can actually falsify it.

## The pyramid

| Layer                              | Tooling                                            | Runs                | What it owns                                                                                                                                                                  |
| ---------------------------------- | -------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static                             | strict TypeScript, ESLint, Prettier                | every commit and CI | Type contracts (including `exactOptionalPropertyTypes`), import hygiene, formatting.                                                                                          |
| Unit and component                 | Jest + Testing Library (`npm test`)                | every commit and CI | Domain schemas, Firestore mappers and cursors, formatters and plural rules (including the Hermes fallback), string catalogs, screen rendering in English and Arabic, hooks.   |
| Integration against real contracts | Firebase emulators (`firebase/tests`, `functions`) | CI                  | Security rules, profile bootstrap idempotency, transactional booking (replay, contention, forged identity), management transitions, notification tokens, scheduled reminders. |
| End-to-end, interactive            | Development build on simulators, driven journeys   | per checkpoint      | Whole journeys with the real navigation, native modules, and emulator backend; evidence recorded in `docs/phase-*-verification.md` with screenshots.                          |

## Minimum critical-path coverage

These paths must keep executable assertions at the highest listed layer.
Anything below this list is nice-to-have; nothing here may regress silently.

1. Booking transaction: success, safe replay of the same request ID, request-key
   conflict, simultaneous contention, forged identity, anonymous access
   (callable integration).
2. Appointment management: cancel and reschedule release/reserve slots
   atomically, respect the 15-minute policy, and stay owner-scoped (callable
   integration + native journey evidence).
3. Security rules: owner-only reads/writes for profiles, preferences,
   appointments, and saved providers; server-only lifecycle writes (rules
   suite).
4. Discovery: search, specialty filter, cursor pagination without duplicates,
   and offline-stale fallback (unit + hook tests).
5. Localization: every screen renders under `ar` with RTL-safe assertions;
   plural categories match Intl behavior with and without `Intl.PluralRules`.
6. Resilience: booking refuses to run offline and is never queued; error
   states remain reserved for loads with no cached data.

## What we deliberately do not do

- No repository-wide coverage threshold. Percentages reward incidental lines
  and punish deletions; the critical-path list above is the gate.
- No mocking of Firestore rules or callables in integration tests — those runs
  exist precisely to execute the real contracts on emulators.
- No snapshot tests of whole screens; assertions target roles, labels, and
  copy so RTL and accessibility regressions fail loudly.

## Dependency health and upgrade policy

- A scheduled `dependency-health` workflow runs weekly: `expo-doctor`,
  `expo install --check`, outdated reports for both packages, and a
  high-severity production audit.
- Expo SDK upgrades are adopted deliberately, one SDK at a time, shortly after
  the first patch release of a new SDK — never on release day. Each upgrade
  lands as its own commit that must pass the full `npm run validate` plus a
  native simulator smoke run before merging.
- React Native, Firebase, and TanStack majors follow the SDK they ship with;
  they are not upgraded independently unless a security advisory forces it.
