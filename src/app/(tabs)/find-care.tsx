import { router, useLocalSearchParams } from 'expo-router';

import { FindCareScreen } from '@/features/care/screens/find-care-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function FindCareRoute() {
  const { specialtyId: rawSpecialtyId } = useLocalSearchParams<{
    specialtyId?: string | string[];
  }>();
  const initialSpecialtyId = Array.isArray(rawSpecialtyId) ? rawSpecialtyId[0] : rawSpecialtyId;
  const dataSources = useAppDataSources();

  return (
    <FindCareScreen
      initialSpecialtyId={initialSpecialtyId}
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
    />
  );
}
