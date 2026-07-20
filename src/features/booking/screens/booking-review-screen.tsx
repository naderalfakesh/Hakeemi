import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import { useAppTheme, type AppTheme } from '@/theme';

import { BookingScaffold } from '../components/booking-scaffold';
import { BookingSummary } from '../components/booking-summary';
import type { BookingSelection } from '../hooks/use-booking-selection';

export function BookingReviewScreen({
  error,
  isOnline,
  isSubmitting,
  onBack,
  onConfirm,
  reasonCategory,
  selection,
}: {
  error: string | null;
  isOnline: boolean | null;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
  reasonCategory: AppointmentReasonCategory | null;
  selection: BookingSelection;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isOffline = isOnline === false;

  return (
    <BookingScaffold
      onBack={onBack}
      step="STEP 2 OF 2"
      subtitle="Nothing is booked until the secure transaction succeeds."
      title="Review and confirm"
    >
      <BookingSummary reasonCategory={reasonCategory} selection={selection} showReason />

      {isOffline && (
        <Surface padding="compact" style={styles.notice} variant="plain">
          <DecorativeIcon color={theme.colors.warning} name="cloud-offline-outline" size={22} />
          <View style={styles.noticeCopy}>
            <AppText variant="bodyStrong">You are offline</AppText>
            <AppText tone="secondary" variant="caption">
              Your choices are saved. Reconnect before confirming; bookings are never queued.
            </AppText>
          </View>
        </Surface>
      )}

      {error && <InlineError message={error} />}

      <Button busy={isSubmitting} disabled={isOffline} onPress={onConfirm}>
        Confirm appointment
      </Button>
      <AppText style={styles.disclaimer} tone="secondary" variant="caption">
        Portfolio demonstration only. This creates an appointment against fictional provider data.
      </AppText>
    </BookingScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    notice: {
      alignItems: 'flex-start',
      borderColor: theme.colors.warning,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    noticeCopy: {
      flex: 1,
    },
    disclaimer: {
      textAlign: 'center',
    },
  });
}
