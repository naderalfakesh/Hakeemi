import { StyleSheet, View } from 'react-native';

import { AppText, Button, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { appointmentDetailStrings } from '../localization/appointment-detail-strings';

type CancelConfirmationProps = {
  isCancelling: boolean;
  onConfirm: () => void;
  onKeep: () => void;
};

export function CancelConfirmation({ isCancelling, onConfirm, onKeep }: CancelConfirmationProps) {
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);
  return (
    <Surface padding="spacious" style={styles.confirmation} variant="muted">
      <AppText variant="titleSmall">{strings.cancelConfirmTitle}</AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {strings.cancelConfirmDescription}
      </AppText>
      <View style={styles.inlineActions}>
        <Button onPress={onKeep} variant="secondary">
          {strings.keepAppointment}
        </Button>
        <Button
          accessibilityHint={strings.confirmCancellationHint}
          busy={isCancelling}
          onPress={onConfirm}
          variant="danger"
        >
          {strings.confirmCancellation}
        </Button>
      </View>
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    confirmation: { gap: theme.spacing.sm },
    inlineActions: { gap: theme.spacing.xs },
  });
}
