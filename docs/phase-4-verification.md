# Phase 4 Verification — Appointment Management Checkpoint

> Verified: 2026-07-20
>
> Scope: atomic cancellation/rescheduling and the authenticated appointment
> management experience. Native calendar, notification, and management E2E are
> intentionally not claimed as complete yet.

## Outcome

An authenticated patient can open an appointment detail route, review its
provider, time, visit mode, and timezone, cancel it with an explicit
confirmation, or choose another available slot with the same provider. The
mobile client sends lifecycle writes only through callable Functions.

## Backend guarantees

- `cancelAppointment` and `rescheduleAppointment` run slot and appointment
  changes in one Firestore transaction.
- Cancellation is limited to the appointment owner and records
  `cancelledAt`/`cancelledBy` audit fields.
- Cancellation and rescheduling reject appointments inside a 15-minute lead
  time. Rescheduling also reuses the booking window and requires an available
  slot owned by the same active provider.
- Every lifecycle mutation includes a UUID request key. A server-only,
  SHA-256-keyed operation receipt makes uncertain retries safe and rejects
  payload conflicts behind an already-used key.
- Slot versions increment on release and reservation, and direct client writes
  remain denied by Security Rules.

The isolated `demo-hakeemi` callable suite passes five integration tests covering
atomic cancellation, audit metadata, replay, lead-time policy, rescheduling,
occupied targets, request-key conflicts, owner isolation, and no partial moves.

## Mobile behavior

- The Appointments tab groups confirmed future visits, past visits, and
  cancelled visits without trusting status labels from route parameters.
- `/appointments/[appointmentId]` is deep-linkable and owner-protected by the
  Firestore read boundary.
- Cancel and reschedule actions are disabled while a mutation is pending,
  check connectivity before submission, and invalidate list/detail queries on
  success.
- Rescheduling shows only the provider's current available slots and leaves the
  current appointment untouched until the server transaction succeeds.
- Web and Jest use explicit fixture/unavailable adapters; native uses
  React Native Firebase and the callable Functions.

## Quality evidence

| Check                                       | Result                                      |
| ------------------------------------------- | ------------------------------------------- |
| Application tests                           | 28 suites, 69 tests passed                  |
| Functions unit tests                        | 9 tests passed                              |
| Appointment-management callable integration | 5 tests passed                              |
| Strict TypeScript                           | App, Firebase tooling, and Functions passed |
| Lint and formatting                         | Passed                                      |
| Static web export                           | 21 routes, including appointment detail     |
| Expo Doctor                                 | 20/20 checks passed                         |

## Remaining Phase 4 work

Calendar permission education and event creation, notification permission and
token registration, reminder delivery/deep links, restrained haptics, and a
native iOS/Android management E2E journey remain the next implementation slice.
