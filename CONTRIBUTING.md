# Contributing

Hakeemi is a portfolio project, but it is run like a production codebase.
These rules keep it reviewable and reproducible.

## Ground rules

- **Fictional data only.** Never commit real patient, clinician, or medical
  information — including in tests, fixtures, screenshots, or issue reports.
- **Read [`docs/ROADMAP.md`](docs/ROADMAP.md) first.** Work lands in roadmap
  order; the "Current position" section is the source of truth for state.
- **Preserve history.** The `legacy-v1` tag and existing commits are never
  rewritten.
- **Both languages ship together.** Any user-facing string lands in the
  English and Arabic bundles in the same commit, including accessibility
  labels. English copy changes are copy edits; treat them separately from
  localization plumbing.

## Setup

Follow the "Run locally" section of the [README](README.md). `npm run validate`
must pass before you open a pull request:

```sh
npm run validate   # formatting, lint, strict types, tests, Expo Doctor
```

Firebase contract changes additionally require the relevant emulator suites
(`npm run firebase:rules:test`, `firebase:booking:test`,
`firebase:appointment-management:test`, …).

## Commits

- Single-line [Conventional Commit](https://www.conventionalcommits.org)
  subjects without scopes or bodies, e.g. `feat: add saved providers`.
- One focused change per commit; keep it runnable where practical.
- Update the roadmap checkboxes and `SESSION.md` in the commit that completes
  a checkpoint, and record verification evidence under `docs/`.

## Testing expectations

The [testing strategy](docs/testing-strategy.md) defines the pyramid and the
critical-path list. In short: domain logic and screens get Jest coverage in
both locales, Firebase contracts get emulator integration tests, and native
behavior gets a recorded simulator journey. No repository-wide coverage
percentage is enforced — the critical-path list is the gate.

## Privacy and analytics

Any telemetry must satisfy the event contract in
[`docs/analytics-events.md`](docs/analytics-events.md). Events that would
require recording health-adjacent data are rejected.
