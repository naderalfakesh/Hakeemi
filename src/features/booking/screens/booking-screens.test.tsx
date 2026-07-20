import { fireEvent, render } from '@testing-library/react-native';

import {
  providerFixtures,
  clinicFixtures,
  buildAvailabilityFixtures,
} from '@/features/care/data/fixtures';
import { TestAppProviders } from '@/test/test-app-providers';
import { triggerHaptic } from '@/services/haptics/haptics';

import type { BookingSelection } from '../hooks/use-booking-selection';
import { BookingConfirmationScreen } from './booking-confirmation-screen';
import { BookingDetailsScreen } from './booking-details-screen';
import { BookingReviewScreen } from './booking-review-screen';

jest.mock('@/services/haptics/haptics', () => ({
  triggerHaptic: jest.fn().mockResolvedValue(undefined),
}));

const mockedTriggerHaptic = jest.mocked(triggerHaptic);

const slot = buildAvailabilityFixtures(new Date('2026-07-20T08:00:00.000Z'))[0];
const selection: BookingSelection = {
  clinic: clinicFixtures.find((clinic) => clinic.id === slot?.clinicId) ?? null,
  provider: providerFixtures[0],
  slot: slot!,
};

describe('guided booking screens', () => {
  it('captures only a broad visit category before review', async () => {
    const onReasonCategoryChange = jest.fn();
    const onContinue = jest.fn();
    const view = await render(
      <TestAppProviders>
        <BookingDetailsScreen
          error={null}
          isSaving={false}
          onBack={jest.fn()}
          onContinue={onContinue}
          onReasonCategoryChange={onReasonCategoryChange}
          reasonCategory={null}
          selection={selection}
        />
      </TestAppProviders>,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Follow-up' }));
    await fireEvent.press(view.getByRole('button', { name: 'Review appointment' }));

    expect(onReasonCategoryChange).toHaveBeenCalledWith('follow_up');
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(view.getByText(/does not collect symptoms/iu)).toBeOnTheScreen();
  });

  it('explains saved choices and disables confirmation while offline', async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <TestAppProviders>
        <BookingReviewScreen
          error={null}
          isOnline={false}
          isSubmitting={false}
          onBack={jest.fn()}
          onConfirm={onConfirm}
          reasonCategory="routine_visit"
          selection={selection}
        />
      </TestAppProviders>,
    );

    expect(view.getByRole('button', { name: 'Confirm appointment' })).toBeDisabled();
    expect(view.getByText(/bookings are never queued/iu)).toBeOnTheScreen();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders a useful confirmation without exposing patient data', async () => {
    mockedTriggerHaptic.mockClear();
    const view = await render(
      <TestAppProviders>
        <BookingConfirmationScreen
          appointment={{
            cancelledAt: null,
            cancelledBy: null,
            clinicId: 'harbour-telehealth',
            createdAt: '2026-07-20T08:00:00.000Z',
            endsAt: selection.slot.endsAt,
            id: 'appointment-safe-reference',
            patientId: 'private-patient-id',
            providerId: selection.provider.id,
            reasonCategory: null,
            slotId: selection.slot.id,
            startsAt: selection.slot.startsAt,
            status: 'confirmed',
            timezone: selection.slot.timezone,
            updatedAt: '2026-07-20T08:00:00.000Z',
            visitMode: selection.slot.visitMode,
          }}
          onFindCare={jest.fn()}
          onViewAppointments={jest.fn()}
          provider={selection.provider}
        />
      </TestAppProviders>,
    );

    expect(view.getByRole('header', { name: 'Appointment confirmed' })).toBeVisible();
    expect(view.getByText('Dr. Lina Haddad')).toBeOnTheScreen();
    expect(view.queryByText('private-patient-id')).not.toBeOnTheScreen();
    expect(mockedTriggerHaptic).toHaveBeenCalledWith('success');
  });
});
