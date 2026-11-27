import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { AppointmentStatus } from '../domain/types';
import type { AppointmentCalendar } from '../hooks/use-appointment-calendar';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { formatCalendarName } from '../localization/format-calendar-name';
import { CalendarChooserCard } from './calendar-chooser-card';

type AppointmentCalendarSectionProps = {
  appointmentStatus: AppointmentStatus;
  calendar: AppointmentCalendar;
};

export function AppointmentCalendarSection({
  appointmentStatus,
  calendar: { choose, dismissChooser, moveToCurrentTime, removeEvent, start, state },
}: AppointmentCalendarSectionProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(appointmentDetailStrings);

  if (appointmentStatus !== 'confirmed') {
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
    return (
      <CalendarChooserCard
        calendars={state.calendars}
        onChoose={choose}
        onDismiss={dismissChooser}
      />
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
  });
}
