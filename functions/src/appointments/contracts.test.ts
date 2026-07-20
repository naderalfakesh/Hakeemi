import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Timestamp } from 'firebase-admin/firestore';

import {
  appointmentDocumentSchema,
  availabilitySlotDocumentSchema,
  bookAppointmentRequestSchema,
} from './contracts.js';

const startsAt = Timestamp.fromDate(new Date('2030-01-01T08:00:00.000Z'));
const endsAt = Timestamp.fromDate(new Date('2030-01-01T08:30:00.000Z'));
const auditTimestamp = Timestamp.fromDate(new Date('2029-12-01T00:00:00.000Z'));

function availableSlot() {
  return {
    appointmentId: null,
    clinicId: 'marsa-family-clinic',
    createdAt: auditTimestamp,
    endsAt,
    providerId: 'lina-haddad',
    schemaVersion: 1,
    startsAt,
    status: 'available',
    timezone: 'Asia/Dubai',
    updatedAt: auditTimestamp,
    version: 1,
    visitMode: 'in_person',
  } as const;
}

function confirmedAppointment() {
  return {
    cancelledAt: null,
    cancelledBy: null,
    clinicId: 'marsa-family-clinic',
    createdAt: auditTimestamp,
    endsAt,
    patientId: 'alice',
    providerId: 'lina-haddad',
    reasonCategory: 'routine_visit',
    schemaVersion: 1,
    slotId: 'lina-slot',
    startsAt,
    status: 'confirmed',
    timezone: 'Asia/Dubai',
    updatedAt: auditTimestamp,
    visitMode: 'in_person',
  } as const;
}

describe('booking contracts', () => {
  it('normalizes a minimal booking request without accepting identity fields', () => {
    assert.deepEqual(
      bookAppointmentRequestSchema.parse({
        requestId: '018f47a2-65d1-7b21-9c43-ec2870b39f10',
        slotId: 'lina-slot',
      }),
      {
        reasonCategory: null,
        requestId: '018f47a2-65d1-7b21-9c43-ec2870b39f10',
        slotId: 'lina-slot',
      },
    );

    assert.throws(() =>
      bookAppointmentRequestSchema.parse({
        patientId: 'forged-user',
        requestId: '018f47a2-65d1-7b21-9c43-ec2870b39f10',
        slotId: 'lina-slot',
      }),
    );
  });

  it('rejects malformed request IDs and free-text reasons', () => {
    assert.throws(() =>
      bookAppointmentRequestSchema.parse({ requestId: 'retry-me', slotId: 'lina-slot' }),
    );
    assert.throws(() =>
      bookAppointmentRequestSchema.parse({
        reasonCategory: 'private free text',
        requestId: '018f47a2-65d1-7b21-9c43-ec2870b39f10',
        slotId: 'lina-slot',
      }),
    );
  });

  it('accepts a complete available slot and enforces its lifecycle invariants', () => {
    assert.deepEqual(availabilitySlotDocumentSchema.parse(availableSlot()), availableSlot());

    assert.throws(() =>
      availabilitySlotDocumentSchema.parse({
        ...availableSlot(),
        appointmentId: 'alice-appointment',
      }),
    );
    assert.throws(() =>
      availabilitySlotDocumentSchema.parse({
        ...availableSlot(),
        appointmentId: null,
        status: 'booked',
      }),
    );
    assert.throws(() =>
      availabilitySlotDocumentSchema.parse({
        ...availableSlot(),
        endsAt: startsAt,
      }),
    );
  });

  it('accepts a confirmed appointment and requires coherent cancellation metadata', () => {
    assert.deepEqual(
      appointmentDocumentSchema.parse(confirmedAppointment()),
      confirmedAppointment(),
    );

    assert.throws(() =>
      appointmentDocumentSchema.parse({
        ...confirmedAppointment(),
        status: 'cancelled',
      }),
    );
    assert.throws(() =>
      appointmentDocumentSchema.parse({
        ...confirmedAppointment(),
        cancelledAt: auditTimestamp,
        cancelledBy: 'patient',
      }),
    );
  });
});
