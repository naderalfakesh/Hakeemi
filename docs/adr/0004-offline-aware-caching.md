# ADR 0004: Offline-aware caching with visible staleness

- Status: Accepted
- Date: 2026-07-20

## Context

Provider discovery and the appointment list read from Firestore through
TanStack Query with a five-minute `staleTime` and a thirty-minute `gcTime`.
Before this decision, any failed refetch collapsed a screen into its error
state even when a healthy cached result was already on screen, and nothing
told the user that the data they were reading might be old. Booking already
refuses to run offline; reads deserved the same deliberate treatment.

## Decision

Reads keep serving the cached result when a refresh fails; only a load with
no cached data at all shows the designed error state. Whenever a screen is
rendering data that may be behind the server — the device is offline, or the
most recent background refresh failed — a shared `StaleDataNotice` announces
it in the active locale with the last successful update time, through a
polite accessibility live region.

- `useProviderDiscovery` distinguishes "no data" (error state) from
  "refresh failed over cached data" (`isRefreshFailed` + `lastUpdatedAt`).
- The appointments list keeps its cached entries on refetch failure and shows
  the notice instead of replacing the list with an error screen.
- A shared `useIsOffline` hook reads `expo-network`, treating an unknown
  network state as online so the notice never flashes during startup.
- Mutations are unchanged: bookings, cancellations, and reschedules still
  check connectivity first and are never queued offline (ADR 0003).

## Consequences

- Users keep browsing previously loaded clinicians and appointments in poor
  connectivity, with an honest, localized signal instead of silent staleness.
- Query tuning stays centralized in `createAppQueryClient`; screens consume
  derived flags rather than raw query internals.
- The web static export always reports online, so the portfolio demo renders
  without the notice unless a refresh genuinely fails.
