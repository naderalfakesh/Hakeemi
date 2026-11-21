import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import type { AppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import type { AvailabilitySlot, AvailabilityWindow, Clinic } from '../domain/types';
import {
  availableAppointmentCountLabels,
  providerDetailStrings,
} from '../localization/care-strings';
import {
  buildAvailabilityCalendarDays,
  dayGridColumns,
  formatCalendarRange,
  formatDayNumber,
  formatFullDate,
  formatSlotTime,
  formatWeekday,
} from '../presentation/availability-calendar-days';
import { formatVisitMode } from '../presentation/formatters';

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
  const { fontScale } = useWindowDimensions();
  const columns = dayGridColumns(fontScale);
  const styles = useMemo(() => createStyles(theme, columns), [columns, theme]);
  const timezone = slots[0]?.timezone ?? 'Asia/Dubai';
  const clinicsById = useMemo(
    () => new Map((clinics ?? []).map((clinic) => [clinic.id, clinic])),
    [clinics],
  );
  const days = useMemo(
    () => buildAvailabilityCalendarDays(availabilityWindow, timezone, slots),
    [availabilityWindow, slots, timezone],
  );
  const firstAvailableDay = days.find((day) => day.slots.length > 0) ?? null;
  const [selectedDateKey, setSelectedDateKey] = useState(firstAvailableDay?.dateKey ?? null);
  const selectedDay =
    days.find((day) => day.dateKey === selectedDateKey && day.slots.length > 0) ??
    firstAvailableDay;
  const [selectedSlotId, setSelectedSlotId] = useState(selectedDay?.slots[0]?.id ?? null);
  const selectedSlot =
    selectedDay?.slots.find((slot) => slot.id === selectedSlotId) ?? selectedDay?.slots[0] ?? null;
  const intlLocale = locale === 'ar' ? 'ar-AE' : 'en-AE';
  const activeDay = selectedDay ?? firstAvailableDay;

  useEffect(() => {
    onSelectedSlotChange?.(selectedSlot);
  }, [onSelectedSlotChange, selectedSlot]);

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

      <View accessibilityRole="radiogroup" style={styles.dayGrid}>
        {days.map((day) => {
          const isAvailable = day.slots.length > 0;
          const isSelected = day.dateKey === activeDay?.dateKey;
          const label = formatFullDate(day.date, intlLocale);

          return (
            <Pressable
              accessibilityLabel={
                isAvailable
                  ? strings.availableDay(label, day.slots.length)
                  : strings.unavailableDay(label)
              }
              accessibilityRole="radio"
              accessibilityState={{ disabled: !isAvailable || isSubmitting, selected: isSelected }}
              disabled={!isAvailable || isSubmitting}
              key={day.dateKey}
              onPress={() => {
                setSelectedDateKey(day.dateKey);
                setSelectedSlotId(day.slots[0]?.id ?? null);
              }}
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
              {/* Only bookable days get a dot; the legend says a dot means
                  appointments, so unavailable days keep an invisible spacer. */}
              <View
                style={[
                  styles.availabilityDot,
                  isAvailable
                    ? {
                        backgroundColor: isSelected
                          ? theme.colors.textInverse
                          : theme.colors.success,
                      }
                    : styles.availabilityDotHidden,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {activeDay && (
        <>
          <View style={styles.timeSection}>
            <View style={styles.timeHeading}>
              <AppText variant="titleSmall">{strings.chooseTime}</AppText>
              <AppText tone="secondary" variant="caption">
                {formatFullDate(activeDay.date, intlLocale)}
              </AppText>
            </View>
            <View accessibilityRole="radiogroup" style={styles.timeGrid}>
              {activeDay.slots.map((slot) => {
                const selected = slot.id === selectedSlot?.id;
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
                    accessibilityState={{ disabled: isSubmitting, selected }}
                    disabled={isSubmitting}
                    key={slot.id}
                    onPress={() => setSelectedSlotId(slot.id)}
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
                    <AppText
                      numberOfLines={2}
                      tone={selected ? 'brand' : 'secondary'}
                      variant="caption"
                    >
                      {slotMeta}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

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

function createStyles(theme: AppTheme, columns: number) {
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
    // Soft selection styling keeps the chosen chip visually distinct from the
    // solid primary "Continue" button below it.
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
