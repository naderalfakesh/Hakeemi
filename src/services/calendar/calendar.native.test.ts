import * as Calendar from 'expo-calendar';

import {
  addAppointmentToCalendar,
  listWritableCalendars,
  moveAppointmentCalendarEvent,
  removeAppointmentCalendarEvent,
} from './calendar.native';

jest.mock('expo-calendar', () => ({
  EntityTypes: { EVENT: 'event' },
  ExpoCalendarEvent: { get: jest.fn() },
  getCalendarPermissions: jest.fn(),
  getCalendars: jest.fn(),
  requestCalendarPermissions: jest.fn(),
}));

const mocked = jest.mocked(Calendar);
const granted = { granted: true } as Calendar.PermissionResponse;
const declined = { granted: false } as Calendar.PermissionResponse;

function calendar(overrides: Record<string, unknown>) {
  return {
    allowsModifications: true,
    createEvent: jest.fn().mockResolvedValue({ id: 'event-9' }),
    id: 'calendar-1',
    isPrimary: false,
    source: { name: 'owner@example.test', type: 'com.google' },
    title: 'owner@example.test',
    ...overrides,
  } as unknown as Calendar.ExpoCalendar;
}

const time = {
  endsAt: '2030-10-26T09:30:00.000Z',
  startsAt: '2030-10-26T09:00:00.000Z',
  timezone: 'Asia/Dubai',
};

describe('native calendar service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getCalendarPermissions.mockResolvedValue(granted);
    mocked.requestCalendarPermissions.mockResolvedValue(granted);
  });

  it('lists every writable calendar, primary first, with its account', async () => {
    mocked.getCalendars.mockResolvedValue([
      calendar({ id: 'holidays', allowsModifications: false, title: 'Holidays' }),
      calendar({ id: 'work', source: { name: 'work@example.test' }, title: 'Clinic visits' }),
      calendar({ id: 'primary', isPrimary: true }),
    ]);

    await expect(listWritableCalendars()).resolves.toEqual({
      calendars: [
        { accountName: null, id: 'primary', title: 'owner@example.test' },
        { accountName: 'work@example.test', id: 'work', title: 'Clinic visits' },
      ],
      status: 'ready',
    });
  });

  it('reports declined access before listing calendars', async () => {
    mocked.requestCalendarPermissions.mockResolvedValue(declined);

    await expect(listWritableCalendars()).resolves.toEqual({ status: 'denied' });
    expect(mocked.getCalendars).not.toHaveBeenCalled();
  });

  it('creates the event in the chosen calendar only', async () => {
    const first = calendar({ id: 'calendar-1' });
    const chosen = calendar({ id: 'calendar-3' });
    mocked.getCalendars.mockResolvedValue([first, chosen]);

    await expect(
      addAppointmentToCalendar('calendar-3', {
        ...time,
        providerName: 'Dr. Lina Haddad',
        visitMode: 'in_person',
      }),
    ).resolves.toEqual({ eventId: 'event-9', status: 'added' });
    expect(chosen.createEvent).toHaveBeenCalledTimes(1);
    expect(first.createEvent).not.toHaveBeenCalled();
  });

  it('moves and removes an existing event without prompting', async () => {
    const event = { delete: jest.fn(), update: jest.fn() };
    mocked.ExpoCalendarEvent.get.mockResolvedValue(event as unknown as Calendar.ExpoCalendarEvent);

    await expect(moveAppointmentCalendarEvent('event-9', time)).resolves.toEqual({
      status: 'done',
    });
    expect(event.update).toHaveBeenCalledWith({
      endDate: new Date(time.endsAt),
      startDate: new Date(time.startsAt),
      timeZone: 'Asia/Dubai',
    });
    await expect(removeAppointmentCalendarEvent('event-9')).resolves.toEqual({ status: 'done' });
    expect(event.delete).toHaveBeenCalledTimes(1);
    expect(mocked.requestCalendarPermissions).not.toHaveBeenCalled();
  });

  it('reports a missing event and withdrawn access', async () => {
    mocked.ExpoCalendarEvent.get.mockRejectedValue(new Error('not found'));
    await expect(moveAppointmentCalendarEvent('gone', time)).resolves.toEqual({
      status: 'missing',
    });

    mocked.getCalendarPermissions.mockResolvedValue(declined);
    await expect(removeAppointmentCalendarEvent('event-9')).resolves.toEqual({
      status: 'denied',
    });
  });
});
