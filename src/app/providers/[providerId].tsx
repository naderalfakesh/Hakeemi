import { router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { ProviderDetailScreen } from '@/features/care/screens/provider-detail-screen';
import type { AvailabilitySlot } from '@/features/care/domain/types';
import { useSavedProviders } from '@/features/care/hooks/use-saved-providers';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function ProviderRoute() {
  const { providerId: rawProviderId } = useLocalSearchParams<{
    providerId?: string | string[];
  }>();
  const providerId = Array.isArray(rawProviderId)
    ? (rawProviderId[0] ?? '')
    : (rawProviderId ?? '');
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const bookingDraft = useBookingDraft();
  const savedProviders = useSavedProviders(session.user);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/find-care');
  }

  async function handleChooseSlot(slot: AvailabilitySlot) {
    await bookingDraft.selectSlot(providerId, slot.id);
    const bookingParams = { bookingProviderId: providerId, bookingSlotId: slot.id };

    if (session.status !== 'authenticated' && session.status !== 'demo') {
      router.push({ pathname: '/auth/sign-in', params: bookingParams });
      return;
    }

    if (session.status === 'authenticated' && !session.user?.emailVerified) {
      router.push({ pathname: '/auth/verify-email', params: bookingParams });
      return;
    }

    router.push({ pathname: '/booking/details', params: { providerId, slotId: slot.id } });
  }

  return (
    <ProviderDetailScreen
      onBack={handleBack}
      onChooseSlot={(slot) => void handleChooseSlot(slot)}
      onSignInToSave={() => router.push('/auth/sign-in')}
      onToggleSavedProvider={session.user ? savedProviders.toggle : undefined}
      providerId={providerId}
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
      savedProviderStatus={savedProviders.status}
      isProviderSaved={savedProviders.isSaved(providerId)}
    />
  );
}
