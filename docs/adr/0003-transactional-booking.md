# ADR 0003: Make booking transactional and explicitly idempotent

- Status: Accepted
- Date: 2026-07-20

## Context

The legacy application appended appointment objects directly to a provider
document. Two clients could select the same slot, patient identifiers were
mixed into public provider data, and a lost response could encourage a user to
submit the same booking again.

Hakeemi needs to guarantee that one availability slot produces at most one
appointment. Mobile networks also make retries normal, so the operation must
distinguish a safe replay from a new competing request.

## Decision

`bookAppointment` is an authenticated callable Function. The client may send
only:

- an existing availability slot ID;
- a UUID request ID generated once for that booking attempt;
- an optional category from a fixed, non-sensitive reason list.

The patient ID comes only from the verified Firebase Auth context. The server
hashes the patient ID and request ID into a deterministic appointment document
ID; neither value is exposed in the document path. Replaying the same semantic
request returns the existing confirmed appointment. Reusing the request ID for
a different slot or reason fails.

One Firestore transaction:

1. checks for an existing idempotent appointment;
2. reads and validates the requested slot;
3. verifies the active provider owns the clinic and visit mode;
4. rejects unavailable slots and starts outside the 15-minute to 90-day booking
   window;
5. creates a private appointment snapshot; and
6. moves the slot from `available` to `booked`, links the appointment, and
   increments its version.

All transaction reads happen before writes. Firestore retries the transaction
when another writer changes a document it read, so concurrent attempts converge
on one committed appointment and one unavailable result.

## Consequences

- Clients cannot choose or forge the patient identity.
- Public provider documents never contain patient identifiers.
- An appointment remains a historical snapshot even if provider or clinic data
  later changes.
- The callable can be retried after a timeout without producing a duplicate.
- The client must preserve one request ID while a mutation is pending or being
  retried.
- Free-text medical information is not accepted or stored.
- Cancellation and rescheduling require their own transactions and are deferred
  to Phase 4.
- Cloud deployment remains deferred until Firebase billing is deliberately
  enabled; the complete contract is exercised against the Emulator Suite.

## References

- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firebase callable Functions](https://firebase.google.com/docs/functions/callable)
