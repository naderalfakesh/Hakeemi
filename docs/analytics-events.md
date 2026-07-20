# Analytics Event Contract

> Status: defined, not yet instrumented. Wiring Firebase Analytics (or any
> vendor) is deferred until the observability decision in Phase 6 is funded;
> this contract is the gate any implementation must satisfy.

## Privacy boundary

Hakeemi is a healthcare-shaped product, so the analytics boundary is stricter
than the data model:

- **Never recorded:** appointment reason categories, free-text input of any
  kind, email addresses, display names, Firebase UIDs in event parameters,
  exact appointment timestamps, device contact/calendar data, and anything
  entered on an auth screen.
- **Allowed:** public catalog identifiers (`provider_id`, `specialty_id`,
  `clinic_id` — fictional, server-owned data), coarse buckets, enums, and
  booleans listed below.
- User identity comes only from the analytics SDK's app-instance ID; events
  are never joined to the Firestore patient documents.
- Events fire only after an explicit consent toggle (to be added alongside
  instrumentation); default is off.

## Buckets and enums

- `lead_time_bucket`: `same_day | within_week | beyond_week`
- `visit_mode`: `video | in_person`
- `failure_code`: the domain failure codes already used by error localization
  (`conflict`, `network`, `unavailable`, …) — never raw error messages.

## Events

| Event                     | Parameters                         | Moment                                            |
| ------------------------- | ---------------------------------- | ------------------------------------------------- |
| `discovery_search_used`   | `has_query: bool`, `specialty_id?` | Search text submitted or specialty filter changed |
| `provider_profile_viewed` | `provider_id`, `specialty_id`      | Provider detail screen becomes visible            |
| `slot_selected`           | `visit_mode`, `lead_time_bucket`   | User chooses an availability slot                 |
| `booking_confirmed`       | `visit_mode`, `lead_time_bucket`   | Booking callable resolves successfully            |
| `booking_failed`          | `failure_code`                     | Booking callable rejects                          |
| `appointment_cancelled`   | `lead_time_bucket`                 | Cancellation callable resolves                    |
| `appointment_rescheduled` | `visit_mode`                       | Reschedule callable resolves                      |
| `saved_provider_toggled`  | `provider_id`, `saved: bool`       | Bookmark toggled                                  |
| `reminders_opt_in`        | `granted: bool`                    | Notification permission flow completes            |
| `locale_changed`          | `locale: en\|ar`                   | Language preference saved                         |
| `theme_changed`           | `theme: system\|light\|dark`       | Appearance preference saved                       |

## Review rule

Any new event or parameter is reviewed against the privacy boundary above in
the pull request that introduces it, and this document is updated in the same
commit. Events that would require weakening the "never recorded" list are
rejected, not negotiated.
