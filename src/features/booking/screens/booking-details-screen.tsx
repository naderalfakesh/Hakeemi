import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, InlineError, Surface } from '@/components/ui';
import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import { useAppTheme, type AppTheme } from '@/theme';

import { BookingScaffold } from '../components/booking-scaffold';
import { BookingSummary } from '../components/booking-summary';
import type { BookingSelection } from '../hooks/use-booking-selection';
import { reasonCategoryOptions } from '../presentation/formatters';

export function BookingDetailsScreen({
  error,
  isSaving,
  onBack,
  onContinue,
  onReasonCategoryChange,
  reasonCategory,
  selection,
}: {
  error: string | null;
  isSaving: boolean;
  onBack: () => void;
  onContinue: () => void;
  onReasonCategoryChange: (reason: AppointmentReasonCategory | null) => void;
  reasonCategory: AppointmentReasonCategory | null;
  selection: BookingSelection;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BookingScaffold
      onBack={onBack}
      step="STEP 1 OF 2"
      subtitle="Your selected appointment is held only when you confirm on the next screen."
      title="Visit details"
    >
      <BookingSummary reasonCategory={reasonCategory} selection={selection} />

      <Surface padding="spacious" style={styles.reasonCard} variant="plain">
        <View style={styles.reasonHeading}>
          <AppText variant="titleSmall">What is this visit for?</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            Choose a broad category only. Hakeemi does not collect symptoms or medical notes.
          </AppText>
        </View>
        <View style={styles.chips}>
          {reasonCategoryOptions.map((option) => (
            <Chip
              key={option.value ?? 'none'}
              label={option.label}
              onPress={() => onReasonCategoryChange(option.value)}
              selected={reasonCategory === option.value}
            />
          ))}
        </View>
      </Surface>

      {error && <InlineError message={error} />}
      <Button busy={isSaving} onPress={onContinue}>
        Review appointment
      </Button>
    </BookingScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    reasonCard: {
      gap: theme.spacing.md,
    },
    reasonHeading: {
      gap: theme.spacing.xs,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
  });
}
