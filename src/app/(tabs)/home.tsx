import { router } from 'expo-router';

import { HomeScreen } from '@/features/home/screens/home-screen';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';

export default function HomeRoute() {
  const dataSources = useAppDataSources();

  return (
    <HomeScreen
      onFindCare={() => router.push('/find-care')}
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
      {...(__DEV__ ? { onOpenCatalogue: () => router.push('/dev/components') } : {})}
    />
  );
}
