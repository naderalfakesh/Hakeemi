import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import type { WritableCalendar } from '@/services/calendar/calendar';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { formatCalendarName } from '../localization/format-calendar-name';

type CalendarChooserCardProps = {
  calendars: readonly WritableCalendar[];
  onChoose: (calendar: WritableCalendar) => Promise<void>;
  onDismiss: () => void;
};

export function CalendarChooserCard({ calendars, onChoose, onDismiss }: CalendarChooserCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(appointmentDetailStrings);
  // Keyed by list identity so reopening the chooser resets without an effect.
  const [pickedFrom, setPickedFrom] = useState<readonly WritableCalendar[] | null>(null);
  const picked = pickedFrom === calendars;

  return (
    <Surface padding="spacious" style={styles.chooser} variant="muted">
      <AppText accessibilityRole="header" variant="titleSmall">
        {strings.chooseCalendarTitle}
      </AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {strings.chooseCalendarDescription}
      </AppText>
      <View style={styles.options}>
        {calendars.map((calendar) => (
          <Pressable
            accessibilityHint={strings.chooseCalendarHint}
            accessibilityLabel={formatCalendarName(calendar)}
            accessibilityRole="button"
            accessibilityState={{ disabled: picked }}
            disabled={picked}
            key={calendar.id}
            onPress={() => {
              setPickedFrom(calendars);
              void onChoose(calendar);
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
      <Button onPress={onDismiss} variant="tertiary">
        {strings.notNow}
      </Button>
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
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
