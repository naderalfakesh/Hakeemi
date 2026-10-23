import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';

import { calendarLinkStorage } from '@/features/appointments/data/calendar-link-storage';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { createAppQueryClient } from '@/services/query/query-client';

import { AccountDataReset } from './account-data-reset';
import { useAuthSession } from './auth-session-provider';

jest.mock('./auth-session-provider', () => ({ useAuthSession: jest.fn() }));
jest.mock('@/features/booking/context/booking-draft-provider', () => ({
  useBookingDraft: jest.fn(),
}));

const mockedUseAuthSession = jest.mocked(useAuthSession);
const mockedUseBookingDraft = jest.mocked(useBookingDraft);
const link = {
  calendar: { accountName: null, id: 'calendar-1', title: 'owner@example.test' },
  eventId: 'event-1',
  startsAt: '2030-10-24T12:00:00.000Z',
};

function session(status: 'anonymous' | 'authenticated' | 'demo', id: string | null = null) {
  return {
    status,
    user: id
      ? { displayName: 'Patient', email: `${id}@example.test`, emailVerified: true, id }
      : null,
  } as ReturnType<typeof useAuthSession>;
}

describe('AccountDataReset calendar links', () => {
  const queryClient = createAppQueryClient({ gcTime: Infinity, retry: false });
  const tree = () => (
    <QueryClientProvider client={queryClient}>
      <AccountDataReset />
    </QueryClientProvider>
  );

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockedUseBookingDraft.mockReturnValue({
      clear: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useBookingDraft>);
    await calendarLinkStorage.write('account:patient-a', 'appointment-1', link);
    await calendarLinkStorage.write('account:patient-b', 'appointment-2', link);
    await calendarLinkStorage.write('demo', 'demo-upcoming-omar', link);
  });

  it('forgets the signed-out account links only', async () => {
    mockedUseAuthSession.mockReturnValue(session('authenticated', 'patient-a'));
    const view = await render(tree());

    mockedUseAuthSession.mockReturnValue(session('anonymous'));
    await view.rerender(tree());

    await waitFor(async () =>
      expect(await calendarLinkStorage.read('account:patient-a', 'appointment-1')).toBeNull(),
    );
    expect(await calendarLinkStorage.read('account:patient-b', 'appointment-2')).toEqual(link);
    expect(await calendarLinkStorage.read('demo', 'demo-upcoming-omar')).toEqual(link);
  });

  it('forgets demo links when the demo ends', async () => {
    mockedUseAuthSession.mockReturnValue(session('demo'));
    const view = await render(tree());

    mockedUseAuthSession.mockReturnValue(session('anonymous'));
    await view.rerender(tree());

    await waitFor(async () =>
      expect(await calendarLinkStorage.read('demo', 'demo-upcoming-omar')).toBeNull(),
    );
    expect(await calendarLinkStorage.read('account:patient-a', 'appointment-1')).toEqual(link);
  });
});
