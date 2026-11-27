import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon } from '@/components/ui';
import type { AppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, useAppTheme, type AppTheme } from '@/theme';

import type { Clinic } from '../domain/types';
import { providerDetailStrings } from '../localization/care-strings';
import {
  formatFullDate,
  formatSlotTime,
  type AvailabilityCalendarDay,
} from '../presentation/availability-calendar-days';
import { formatVisitMode } from '../presentation/formatters';

type AvailabilityTimeGridProps = {
  clinics: readonly Clinic[] | undefined;
  day: AvailabilityCalendarDay;
  disabled: boolean;
  intlLocale: string;
  locale: AppLocale;
  onSelectSlot: (slotId: string) => void;
  selectedSlotId: string | null;
};

export function AvailabilityTimeGrid({
  clinics,
  day,
  disabled,
  intlLocale,
  locale,
  onSelectSlot,
  selectedSlotId,
}: AvailabilityTimeGridProps) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);
  const clinicsById = useMemo(
    () => new Map((clinics ?? []).map((clinic) => [clinic.id, clinic])),
    [clinics],
  );

  return (
    <View style={styles.timeSection}>
      <View style={styles.timeHeading}>
        <AppText variant="titleSmall">{strings.chooseTime}</AppText>
        <AppText tone="secondary" variant="caption">
          {formatFullDate(day.date, intlLocale)}
        </AppText>
      </View>
      <View accessibilityRole="radiogroup" style={styles.timeGrid}>
        {day.slots.map((slot) => {
          const selected = slot.id === selectedSlotId;
          const time = formatSlotTime(slot, intlLocale);
          const clinic =
            slot.visitMode === 'in_person' && slot.clinicId
              ? clinicsById.get(slot.clinicId)
              : undefined;
          const slotMeta = clinic
            ? `${formatVisitMode(slot.visitMode, locale)} · ${clinic.name[locale]}`
            : formatVisitMode(slot.visitMode, locale);

          return (
            <Pressable
              accessibilityLabel={strings.chooseSlot(`${time}, ${slotMeta}`)}
              accessibilityRole="radio"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={slot.id}
              onPress={() => onSelectSlot(slot.id)}
              style={({ pressed }) => [
                styles.timeSlot,
                selected && styles.selectedTimeSlot,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.timeRow}>
                <DecorativeIcon
                  color={theme.colors.brand}
                  name={slot.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
                  size={18}
                />
                <AppText tone={selected ? 'brand' : 'primary'} variant="bodyStrong">
                  {time}
                </AppText>
              </View>
              <AppText numberOfLines={2} tone={selected ? 'brand' : 'secondary'} variant="caption">
                {slotMeta}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    timeSection: {
      gap: theme.spacing.sm,
    },
    timeHeading: {
      gap: theme.spacing.xxs,
    },
    timeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    timeSlot: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexBasis: '46%',
      flexGrow: 1,
      gap: theme.spacing.xxs,
      minHeight: 68,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    selectedTimeSlot: {
      backgroundColor: theme.colors.brandSoft,
      borderColor: theme.colors.brand,
      borderWidth: 2,
      paddingHorizontal: theme.spacing.sm - 1,
      paddingVertical: theme.spacing.sm - 1,
    },
    timeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
  });
}
