import { router, useLocalSearchParams } from 'expo-router';

import { FindCareScreen } from '@/features/care/screens/find-care-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { firstParam } from '@/navigation/route-params';

export default function FindCareRoute() {
  const params = useLocalSearchParams<{ specialtyId?: string | string[] }>();
  const initialSpecialtyId = firstParam(params.specialtyId) || undefined;
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
