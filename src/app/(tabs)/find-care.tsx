import { router } from 'expo-router';

import { FindCareScreen } from '@/features/care/screens/find-care-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function FindCareRoute() {
  const dataSources = useAppDataSources();

  return (
    <FindCareScreen
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
    />
  );
}
