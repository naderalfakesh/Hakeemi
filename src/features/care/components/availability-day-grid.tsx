import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { providerDetailStrings } from '../localization/care-strings';
import {
  dayGridColumns,
  formatDayNumber,
  formatFullDate,
  formatWeekday,
  type AvailabilityCalendarDay,
} from '../presentation/availability-calendar-days';

type AvailabilityDayGridProps = {
  activeDateKey: string | undefined;
  days: readonly AvailabilityCalendarDay[];
  disabled: boolean;
  intlLocale: string;
  onSelectDay: (day: AvailabilityCalendarDay) => void;
};

export function AvailabilityDayGrid({
  activeDateKey,
  days,
  disabled,
  intlLocale,
  onSelectDay,
}: AvailabilityDayGridProps) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const { fontScale } = useWindowDimensions();
  const columns = dayGridColumns(fontScale);
  const styles = useMemo(() => createStyles(theme, columns), [columns, theme]);

  return (
    <View accessibilityRole="radiogroup" style={styles.dayGrid}>
      {days.map((day) => {
        const isAvailable = day.slots.length > 0;
        const isSelected = day.dateKey === activeDateKey;
        const label = formatFullDate(day.date, intlLocale);

        return (
          <Pressable
            accessibilityLabel={
              isAvailable
                ? strings.availableDay(label, day.slots.length)
                : strings.unavailableDay(label)
            }
            accessibilityRole="radio"
            accessibilityState={{ disabled: !isAvailable || disabled, selected: isSelected }}
            disabled={!isAvailable || disabled}
            key={day.dateKey}
            onPress={() => onSelectDay(day)}
            style={({ pressed }) => [
              styles.day,
              isAvailable ? styles.availableDay : styles.unavailableDay,
              isSelected && styles.selectedDay,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
              style={styles.weekday}
              tone={isSelected ? 'inverse' : 'secondary'}
              variant="labelSmall"
            >
              {formatWeekday(day.date, intlLocale)}
            </AppText>
            <AppText tone={isSelected ? 'inverse' : 'primary'} variant="bodyStrong">
              {formatDayNumber(day.date, intlLocale)}
            </AppText>
            <View
              style={[
                styles.availabilityDot,
                isAvailable
                  ? {
                      backgroundColor: isSelected ? theme.colors.textInverse : theme.colors.success,
                    }
                  : styles.availabilityDotHidden,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme, columns: number) {
  return StyleSheet.create({
    dayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xxs,
    },
    day: {
      alignItems: 'center',
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexBasis: columns === 7 ? '12%' : '22%',
      flexGrow: 1,
      gap: theme.spacing.xxs,
      justifyContent: 'center',
      minHeight: 58,
      minWidth: 32,
      paddingHorizontal: theme.spacing.xxs,
      paddingVertical: theme.spacing.xs,
    },
    availableDay: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.borderFocus,
    },
    unavailableDay: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderSubtle,
      opacity: 0.5,
    },
    selectedDay: {
      backgroundColor: theme.colors.brand,
      borderColor: theme.colors.brand,
    },
    weekday: {
      textTransform: 'uppercase',
    },
    availabilityDot: {
      borderRadius: theme.radii.full,
      height: 5,
      width: 5,
    },
    availabilityDotHidden: {
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
  });
}
