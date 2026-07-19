import { router, useLocalSearchParams } from 'expo-router';

import { ProviderDetailScreen } from '@/features/care/screens/provider-detail-screen';

export default function ProviderRoute() {
  const { providerId: rawProviderId } = useLocalSearchParams<{
    providerId?: string | string[];
  }>();
  const providerId = Array.isArray(rawProviderId)
    ? (rawProviderId[0] ?? '')
    : (rawProviderId ?? '');

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/find-care');
  }

  return <ProviderDetailScreen onBack={handleBack} providerId={providerId} />;
}
