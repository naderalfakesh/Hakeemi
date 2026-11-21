import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  IconButton,
  DecorativeIcon,
  Skeleton,
  stateIllustrations,
} from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { appointmentDetailStrings } from '../localization/appointment-detail-strings';

type AppointmentDetailStateProps = {
  action: ReactNode;
  description: string;
  onBack: () => void;
  title: string;
};

export function AppointmentDetailLoading() {
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView
      accessibilityLabel={strings.loadingAppointment}
      edges={['top']}
      style={styles.safeArea}
    >
      <View style={styles.loadingContent}>
        <Skeleton height={48} radius="md" width={48} />
        <Skeleton height={36} width="68%" />
        <Skeleton height={154} radius="lg" width="100%" />
        <Skeleton height={52} radius="md" width="100%" />
      </View>
    </SafeAreaView>
  );
}

export function AppointmentDetailState({
  action,
  description,
  onBack,
  title,
}: AppointmentDetailStateProps) {
  const theme = useAppTheme();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.stateBack}>
        <IconButton accessibilityLabel={strings.backToAppointments} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={action}
        description={description}
        illustration={stateIllustrations.noAppointments}
        title={title}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: { backgroundColor: theme.colors.canvas, flex: 1 },
    stateBack: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
    loadingContent: {
      alignSelf: 'center',
      gap: theme.spacing.lg,
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
  });
}
