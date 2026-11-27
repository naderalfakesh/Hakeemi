import type { AvailabilitySlot, VisitMode } from '../../domain/types';

const DEMO_TIMEZONE = 'Asia/Dubai';
const MILLISECONDS_PER_MINUTE = 60_000;

type SlotEntry = readonly [
  id: string,
  clinicId: string | null,
  dayOffset: number,
  startHourUtc: number,
  startMinute: number,
  visitMode: VisitMode,
];

type ProviderSchedule = {
  durationMinutes: number;
  providerId: string;
  slots: readonly SlotEntry[];
};

const providerSchedules: readonly ProviderSchedule[] = [
  {
    providerId: 'lina-haddad',
    durationMinutes: 30,
    slots: [
      ['lina-video-early', 'harbour-telehealth', 1, 5, 30, 'video'],
      ['lina-clinic-day-1-0700', 'marsa-family-clinic', 1, 7, 0, 'in_person'],
      ['lina-clinic-late', 'marsa-family-clinic', 2, 10, 0, 'in_person'],
      ['lina-clinic-day-4-0500', 'marsa-family-clinic', 4, 5, 0, 'in_person'],
      ['lina-video-day-7-0930', 'harbour-telehealth', 7, 9, 30, 'video'],
      ['lina-clinic-day-10-0630', 'marsa-family-clinic', 10, 6, 30, 'in_person'],
      ['lina-video-day-12-1200', 'harbour-telehealth', 12, 12, 0, 'video'],
    ],
  },
  {
    providerId: 'omar-rahman',
    durationMinutes: 45,
    slots: [
      ['omar-clinic-day-2-0530', 'barari-medical-centre', 2, 5, 30, 'in_person'],
      ['omar-clinic-morning', 'barari-medical-centre', 3, 6, 15, 'in_person'],
      ['omar-clinic-day-3-0900', 'barari-medical-centre', 3, 9, 0, 'in_person'],
      ['omar-clinic-day-6-0700', 'barari-medical-centre', 6, 7, 0, 'in_person'],
      ['omar-clinic-day-9-0500', 'barari-medical-centre', 9, 5, 0, 'in_person'],
      ['omar-clinic-day-12-1030', 'barari-medical-centre', 12, 10, 30, 'in_person'],
    ],
  },
  {
    providerId: 'priya-menon',
    durationMinutes: 30,
    slots: [
      ['priya-video-morning', 'harbour-telehealth', 1, 8, 0, 'video'],
      ['priya-video-day-1-1000', 'harbour-telehealth', 1, 10, 0, 'video'],
      ['priya-clinic-late', 'marsa-family-clinic', 4, 11, 30, 'in_person'],
      ['priya-clinic-day-6-0530', 'marsa-family-clinic', 6, 5, 30, 'in_person'],
      ['priya-video-day-8-0800', 'harbour-telehealth', 8, 8, 0, 'video'],
      ['priya-clinic-day-11-1030', 'marsa-family-clinic', 11, 10, 30, 'in_person'],
    ],
  },
  {
    providerId: 'samir-nasser',
    durationMinutes: 30,
    slots: [
      ['samir-video-morning', 'harbour-telehealth', 2, 7, 45, 'video'],
      ['samir-video-day-2-0900', 'harbour-telehealth', 2, 9, 0, 'video'],
      ['samir-clinic-day-5-0530', 'barari-medical-centre', 5, 5, 30, 'in_person'],
      ['samir-video-day-8-0600', 'harbour-telehealth', 8, 6, 0, 'video'],
      ['samir-clinic-day-10-0830', 'barari-medical-centre', 10, 8, 30, 'in_person'],
      ['samir-video-day-13-1000', 'harbour-telehealth', 13, 10, 0, 'video'],
    ],
  },
  {
    providerId: 'aisha-bello',
    durationMinutes: 50,
    slots: [
      ['aisha-video-afternoon', 'harbour-telehealth', 1, 12, 0, 'video'],
      ['aisha-video-day-1-1400', 'harbour-telehealth', 1, 14, 0, 'video'],
      ['aisha-video-day-3-0900', 'harbour-telehealth', 3, 9, 0, 'video'],
      ['aisha-video-day-5-1100', 'harbour-telehealth', 5, 11, 0, 'video'],
      ['aisha-video-day-8-0800', 'harbour-telehealth', 8, 8, 0, 'video'],
      ['aisha-video-day-11-1200', 'harbour-telehealth', 11, 12, 0, 'video'],
      ['aisha-video-day-13-1000', 'harbour-telehealth', 13, 10, 0, 'video'],
    ],
  },
  {
    providerId: 'noor-al-mansouri',
    durationMinutes: 40,
    slots: [
      ['noor-clinic-day-2-0630', 'marsa-family-clinic', 2, 6, 30, 'in_person'],
      ['noor-clinic-morning', 'marsa-family-clinic', 5, 5, 0, 'in_person'],
      ['noor-clinic-day-5-0800', 'marsa-family-clinic', 5, 8, 0, 'in_person'],
      ['noor-clinic-day-7-0700', 'marsa-family-clinic', 7, 7, 0, 'in_person'],
      ['noor-clinic-day-9-0530', 'marsa-family-clinic', 9, 5, 30, 'in_person'],
      ['noor-clinic-day-12-0900', 'marsa-family-clinic', 12, 9, 0, 'in_person'],
    ],
  },
];

export function buildAvailabilityFixtures(referenceDate = new Date()): readonly AvailabilitySlot[] {
  return providerSchedules.flatMap(({ durationMinutes, providerId, slots }) =>
    slots.map(([id, clinicId, dayOffset, startHourUtc, startMinute, visitMode]) => {
      const startsAt = new Date(referenceDate);
      startsAt.setUTCHours(startHourUtc, startMinute, 0, 0);
      startsAt.setUTCDate(startsAt.getUTCDate() + dayOffset);

      const endsAt = new Date(startsAt.getTime() + durationMinutes * MILLISECONDS_PER_MINUTE);

      return {
        id,
        providerId,
        clinicId,
        visitMode,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: DEMO_TIMEZONE,
        status: 'available' as const,
      };
    }),
  );
}
