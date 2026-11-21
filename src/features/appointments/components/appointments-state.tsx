import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DecorativeIcon, EmptyState } from '@/components/ui';
import { useAppTheme } from '@/theme';

type AppointmentsStateProps = {
  action: ReactNode;
  description: string;
  title: string;
};

export function AppointmentsState({ action, description, title }: AppointmentsStateProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.canvas, flex: 1 }}>
      <EmptyState
        action={action}
        description={description}
        icon={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={34} />}
        title={title}
      />
    </SafeAreaView>
  );
}
