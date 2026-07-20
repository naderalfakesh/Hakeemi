# Phase 4 Verification — Appointment Management and Native Follow-through

> Verified: 2026-07-20
>
> Scope: atomic cancellation/rescheduling, the authenticated appointment
> management experience, native calendar follow-through, notification
> registration/routing plumbing, scheduled delivery, and restrained haptics.
> Native management E2E is intentionally not claimed as complete yet.

## Outcome

An authenticated patient can open an appointment detail route, review its
provider, time, visit mode, and timezone, cancel it with an explicit
confirmation, choose another available slot with the same provider, or add a
confirmed visit to a writable device calendar. The mobile client sends
lifecycle writes only through callable Functions.

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
- Confirmed appointment details request calendar access only when the patient
  taps “Add to calendar”; denial and missing writable calendars remain visible,
  recoverable states and do not block cancellation or rescheduling.
- Native uses `expo-calendar` with a config-plugin permission explanation;
  web and Jest use explicit unavailable adapters so the portfolio export stays
  deterministic.
- The Profile screen explains optional appointment reminders and requests
  notification permission only after an explicit tap. Native FCM tokens are
  registered through a callable Function; web and Jest report unavailable.
- FCM notification data is parsed through a strict appointment-reminder
  contract and routes only to `/appointments/[appointmentId]`, including a
  pending handoff while Auth restores.
- A Pub/Sub-backed scheduled Function scans the bounded upcoming window every
  15 minutes, sends generic FCM content, and records a server-only idempotency
  receipt so retries do not send a second reminder.
- Reminder data contains only an appointment ID and event type. Provider,
  patient, email, token, and visit details are excluded from payloads and
  structured logs; invalid registration tokens are disabled after send.
- Booking success and destructive confirmation trigger native success/warning
  haptics, with deterministic no-op adapters on web and Jest.

## Quality evidence

| Check                                       | Result                                      |
| ------------------------------------------- | ------------------------------------------- |
| Application tests                           | 29 suites, 76 tests passed                  |
| Functions unit tests                        | 12 tests passed                             |
| Appointment-management callable integration | 5 tests passed                              |
| Notification-token callable integration     | 2 tests passed                              |
| Appointment-reminder integration            | 1 test passed                               |
| Strict TypeScript                           | App, Firebase tooling, and Functions passed |
| Lint and formatting                         | Passed                                      |
| Static web export                           | 21 routes, including appointment detail     |
| Expo Doctor                                 | 20/20 checks passed                         |

## Remaining Phase 4 work

An authenticated saved-clinician shortlist is now complete. A native iOS/Android
management E2E journey remains. Calendar and notification permission behavior
still need a native interactive run before release sign-off.
