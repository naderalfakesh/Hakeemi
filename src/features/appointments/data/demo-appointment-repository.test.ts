import { buildDemoAppointmentFixtures } from './demo-appointment-fixtures';
import { DemoAppointmentRepository } from './demo-appointment-repository';

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

  it('cancels without editing appointments it already returned', async () => {
    const repository = new DemoAppointmentRepository(() => now);
    const before = await repository.getAppointment('demo-upcoming-omar');
    const listed = await repository.listAppointments();

    const result = await repository.cancel({
      appointmentId: 'demo-upcoming-omar',
      requestId: 'cancel-1',
    });

    expect(result.appointment.status).toBe('cancelled');
    expect(before?.status).toBe('confirmed');
    expect(listed.find(({ id }) => id === 'demo-upcoming-omar')?.status).toBe('confirmed');
    await expect(repository.getAppointment('demo-upcoming-omar')).resolves.toMatchObject({
      cancelledBy: 'patient',
      status: 'cancelled',
    });
  });

  it('reschedules into a new object and leaves state unchanged when a move fails', async () => {
    const repository = new DemoAppointmentRepository(() => now);
    const before = await repository.getAppointment('demo-upcoming-omar');

    await expect(
      repository.reschedule({
        appointmentId: 'demo-upcoming-omar',
        requestId: 'move-missing',
        slotId: 'no-such-slot',
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(repository.getAppointment('demo-upcoming-omar')).resolves.toEqual(before);

    const moved = await repository.reschedule({
      appointmentId: 'demo-upcoming-omar',
      requestId: 'move-1',
      slotId: 'omar-clinic-morning',
    });

    expect(moved.appointment.slotId).toBe('omar-clinic-morning');
    expect(before?.slotId).toBe('demo-seeded-omar-upcoming');
  });
});
