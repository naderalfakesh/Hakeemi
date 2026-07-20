import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, DecorativeIcon, EmptyState, IconButton, Skeleton } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import type { BookingSelectionState } from '../hooks/use-booking-selection';

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
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <SafeAreaView accessibilityLabel="Loading booking" edges={['top']} style={styles.safeArea}>
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
        <IconButton accessibilityLabel="Back" onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={
          isError ? (
            <Button onPress={onRetry}>Try again</Button>
          ) : (
            <Button onPress={onBack}>Choose another time</Button>
          )
        }
        description={
          isError
            ? 'The provider and appointment time could not be loaded.'
            : 'This appointment time is no longer available in the current booking window.'
        }
        icon={
          <DecorativeIcon
            color={isError ? theme.colors.danger : theme.colors.brand}
            name={isError ? 'cloud-offline-outline' : 'calendar-outline'}
            size={34}
          />
        }
        title={isError ? 'Booking could not be loaded' : 'Choose another time'}
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
