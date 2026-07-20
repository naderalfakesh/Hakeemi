import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { BookingScaffold } from '../components/booking-scaffold';
import { BookingSummary } from '../components/booking-summary';
import type { BookingSelection } from '../hooks/use-booking-selection';
import { bookingStrings } from '../localization/booking-strings';

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
  const strings = useStrings(bookingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isOffline = isOnline === false;

  return (
    <BookingScaffold
      onBack={onBack}
      step={strings.stepOf(2, 2)}
      subtitle={strings.review.subtitle}
      title={strings.review.title}
    >
      <BookingSummary reasonCategory={reasonCategory} selection={selection} showReason />

      {isOffline && (
        <Surface padding="compact" style={styles.notice} variant="plain">
          <DecorativeIcon color={theme.colors.warning} name="cloud-offline-outline" size={22} />
          <View style={styles.noticeCopy}>
            <AppText variant="bodyStrong">{strings.review.offlineTitle}</AppText>
            <AppText tone="secondary" variant="caption">
              {strings.review.offlineBody}
            </AppText>
          </View>
        </Surface>
      )}

      {error && <InlineError message={error} />}

      <Button busy={isSubmitting} disabled={isOffline} onPress={onConfirm}>
        {strings.review.confirmAppointment}
      </Button>
      <AppText style={styles.disclaimer} tone="secondary" variant="caption">
        {strings.review.disclaimer}
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
