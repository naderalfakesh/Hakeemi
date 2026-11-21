import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import type {
  NotificationRegistrationError,
  NotificationRegistrationStatus,
} from '@/features/notifications/context/notification-registration-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { profileStrings } from '../localization/profile-strings';

type NotificationRemindersCardProps = {
  notificationError: NotificationRegistrationError | null;
  notificationStatus: NotificationRegistrationStatus;
  onEnableNotifications: () => Promise<void>;
};

export function NotificationRemindersCard({
  notificationError,
  notificationStatus,
  onEnableNotifications,
}: NotificationRemindersCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.notificationCard} variant="brand">
      <View style={styles.notificationHeading}>
        <DecorativeIcon color={theme.colors.brand} name="notifications-outline" size={24} />
        <AppText style={styles.flexText} variant="titleSmall">
          {strings.appointmentReminders}
        </AppText>
      </View>
      {notificationStatus === 'registered' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.remindersRegistered}
        </AppText>
      )}
      {notificationStatus === 'denied' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.remindersDenied}
        </AppText>
      )}
      {notificationStatus === 'unavailable' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.remindersUnavailable}
        </AppText>
      )}
      {notificationStatus === 'error' && (
        <InlineError
          message={
            notificationError === 'enable-failed'
              ? strings.notificationEnableFailed
              : strings.notificationErrorFallback
          }
        />
      )}
      {(notificationStatus === 'idle' ||
        notificationStatus === 'denied' ||
        notificationStatus === 'error') && (
        <Button onPress={() => void onEnableNotifications()} variant="secondary">
          {notificationStatus === 'idle' ? strings.enableReminders : strings.retryReminders}
        </Button>
      )}
      {notificationStatus === 'requesting' && (
        <Button busy onPress={() => undefined} variant="secondary">
          {strings.enablingReminders}
        </Button>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    notificationCard: {
      gap: theme.spacing.md,
    },
    notificationHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    flexText: {
      flex: 1,
    },
  });
}
