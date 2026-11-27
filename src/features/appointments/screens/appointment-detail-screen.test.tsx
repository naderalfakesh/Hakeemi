import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { fixtureCareRepository } from '@/features/care/data/fixture-care-repository';
import { AppLocaleProvider } from '@/localization/locale-provider';
import {
  addAppointmentToCalendar,
  listWritableCalendars,
  moveAppointmentCalendarEvent,
  removeAppointmentCalendarEvent,
} from '@/services/calendar/calendar';
import { triggerHaptic } from '@/services/haptics/haptics';
import { TestAppProviders } from '@/test/test-app-providers';

import { calendarLinkStorage } from '../data/calendar-link-storage';
import { AppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, AppointmentActionResult } from '../domain/types';
import { AppointmentDetailScreen } from './appointment-detail-screen';

jest.mock('@/features/auth/context/auth-session-provider', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@/services/connectivity/connectivity', () => ({
  connectionCheckFor: () => async () => true,
}));

jest.mock('@/services/calendar/calendar', () => ({
  addAppointmentToCalendar: jest.fn().mockResolvedValue({ eventId: 'event-1', status: 'added' }),
  listWritableCalendars: jest.fn(),
  moveAppointmentCalendarEvent: jest.fn(),
  removeAppointmentCalendarEvent: jest.fn(),
}));

jest.mock('@/services/haptics/haptics', () => ({
  triggerHaptic: jest.fn().mockResolvedValue(undefined),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);
const mockedAddAppointmentToCalendar = jest.mocked(addAppointmentToCalendar);
const mockedListWritableCalendars = jest.mocked(listWritableCalendars);
const mockedMoveEvent = jest.mocked(moveAppointmentCalendarEvent);
const mockedRemoveEvent = jest.mocked(removeAppointmentCalendarEvent);
const personalCalendar = { accountName: null, id: 'calendar-1', title: 'owner@example.test' };
const workCalendar = { accountName: 'work@example.test', id: 'calendar-7', title: 'Clinic visits' };
const mockedTriggerHaptic = jest.mocked(triggerHaptic);

const appointment: Appointment = {
  cancelledAt: null,
  cancelledBy: null,
  clinicId: 'marsa-family-clinic',
  createdAt: '2030-01-01T07:00:00.000Z',
  endsAt: '2030-01-15T08:30:00.000Z',
  id: 'appointment-1',
  patientId: 'patient-1',
  providerId: 'lina-haddad',
  reasonCategory: 'routine_visit',
  slotId: 'slot-1',
  startsAt: '2030-01-15T08:00:00.000Z',
  status: 'confirmed',
  timezone: 'Asia/Dubai',
  updatedAt: '2030-01-01T07:00:00.000Z',
  visitMode: 'in_person',
};

const actionResult: AppointmentActionResult = {
  appointment: {
    cancelledAt: null,
    cancelledBy: null,
    clinicId: appointment.clinicId,
    endsAt: appointment.endsAt,
    id: appointment.id,
    providerId: appointment.providerId,
    reasonCategory: appointment.reasonCategory,
    slotId: appointment.slotId,
    startsAt: appointment.startsAt,
    status: appointment.status,
    timezone: appointment.timezone,
    visitMode: appointment.visitMode,
  },
  isReplay: false,
};

function repository(overrides: Partial<AppointmentRepository> = {}): AppointmentRepository {
  return {
    book: jest.fn().mockRejectedValue(new Error('not used')),
    cancel: jest.fn().mockResolvedValue(actionResult),
    getAppointment: jest.fn().mockResolvedValue(appointment),
    listAppointments: jest.fn().mockResolvedValue([appointment]),
    reschedule: jest.fn().mockResolvedValue(actionResult),
    ...overrides,
  };
}

describe('AppointmentDetailScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedMoveEvent.mockResolvedValue({ status: 'done' });
    mockedRemoveEvent.mockResolvedValue({ status: 'done' });
    mockedAddAppointmentToCalendar.mockResolvedValue({ eventId: 'event-1', status: 'added' });
    mockedListWritableCalendars.mockResolvedValue({
      calendars: [personalCalendar],
      status: 'ready',
    });
    mockedTriggerHaptic.mockResolvedValue(undefined);
    mockedUseAuthSession.mockReturnValue({
      enterDemo: jest.fn(),
      profile: null,
      profileError: null,
      profileStatus: 'idle',
      refreshSession: jest.fn().mockResolvedValue(undefined),
      retryProfile: jest.fn().mockResolvedValue(undefined),
      signOut: jest.fn().mockResolvedValue(undefined),
      status: 'authenticated',
      user: {
        displayName: 'Demo Patient',
        email: 'demo@example.test',
        emailVerified: true,
        id: 'patient-1',
      },
    });
  });

  it('adds to the only writable calendar and names it', async () => {
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));

    await waitFor(() =>
      expect(mockedAddAppointmentToCalendar).toHaveBeenCalledWith('calendar-1', {
        endsAt: appointment.endsAt,
        providerName: 'Dr. Lina Haddad',
        startsAt: appointment.startsAt,
        timezone: appointment.timezone,
        visitMode: appointment.visitMode,
      }),
    );
    await waitFor(() => expect(view.getByText('Added to calendar')).toBeVisible());
    expect(view.getByText('Saved in owner@example.test.')).toBeVisible();
  });

  it('lets the user choose between several calendars', async () => {
    mockedListWritableCalendars.mockResolvedValue({
      calendars: [personalCalendar, workCalendar],
      status: 'ready',
    });
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to calendar' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));

    await waitFor(() => expect(view.getByText('Choose a calendar')).toBeVisible());
    expect(mockedAddAppointmentToCalendar).not.toHaveBeenCalled();
    await fireEvent.press(view.getByRole('button', { name: 'Clinic visits · work@example.test' }));

    await waitFor(() =>
      expect(mockedAddAppointmentToCalendar).toHaveBeenCalledWith(
        'calendar-7',
        expect.objectContaining({ startsAt: appointment.startsAt }),
      ),
    );
    await waitFor(() =>
      expect(view.getByText('Saved in Clinic visits · work@example.test.')).toBeVisible(),
    );
    expect(view.queryByText('Choose a calendar')).not.toBeOnTheScreen();
  });

  it('adds once when a calendar row is pressed twice', async () => {
    let finishAdd: (value: { eventId: string; status: 'added' }) => void = () => undefined;
    mockedAddAppointmentToCalendar.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishAdd = resolve;
        }),
    );
    mockedListWritableCalendars.mockResolvedValue({
      calendars: [personalCalendar, workCalendar],
      status: 'ready',
    });
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to calendar' })).toBeEnabled(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));
    await waitFor(() => expect(view.getByText('Choose a calendar')).toBeVisible());

    const row = view.getByRole('button', { name: 'Clinic visits · work@example.test' });
    await fireEvent.press(row);
    await fireEvent.press(row);
    await act(async () => finishAdd({ eventId: 'event-1', status: 'added' }));

    await waitFor(() =>
      expect(view.getByText('Saved in Clinic visits · work@example.test.')).toBeVisible(),
    );
    expect(mockedAddAppointmentToCalendar).toHaveBeenCalledTimes(1);
  });

  it('says when the added event cannot be remembered', async () => {
    const setItem = jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error('disk full'))
      .mockRejectedValueOnce(new Error('disk full'));
    const callsBefore = setItem.mock.calls.length;
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to calendar' })).toBeEnabled(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));

    await waitFor(() =>
      expect(
        view.getByText(
          'Saved in owner@example.test. Hakeemi could not remember this event, so if you reschedule or cancel, update it in your calendar app.',
        ),
      ).toBeVisible(),
    );
    expect(setItem.mock.calls.length - callsBefore).toBe(2);
  });

  it('closes the calendar chooser without adding anything', async () => {
    mockedListWritableCalendars.mockResolvedValue({
      calendars: [personalCalendar, workCalendar],
      status: 'ready',
    });
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to calendar' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));
    await waitFor(() => expect(view.getByText('Choose a calendar')).toBeVisible());
    await fireEvent.press(view.getByRole('button', { name: 'Not now' }));

    expect(view.getByRole('button', { name: 'Add to calendar' })).toBeEnabled();
    expect(mockedAddAppointmentToCalendar).not.toHaveBeenCalled();
  });

  it('keeps appointment management available when calendar access is denied', async () => {
    mockedListWritableCalendars.mockResolvedValue({ status: 'denied' });
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository()}
          careDataRepository={fixtureCareRepository}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to calendar' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));

    await waitFor(() =>
      expect(
        view.getByText('Calendar access was declined. You can still manage this appointment here.'),
      ).toBeVisible(),
    );
    expect(view.getByRole('button', { name: 'Cancel appointment' })).toBeVisible();
  });

  it('shows appointment actions and sends cancellation through the repository', async () => {
    const cancel = jest.fn().mockResolvedValue(actionResult);
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository({ cancel })}
          careDataRepository={fixtureCareRepository}
          createRequestId={() => 'request-1'}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Cancel appointment' }));
    await waitFor(() => expect(view.getByText('Cancel this appointment?')).toBeVisible());

    await fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() =>
      expect(cancel).toHaveBeenCalledWith({
        appointmentId: appointment.id,
        requestId: 'request-1',
      }),
    );
    expect(mockedTriggerHaptic).toHaveBeenCalledWith('warning');
  });

  it('keeps the request ID when a failed cancellation is retried', async () => {
    const cancel = jest
      .fn()
      .mockRejectedValueOnce(new AppointmentActionError('network', 'offline'))
      .mockResolvedValue(actionResult);
    let nextRequest = 0;
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository({ cancel })}
          careDataRepository={fixtureCareRepository}
          createRequestId={() => `request-${(nextRequest += 1)}`}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() =>
      expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Cancel appointment' }));
    await fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(view.getByRole('button', { name: 'Confirm cancellation' })).toBeVisible();

    await fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(2));
    expect(cancel.mock.calls.map(([input]) => input.requestId)).toEqual(['request-1', 'request-1']);
  });

  it('reveals available provider slots for rescheduling', async () => {
    const reschedule = jest.fn().mockResolvedValue(actionResult);
    const view = await render(
      <TestAppProviders>
        <AppointmentDetailScreen
          appointmentId={appointment.id}
          appointmentRepository={repository({ reschedule })}
          careDataRepository={fixtureCareRepository}
          createRequestId={() => 'request-2'}
          onBack={jest.fn()}
          onFindCare={jest.fn()}
        />
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByRole('button', { name: 'Reschedule' })).toBeVisible());
    await fireEvent.press(view.getByRole('button', { name: 'Reschedule' }));
    await waitFor(() => expect(view.getByText('Choose a new time')).toBeVisible());

    await fireEvent.press(view.getByRole('button', { name: /Continue with/u }));
    await waitFor(() => expect(reschedule).toHaveBeenCalled());
    expect(reschedule.mock.calls[0]?.[0]).toMatchObject({
      appointmentId: appointment.id,
      requestId: 'request-2',
    });
  });

  it('renders localized appointment details in Arabic', async () => {
    const view = await render(
      <TestAppProviders>
        <AppLocaleProvider locale="ar">
          <AppointmentDetailScreen
            appointmentId={appointment.id}
            appointmentRepository={repository()}
            careDataRepository={fixtureCareRepository}
            onBack={jest.fn()}
            onFindCare={jest.fn()}
          />
        </AppLocaleProvider>
      </TestAppProviders>,
    );

    await waitFor(() => expect(view.getByRole('header', { name: 'د. لينا حداد' })).toBeVisible());
    expect(view.getByText('تفاصيل الموعد')).toBeVisible();
    expect(view.getByText('مؤكد')).toBeVisible();
    expect(view.getByRole('button', { name: 'إضافة إلى التقويم' })).toBeVisible();
    expect(view.getByRole('button', { name: 'إلغاء الموعد' })).toBeVisible();
    expect(view.getByRole('button', { name: 'ابحث عن طبيب آخر' })).toBeVisible();
    expect(view.getByText('زيارة حضورية · توقيت الخليج')).toBeVisible();
    expect(view.queryByText(/Asia\/Dubai/u)).not.toBeOnTheScreen();
  });

  describe('calendar event follows the appointment', () => {
    const rescheduled: Appointment = {
      ...appointment,
      endsAt: '2030-01-17T09:30:00.000Z',
      slotId: 'slot-2',
      startsAt: '2030-01-17T09:00:00.000Z',
    };
    const rescheduledResult: AppointmentActionResult = {
      appointment: {
        ...actionResult.appointment,
        endsAt: rescheduled.endsAt,
        slotId: rescheduled.slotId,
        startsAt: rescheduled.startsAt,
      },
      isReplay: false,
    };
    const cancelled: Appointment = {
      ...appointment,
      cancelledAt: '2030-01-02T07:00:00.000Z',
      cancelledBy: 'patient',
      status: 'cancelled',
    };

    async function renderDetail(appointmentRepository: AppointmentRepository) {
      const view = await render(
        <TestAppProviders>
          <AppointmentDetailScreen
            appointmentId={appointment.id}
            appointmentRepository={appointmentRepository}
            careDataRepository={fixtureCareRepository}
            createRequestId={() => 'request-3'}
            onBack={jest.fn()}
            onFindCare={jest.fn()}
          />
        </TestAppProviders>,
      );
      await waitFor(() =>
        expect(view.getByRole('header', { name: 'Dr. Lina Haddad' })).toBeVisible(),
      );
      return view;
    }

    async function addToOnlyCalendar(view: Awaited<ReturnType<typeof renderDetail>>) {
      await waitFor(() =>
        expect(view.getByRole('button', { name: 'Add to calendar' })).toBeEnabled(),
      );
      await fireEvent.press(view.getByRole('button', { name: 'Add to calendar' }));
      await waitFor(() => expect(view.getByText('Saved in owner@example.test.')).toBeVisible());
    }

    async function rescheduleToNextTime(view: Awaited<ReturnType<typeof renderDetail>>) {
      await fireEvent.press(view.getByRole('button', { name: 'Reschedule' }));
      await waitFor(() => expect(view.getByText('Choose a new time')).toBeVisible());
      await fireEvent.press(view.getByRole('button', { name: /Continue with/u }));
    }

    it('remembers the added event when the screen opens again', async () => {
      const first = await renderDetail(repository());
      await addToOnlyCalendar(first);
      await first.unmount();

      const second = await renderDetail(repository());

      await waitFor(() => expect(second.getByText('Saved in owner@example.test.')).toBeVisible());
      expect(second.getByRole('button', { name: 'Added to calendar' })).toBeDisabled();
      expect(mockedAddAppointmentToCalendar).toHaveBeenCalledTimes(1);
    });

    it('moves the event to the new time after a reschedule', async () => {
      const getAppointment = jest.fn().mockResolvedValue(appointment);
      const reschedule = jest.fn().mockImplementation(async () => {
        getAppointment.mockResolvedValue(rescheduled);
        return rescheduledResult;
      });
      const view = await renderDetail(repository({ getAppointment, reschedule }));
      await addToOnlyCalendar(view);

      await rescheduleToNextTime(view);

      await waitFor(() =>
        expect(mockedMoveEvent).toHaveBeenCalledWith(
          { calendarId: 'calendar-1', eventId: 'event-1' },
          {
            endsAt: rescheduled.endsAt,
            startsAt: rescheduled.startsAt,
            timezone: rescheduled.timezone,
          },
        ),
      );
      await waitFor(() =>
        expect(view.getByText('Moved to the new time in owner@example.test.')).toBeVisible(),
      );
      expect(view.getByRole('button', { name: 'Added to calendar' })).toBeDisabled();
    });

    it('stops claiming the visit is in the calendar when the event cannot move', async () => {
      mockedMoveEvent.mockResolvedValue({ status: 'missing' });
      const getAppointment = jest.fn().mockResolvedValue(appointment);
      const reschedule = jest.fn().mockImplementation(async () => {
        getAppointment.mockResolvedValue(rescheduled);
        return rescheduledResult;
      });
      const view = await renderDetail(repository({ getAppointment, reschedule }));
      await addToOnlyCalendar(view);

      await rescheduleToNextTime(view);

      await waitFor(() =>
        expect(view.getByRole('button', { name: 'Add the new time to calendar' })).toBeEnabled(),
      );
      expect(view.queryByText('Added to calendar')).not.toBeOnTheScreen();

      mockedAddAppointmentToCalendar.mockResolvedValue({ eventId: 'event-2', status: 'added' });
      await fireEvent.press(view.getByRole('button', { name: 'Add the new time to calendar' }));
      await waitFor(() =>
        expect(mockedAddAppointmentToCalendar).toHaveBeenLastCalledWith(
          'calendar-1',
          expect.objectContaining({ startsAt: rescheduled.startsAt }),
        ),
      );
      await waitFor(() => expect(view.getByText('Added to calendar')).toBeVisible());
    });

    it.each([
      ['access was withdrawn', () => mockedMoveEvent.mockResolvedValue({ status: 'denied' })],
      ['the update failed', () => mockedMoveEvent.mockRejectedValue(new Error('update failed'))],
    ])('keeps the event link when %s during a move', async (_case, arrange) => {
      arrange();
      const getAppointment = jest.fn().mockResolvedValue(appointment);
      const reschedule = jest.fn().mockImplementation(async () => {
        getAppointment.mockResolvedValue(rescheduled);
        return rescheduledResult;
      });
      const view = await renderDetail(repository({ getAppointment, reschedule }));
      await addToOnlyCalendar(view);

      await rescheduleToNextTime(view);

      await waitFor(() =>
        expect(
          view.getByRole('button', { name: 'Move the calendar event to this time' }),
        ).toBeVisible(),
      );
      expect(
        view.queryByRole('button', { name: 'Add the new time to calendar' }),
      ).not.toBeOnTheScreen();
      expect(await calendarLinkStorage.read('account:patient-1', appointment.id)).toMatchObject({
        eventId: 'event-1',
        startsAt: appointment.startsAt,
      });

      mockedMoveEvent.mockResolvedValue({ status: 'done' });
      await fireEvent.press(
        view.getByRole('button', { name: 'Move the calendar event to this time' }),
      );
      await waitFor(() =>
        expect(view.getByText('Moved to the new time in owner@example.test.')).toBeVisible(),
      );
      expect(mockedAddAppointmentToCalendar).toHaveBeenCalledTimes(1);
    });

    it('removes the event when the appointment is cancelled', async () => {
      const getAppointment = jest.fn().mockResolvedValue(appointment);
      const cancel = jest.fn().mockImplementation(async () => {
        getAppointment.mockResolvedValue(cancelled);
        return actionResult;
      });
      const view = await renderDetail(repository({ cancel, getAppointment }));
      await addToOnlyCalendar(view);

      await fireEvent.press(view.getByRole('button', { name: 'Cancel appointment' }));
      await fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));

      await waitFor(() =>
        expect(mockedRemoveEvent).toHaveBeenCalledWith({
          calendarId: 'calendar-1',
          eventId: 'event-1',
        }),
      );
      await waitFor(() => expect(view.getByText('Removed from owner@example.test.')).toBeVisible());
      expect(await AsyncStorage.getAllKeys()).toEqual([]);
    });

    it('says the event stayed when access was withdrawn before cancelling', async () => {
      mockedRemoveEvent.mockResolvedValue({ status: 'denied' });
      const getAppointment = jest.fn().mockResolvedValue(appointment);
      const cancel = jest.fn().mockImplementation(async () => {
        getAppointment.mockResolvedValue(cancelled);
        return actionResult;
      });
      const view = await renderDetail(repository({ cancel, getAppointment }));
      await addToOnlyCalendar(view);

      await fireEvent.press(view.getByRole('button', { name: 'Cancel appointment' }));
      await fireEvent.press(view.getByRole('button', { name: 'Confirm cancellation' }));

      await waitFor(() =>
        expect(
          view.getByText(
            'This visit is still in owner@example.test. Remove it in your calendar app.',
          ),
        ).toBeVisible(),
      );
    });

    it('does not move the event when the visit time changed without the user', async () => {
      await calendarLinkStorage.write('account:patient-1', appointment.id, {
        calendar: personalCalendar,
        eventId: 'event-1',
        startsAt: '2030-01-14T08:00:00.000Z',
      });
      const view = await renderDetail(repository());

      await waitFor(() =>
        expect(
          view.getByRole('button', { name: 'Move the calendar event to this time' }),
        ).toBeVisible(),
      );
      expect(
        view.getByText('The event in owner@example.test still has an earlier time for this visit.'),
      ).toBeVisible();
      expect(mockedMoveEvent).not.toHaveBeenCalled();
      expect(view.queryByText('Added to calendar')).not.toBeOnTheScreen();

      await fireEvent.press(
        view.getByRole('button', { name: 'Move the calendar event to this time' }),
      );

      await waitFor(() =>
        expect(mockedMoveEvent).toHaveBeenCalledWith(
          { calendarId: 'calendar-1', eventId: 'event-1' },
          { endsAt: appointment.endsAt, startsAt: appointment.startsAt, timezone: 'Asia/Dubai' },
        ),
      );
      await waitFor(() =>
        expect(view.getByText('Moved to the new time in owner@example.test.')).toBeVisible(),
      );
    });

    it('does not remove the event of a visit cancelled elsewhere without a tap', async () => {
      await calendarLinkStorage.write('account:patient-1', appointment.id, {
        calendar: personalCalendar,
        eventId: 'event-1',
        startsAt: appointment.startsAt,
      });
      const view = await renderDetail(
        repository({ getAppointment: jest.fn().mockResolvedValue(cancelled) }),
      );

      await waitFor(() =>
        expect(view.getByRole('button', { name: 'Remove from calendar' })).toBeVisible(),
      );
      expect(mockedRemoveEvent).not.toHaveBeenCalled();
    });

    it('ignores links stored for another account', async () => {
      await calendarLinkStorage.write('account:someone-else', appointment.id, {
        calendar: personalCalendar,
        eventId: 'event-1',
        startsAt: appointment.startsAt,
      });
      const view = await renderDetail(repository());

      await waitFor(() =>
        expect(view.getByRole('button', { name: 'Add to calendar' })).toBeEnabled(),
      );
    });
  });
});
