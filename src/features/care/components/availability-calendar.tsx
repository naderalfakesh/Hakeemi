import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import type { AppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import type { AvailabilitySlot, AvailabilityWindow } from '../domain/types';
import {
  availableAppointmentCountLabels,
  providerDetailStrings,
} from '../localization/care-strings';
import { formatVisitMode } from '../presentation/formatters';

const DAY_MS = 24 * 60 * 60 * 1_000;

export type AvailabilityCalendarDay = {
  date: Date;
  dateKey: string;
  slots: readonly AvailabilitySlot[];
};

export function AvailabilityCalendar({
  availabilityWindow,
  isSubmitting = false,
  locale,
  onChooseSlot,
  slots,
}: {
  availabilityWindow: AvailabilityWindow;
  isSubmitting?: boolean;
  locale: AppLocale;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  slots: readonly AvailabilitySlot[];
}) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const timezone = slots[0]?.timezone ?? 'Asia/Dubai';
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
                  {
                    backgroundColor: isSelected
                      ? theme.colors.textInverse
                      : isAvailable
                        ? theme.colors.success
                        : theme.colors.borderStrong,
                  },
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

                return (
                  <Pressable
                    accessibilityLabel={strings.chooseSlot(
                      `${time}, ${formatVisitMode(slot.visitMode, locale)}`,
                    )}
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
                        color={selected ? theme.colors.textInverse : theme.colors.brand}
                        name={slot.visitMode === 'video' ? 'videocam-outline' : 'location-outline'}
                        size={18}
                      />
                      <AppText tone={selected ? 'inverse' : 'primary'} variant="bodyStrong">
                        {time}
                      </AppText>
                    </View>
                    <AppText tone={selected ? 'inverse' : 'secondary'} variant="caption">
                      {formatVisitMode(slot.visitMode, locale)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
        </>
      )}
    </View>
  );
}

export function buildAvailabilityCalendarDays(
  availabilityWindow: AvailabilityWindow,
  timezone: string,
  slots: readonly AvailabilitySlot[],
): readonly AvailabilityCalendarDay[] {
  const startsAt = new Date(availabilityWindow.startsAtOrAfter);
  const endsBefore = new Date(availabilityWindow.endsBefore);
  const dayCount = Math.max(
    1,
    Math.min(31, Math.ceil((endsBefore.getTime() - startsAt.getTime()) / DAY_MS)),
  );
  const slotsByDay = new Map<string, AvailabilitySlot[]>();

  for (const slot of slots) {
    const dateKey = formatDateKey(new Date(slot.startsAt), slot.timezone);
    const daySlots = slotsByDay.get(dateKey) ?? [];
    daySlots.push(slot);
    slotsByDay.set(dateKey, daySlots);
  }

  return Array.from({ length: dayCount }, (_, offset) => {
    const instant = new Date(startsAt.getTime() + offset * DAY_MS);
    const dateKey = formatDateKey(instant, timezone);
    const [year, month, day] = dateKey.split('-').map(Number);

    return {
      date: new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12)),
      dateKey,
      slots: [...(slotsByDay.get(dateKey) ?? [])].sort((left, right) =>
        left.startsAt.localeCompare(right.startsAt),
      ),
    };
  });
}

function formatDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

function formatCalendarRange(days: readonly AvailabilityCalendarDay[], locale: string) {
  const firstDay = days[0]?.date;
  const lastDay = days.at(-1)?.date;

  if (!firstDay || !lastDay) {
    return '';
  }

  const first = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(firstDay);
  const last = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: firstDay.getUTCFullYear() === lastDay.getUTCFullYear() ? undefined : 'numeric',
  }).format(lastDay);

  return `${first} – ${last}`;
}

function formatWeekday(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' }).format(date);
}

function formatDayNumber(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatFullDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
  }).format(date);
}

function formatSlotTime(slot: AvailabilitySlot, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: slot.timezone,
  }).format(new Date(slot.startsAt));
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
    dayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xxs,
    },
    day: {
      alignItems: 'center',
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexBasis: '12%',
      flexGrow: 1,
      gap: theme.spacing.xxs,
      justifyContent: 'center',
      minHeight: 70,
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
      backgroundColor: theme.colors.brand,
      borderColor: theme.colors.brand,
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
