import type { Appointment } from '../domain/types';

export const DEMO_PATIENT_ID = 'demo-patient';

export function buildDemoAppointmentFixtures(referenceDate = new Date()): Appointment[] {
  return [
    createDemoAppointment(referenceDate, {
      clinicId: 'barari-medical-centre',
      dayOffset: 3,
      durationMinutes: 45,
      hourUtc: 6,
      id: 'demo-upcoming-omar',
      minuteUtc: 15,
      providerId: 'omar-rahman',
      reasonCategory: 'follow_up',
      slotId: 'demo-seeded-omar-upcoming',
      status: 'confirmed',
      visitMode: 'in_person',
    }),
    createDemoAppointment(referenceDate, {
      clinicId: 'harbour-telehealth',
      dayOffset: -9,
      durationMinutes: 30,
      hourUtc: 8,
      id: 'demo-completed-lina',
      minuteUtc: 0,
      providerId: 'lina-haddad',
      reasonCategory: 'routine_visit',
      slotId: 'demo-seeded-lina-completed',
      status: 'completed',
      visitMode: 'video',
    }),
    createDemoAppointment(referenceDate, {
      clinicId: 'marsa-family-clinic',
      dayOffset: -18,
      durationMinutes: 30,
      hourUtc: 11,
      id: 'demo-cancelled-priya',
      minuteUtc: 30,
      providerId: 'priya-menon',
      reasonCategory: 'new_concern',
      slotId: 'demo-seeded-priya-cancelled',
      status: 'cancelled',
      visitMode: 'in_person',
    }),
  ];
}

function createDemoAppointment(
  referenceDate: Date,
  template: {
    clinicId: string | null;
    dayOffset: number;
    durationMinutes: number;
    hourUtc: number;
    id: string;
    minuteUtc: number;
    providerId: string;
    reasonCategory: Appointment['reasonCategory'];
    slotId: string;
    status: Appointment['status'];
    visitMode: Appointment['visitMode'];
  },
): Appointment {
  const startsAt = new Date(referenceDate);
  startsAt.setUTCHours(template.hourUtc, template.minuteUtc, 0, 0);
  startsAt.setUTCDate(startsAt.getUTCDate() + template.dayOffset);
  const createdAt = new Date(startsAt.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const cancelledAt =
    template.status === 'cancelled'
      ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1_000).toISOString()
      : null;

  return {
    cancelledAt,
    cancelledBy: cancelledAt ? 'patient' : null,
    clinicId: template.clinicId,
    createdAt: createdAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + template.durationMinutes * 60_000).toISOString(),
    id: template.id,
    patientId: DEMO_PATIENT_ID,
    providerId: template.providerId,
    reasonCategory: template.reasonCategory,
    slotId: template.slotId,
    startsAt: startsAt.toISOString(),
    status: template.status,
    timezone: 'Asia/Dubai',
    updatedAt: cancelledAt ?? createdAt.toISOString(),
    visitMode: template.visitMode,
  };
}
