import {
  AppointmentDataValidationError,
  appointmentActionResultSchema,
  mapAppointmentDocument,
} from './schemas';

const timestamp = (value: string) => ({ toDate: () => new Date(value) });

describe('appointment document mapper', () => {
  it('converts a private Firestore appointment into serializable domain data', () => {
    expect(
      mapAppointmentDocument('appointment-1', {
        cancelledAt: null,
        cancelledBy: null,
        clinicId: 'marsa-family-clinic',
        createdAt: timestamp('2026-07-20T08:00:00.000Z'),
        endsAt: timestamp('2026-07-22T08:30:00.000Z'),
        patientId: 'patient-1',
        providerId: 'lina-haddad',
        reasonCategory: 'routine_visit',
        slotId: 'lina-slot',
        startsAt: timestamp('2026-07-22T08:00:00.000Z'),
        status: 'confirmed',
        timezone: 'Asia/Dubai',
        updatedAt: timestamp('2026-07-20T08:00:00.000Z'),
        visitMode: 'in_person',
      }),
    ).toMatchObject({
      id: 'appointment-1',
      startsAt: '2026-07-22T08:00:00.000Z',
      status: 'confirmed',
    });
  });

  it('rejects incomplete private records', () => {
    expect(() => mapAppointmentDocument('broken', { status: 'confirmed' })).toThrow(
      AppointmentDataValidationError,
    );
  });

  it('accepts lifecycle summaries with cancellation audit metadata', () => {
    expect(
      appointmentActionResultSchema.parse({
        appointment: {
          cancelledAt: '2030-01-01T08:00:00.000Z',
          cancelledBy: 'patient',
          clinicId: 'marsa-family-clinic',
          endsAt: '2030-01-22T08:30:00.000Z',
          id: 'appointment-1',
          providerId: 'lina-haddad',
          reasonCategory: 'routine_visit',
          slotId: 'lina-slot',
          startsAt: '2030-01-22T08:00:00.000Z',
          status: 'cancelled',
          timezone: 'Asia/Dubai',
          visitMode: 'in_person',
        },
        isReplay: false,
      }),
    ).toMatchObject({ appointment: { cancelledBy: 'patient', status: 'cancelled' } });
  });
});
