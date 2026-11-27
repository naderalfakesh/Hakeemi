import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { appointmentsStrings } from '../localization/appointments-strings';
import { AppointmentsHeader } from './appointments-header';

type AppointmentsLoadingProps = {
  onFindCare: () => void;
};

export function AppointmentsLoading({ onFindCare }: AppointmentsLoadingProps) {
  const strings = useStrings(appointmentsStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView
      accessibilityLabel={strings.loadingAppointments}
      edges={['top']}
      style={styles.safeArea}
    >
      <View style={styles.content}>
        <AppointmentsHeader hasAppointments={false} onFindCare={onFindCare} />
        <View style={styles.filterRow}>
          <Skeleton height={44} radius="sm" width={112} />
          <Skeleton height={44} radius="sm" width={92} />
        </View>
        <Skeleton height={150} radius="lg" width="100%" />
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      width: '100%',
    },
    filterRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xxs,
    },
  });
}
