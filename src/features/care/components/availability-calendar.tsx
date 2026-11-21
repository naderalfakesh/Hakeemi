import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import type { AppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { AvailabilitySlot, AvailabilityWindow, Clinic } from '../domain/types';
import { useAvailabilitySelection } from '../hooks/use-availability-selection';
import {
  availableAppointmentCountLabels,
  providerDetailStrings,
} from '../localization/care-strings';
import { formatCalendarRange, formatSlotTime } from '../presentation/availability-calendar-days';
import { AvailabilityDayGrid } from './availability-day-grid';
import { AvailabilityTimeGrid } from './availability-time-grid';

type AvailabilityCalendarProps = {
  availabilityWindow: AvailabilityWindow;
  clinics?: readonly Clinic[] | undefined;
  hideConfirmButton?: boolean;
  isSubmitting?: boolean;
  locale: AppLocale;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  onSelectedSlotChange?: (slot: AvailabilitySlot | null) => void;
  slots: readonly AvailabilitySlot[];
};

export function AvailabilityCalendar({
  availabilityWindow,
  clinics,
  hideConfirmButton = false,
  isSubmitting = false,
  locale,
  onChooseSlot,
  onSelectedSlotChange,
  slots,
}: AvailabilityCalendarProps) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);
  const { days, activeDay, selectedSlot, selectDay, selectSlot } = useAvailabilitySelection({
    availabilityWindow,
    onSelectedSlotChange,
    slots,
  });
  const intlLocale = locale === 'ar' ? 'ar-AE' : 'en-AE';

  return (
    <View
      accessibilityLabel={formatLocalizedCount(
        slots.length,
        locale,
        availableAppointmentCountLabels,
      )}
      style={styles.container}
    >
      <View style={styles.calendarHeading}>
        <View style={styles.calendarTitle}>
          <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={20} />
          <AppText variant="bodyStrong">{formatCalendarRange(days, intlLocale)}</AppText>
        </View>
        <AppText tone="secondary" variant="caption">
          {strings.calendarHint}
        </AppText>
      </View>

      <AvailabilityDayGrid
        activeDateKey={activeDay?.dateKey}
        days={days}
        disabled={isSubmitting}
        intlLocale={intlLocale}
        onSelectDay={selectDay}
      />

      {activeDay && (
        <>
          <AvailabilityTimeGrid
            clinics={clinics}
            day={activeDay}
            disabled={isSubmitting}
            intlLocale={intlLocale}
            locale={locale}
            onSelectSlot={selectSlot}
            selectedSlotId={selectedSlot?.id ?? null}
          />

          {!hideConfirmButton && (
            <Button
              busy={isSubmitting}
              disabled={!selectedSlot}
              onPress={() => {
                if (selectedSlot) {
                  onChooseSlot(selectedSlot);
                }
              }}
            >
              {selectedSlot
                ? strings.continueWithTime(formatSlotTime(selectedSlot, intlLocale))
                : strings.chooseTime}
            </Button>
          )}
        </>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    calendarHeading: {
      gap: theme.spacing.xxs,
    },
    calendarTitle: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  });
}
