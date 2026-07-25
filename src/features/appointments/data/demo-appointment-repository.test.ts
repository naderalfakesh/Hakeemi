import {
  buildDemoAppointmentFixtures,
  DemoAppointmentRepository,
} from './demo-appointment-repository';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe('DemoAppointmentRepository', () => {
  const now = new Date('2026-07-25T08:00:00.000Z');

  it('starts with useful upcoming, completed, and cancelled appointments', () => {
    expect(buildDemoAppointmentFixtures(now).map(({ status }) => status)).toEqual([
      'confirmed',
      'completed',
      'cancelled',
    ]);
  });

  it('books and replays a fictional slot without an authenticated account', async () => {
    const repository = new DemoAppointmentRepository(() => now);
    const input = {
      reasonCategory: 'routine_visit' as const,
      requestId: 'request-1',
      slotId: 'lina-video-early',
    };

    const first = await repository.book(input);
    const replay = await repository.book(input);

    expect(first.isReplay).toBe(false);
    expect(first.appointment).toMatchObject({
      providerId: 'lina-haddad',
      slotId: input.slotId,
    });
    expect(replay).toMatchObject({
      appointment: { id: first.appointment.id },
      isReplay: true,
    });
    await expect(repository.listAppointments()).resolves.toHaveLength(4);
  });
});
