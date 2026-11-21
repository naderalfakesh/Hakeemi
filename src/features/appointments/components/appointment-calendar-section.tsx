import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import type { WritableCalendar } from '@/services/calendar/calendar';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { AppointmentStatus } from '../domain/types';
import { formatCalendarName, type AppointmentCalendar } from '../hooks/use-appointment-calendar';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';

export function AppointmentCalendarSection({
  appointmentStatus,
  calendar: { choose, dismissChooser, moveToCurrentTime, removeEvent, start, state },
}: {
  appointmentStatus: AppointmentStatus;
  calendar: AppointmentCalendar;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(appointmentDetailStrings);
  // The chooser list a calendar was picked from; each opening is a new list,
  // so a fresh chooser is enabled again without resetting state in an effect.
  const [pickedFrom, setPickedFrom] = useState<readonly WritableCalendar[] | null>(null);

  if (appointmentStatus !== 'confirmed') {
    // A cancelled visit only reports what happened to its calendar event.
    if (state.status === 'removed') {
      return (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {strings.calendarRemoved(formatCalendarName(state.calendar))}
        </AppText>
      );
    }

    if (state.status === 'notRemoved') {
      return (
        <View style={styles.section}>
          <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
            {strings.calendarNotRemoved(formatCalendarName(state.calendar))}
          </AppText>
          <Button onPress={() => void removeEvent()} variant="secondary">
            {strings.removeFromCalendar}
          </Button>
        </View>
      );
    }

    return null;
  }

  if (state.status === 'stale') {
    return (
      <View style={styles.section}>
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {strings.calendarStale(formatCalendarName(state.calendar))}
        </AppText>
        <Button
          accessibilityLabel={strings.moveCalendarEvent}
          leading={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={18} />}
          onPress={() => void moveToCurrentTime()}
          variant="secondary"
        >
          {strings.moveCalendarEvent}
        </Button>
      </View>
    );
  }

  if (state.status === 'choosing') {
    const picked = pickedFrom === state.calendars;

    return (
      <Surface padding="spacious" style={styles.chooser} variant="muted">
        <AppText accessibilityRole="header" variant="titleSmall">
          {strings.chooseCalendarTitle}
        </AppText>
        <AppText tone="secondary" variant="bodyMedium">
          {strings.chooseCalendarDescription}
        </AppText>
        <View style={styles.options}>
          {state.calendars.map((calendar) => (
            <Pressable
              accessibilityHint={strings.chooseCalendarHint}
              accessibilityLabel={formatCalendarName(calendar)}
              accessibilityRole="button"
              accessibilityState={{ disabled: picked }}
              disabled={picked}
              key={calendar.id}
              onPress={() => {
                // A second tap before the chooser closes must not add twice.
                setPickedFrom(state.calendars);
                void choose(calendar);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={20} />
              <View style={styles.optionCopy}>
                <AppText variant="bodyStrong">{calendar.title}</AppText>
                {calendar.accountName && (
                  <AppText tone="secondary" variant="caption">
                    {calendar.accountName}
                  </AppText>
                )}
              </View>
            </Pressable>
          ))}
        </View>
        <Button onPress={dismissChooser} variant="tertiary">
          {strings.notNow}
        </Button>
      </Surface>
    );
  }

  const added =
    state.status === 'added' || state.status === 'addedUntracked' || state.status === 'moved';
  const addLabel =
    state.status === 'outdated' ? strings.addNewTimeToCalendar : strings.addToCalendar;

  return (
    <View style={styles.section}>
      <Button
        accessibilityLabel={added ? strings.addedToCalendar : addLabel}
        busy={state.status === 'working'}
        disabled={added}
        leading={<DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={18} />}
        onPress={() => void start()}
        variant="secondary"
      >
        {added ? strings.addedToCalendar : addLabel}
      </Button>
      {added && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {state.status === 'moved'
            ? strings.calendarMoved(formatCalendarName(state.calendar))
            : strings.savedInCalendar(formatCalendarName(state.calendar))}
          {state.status === 'addedUntracked' ? ` ${strings.calendarUntracked}` : ''}
        </AppText>
      )}
      {state.status === 'outdated' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
          {strings.calendarNotMoved}
        </AppText>
      )}
      {state.status === 'denied' && (
        <AppText tone="secondary" variant="caption">
          {strings.calendarDenied}
        </AppText>
      )}
      {state.status === 'unavailable' && (
        <AppText tone="secondary" variant="caption">
          {strings.calendarUnavailable}
        </AppText>
      )}
      {state.status === 'error' && (
        <AppText tone="danger" variant="caption">
          {strings.calendarError}
        </AppText>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    section: { gap: theme.spacing.xs },
    chooser: { gap: theme.spacing.sm },
    options: { gap: theme.spacing.xs },
    option: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.borderSubtle,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minHeight: theme.sizes.minimumTouchTarget,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    optionCopy: { flex: 1, gap: theme.spacing.xxs },
    pressed: { opacity: 0.82 },
  });
}
