import type { CareRepository } from '@/features/care/domain/repository';
import type { AvailabilitySlot, Clinic, Provider } from '@/features/care/domain/types';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';

export type BookingSelection = {
  clinic: Clinic | null;
  provider: Provider;
  slot: AvailabilitySlot;
};

export type BookingSelectionState =
  | { status: 'error' | 'loading' | 'not-found' | 'unavailable' }
  | { data: BookingSelection; status: 'success' };

export function useBookingSelection(
  providerId: string,
  slotId: string,
  repository?: CareRepository,
) {
  const providerDetail = useProviderDetail(providerId, repository);
  let state: BookingSelectionState;

  if (providerDetail.state.status !== 'success') {
    state = { status: providerDetail.state.status };
  } else {
    const slot = providerDetail.state.data.slots.find((candidate) => candidate.id === slotId);

    if (!slot) {
      state = { status: 'unavailable' };
    } else {
      state = {
        status: 'success',
        data: {
          clinic:
            providerDetail.state.data.clinics.find((candidate) => candidate.id === slot.clinicId) ??
            null,
          provider: providerDetail.state.data.provider,
          slot,
        },
      };
    }
  }

  return { retry: providerDetail.retry, state };
}
