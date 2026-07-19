import { router } from 'expo-router';

import { HomeScreen } from '@/features/home/screens/home-screen';

export default function HomeRoute() {
  return (
    <HomeScreen
      onFindCare={() => router.push('/find-care')}
      {...(__DEV__ ? { onOpenCatalogue: () => router.push('/dev/components') } : {})}
    />
  );
}
