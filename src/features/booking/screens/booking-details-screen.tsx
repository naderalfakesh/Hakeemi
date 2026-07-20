import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, InlineError, Surface } from '@/components/ui';
import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { BookingScaffold } from '../components/booking-scaffold';
import { BookingSummary } from '../components/booking-summary';
import type { BookingSelection } from '../hooks/use-booking-selection';
import { bookingStrings } from '../localization/booking-strings';
import { getReasonCategoryOptions } from '../presentation/formatters';

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
  const { locale } = useAppLocale();
  const strings = useStrings(bookingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reasonCategoryOptions = useMemo(() => getReasonCategoryOptions(locale), [locale]);

  return (
    <BookingScaffold
      onBack={onBack}
      step={strings.stepOf(1, 2)}
      subtitle={strings.details.subtitle}
      title={strings.details.title}
    >
      <BookingSummary reasonCategory={reasonCategory} selection={selection} />

      <Surface padding="spacious" style={styles.reasonCard} variant="plain">
        <View style={styles.reasonHeading}>
          <AppText variant="titleSmall">{strings.details.reasonQuestion}</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.details.reasonHelp}
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
        {strings.details.reviewAppointment}
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
