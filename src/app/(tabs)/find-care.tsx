import { router } from 'expo-router';

import { FindCareScreen } from '@/features/care/screens/find-care-screen';

export default function FindCareRoute() {
  return (
    <FindCareScreen
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
    />
  );
}
