import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  DecorativeIcon,
  EmptyState,
  IconButton,
  Skeleton,
  stateIllustrations,
} from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import type { BookingSelectionState } from '../hooks/use-booking-selection';
import { bookingStrings } from '../localization/booking-strings';

export function BookingRouteState({
  onBack,
  onRetry,
  status,
}: {
  onBack: () => void;
  onRetry: () => void;
  status: Exclude<BookingSelectionState['status'], 'success'>;
}) {
  const theme = useAppTheme();
  const strings = useStrings(bookingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <SafeAreaView
        accessibilityLabel={strings.routeState.loadingLabel}
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.loading}>
          <Skeleton height={48} radius="md" width={48} />
          <Skeleton height={34} width="70%" />
          <Skeleton height={190} radius="lg" width="100%" />
        </View>
      </SafeAreaView>
    );
  }

  const isError = status === 'error';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.back}>
        <IconButton accessibilityLabel={strings.backLabel} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={
          isError ? (
            <Button onPress={onRetry}>{strings.routeState.tryAgain}</Button>
          ) : (
            <Button onPress={onBack}>{strings.routeState.chooseAnotherTime}</Button>
          )
        }
        description={
          isError ? strings.routeState.errorDescription : strings.routeState.notFoundDescription
        }
        illustration={isError ? stateIllustrations.offline : stateIllustrations.noAppointments}
        title={isError ? strings.routeState.errorTitle : strings.routeState.chooseAnotherTime}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    loading: {
      alignSelf: 'center',
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    back: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
  });
}
