import { router, useLocalSearchParams } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { useBookingDraft } from '@/features/booking/context/booking-draft-provider';
import { bookingAccessRedirect } from '@/features/booking/navigation/booking-return';
import { ProviderDetailScreen } from '@/features/care/screens/provider-detail-screen';
import type { AvailabilitySlot } from '@/features/care/domain/types';
import { useSavedProviders } from '@/features/care/hooks/use-saved-providers';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { firstParam } from '@/navigation/route-params';

export default function ProviderRoute() {
  const params = useLocalSearchParams<{ providerId?: string | string[] }>();
  const providerId = firstParam(params.providerId);
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const bookingDraft = useBookingDraft();
  const savedProviders = useSavedProviders(session.user, {
    careRepository: dataSources.careRepository,
    isDemo: dataSources.isDemo,
  });

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/find-care');
  }

  async function handleChooseSlot(slot: AvailabilitySlot) {
    await bookingDraft.selectSlot(providerId, slot.id);
    const target = { providerId, slotId: slot.id };

    router.push(
      bookingAccessRedirect(session, target) ?? { pathname: '/booking/details', params: target },
    );
  }

  return (
    <ProviderDetailScreen
      onBack={handleBack}
      onChooseSlot={(slot) => void handleChooseSlot(slot)}
      onSignInToSave={() => router.push('/auth/sign-in')}
      onToggleSavedProvider={session.user || dataSources.isDemo ? savedProviders.toggle : undefined}
      providerId={providerId}
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
      savedProviderStatus={savedProviders.status}
      isProviderSaved={savedProviders.isSaved(providerId)}
    />
  );
}
