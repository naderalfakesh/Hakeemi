import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import type { ProviderDetailState } from '@/features/care/hooks/use-provider-detail';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Appointment } from '../domain/types';
import type { AppointmentActions } from '../hooks/use-appointment-actions';
import type { AppointmentCalendar } from '../hooks/use-appointment-calendar';
import { appointmentDetailStrings } from '../localization/appointment-detail-strings';
import { localizeAppointmentError } from '../localization/appointment-error-strings';
import { formatAppointmentDate } from '../localization/format-appointment-time';
import { AppointmentCalendarSection } from './appointment-calendar-section';
import { CancelConfirmation } from './cancel-confirmation';
import { RescheduleSection } from './reschedule-section';

type AppointmentDetailActionsProps = {
  actions: AppointmentActions;
  appointment: Appointment;
  calendar: AppointmentCalendar;
  canManage: boolean;
  onFindCare: () => void;
  providerState: ProviderDetailState;
};

export function AppointmentDetailActions({
  actions,
  appointment,
  calendar,
  canManage,
  onFindCare,
  providerState,
}: AppointmentDetailActionsProps) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {/* Only one intent is visible at a time: the default action stack,
          the focused cancel confirmation, or the reschedule flow. The stack
          leads with rescheduling and keeps one rhythm down to cancelling. */}
      {canManage && !actions.confirmingCancel && !actions.showReschedule && (
        <View style={styles.actions}>
          <Button onPress={actions.openReschedule}>{strings.reschedule}</Button>
          <AppointmentCalendarSection appointmentStatus={appointment.status} calendar={calendar} />
          <Button
            accessibilityHint={strings.cancelAppointmentHint}
            onPress={actions.startCancel}
            variant="dangerSoft"
          >
            {strings.cancelAppointment}
          </Button>
        </View>
      )}

      {/* The section stays for a cancelled visit so its calendar event is
          removed and the outcome reported. */}
      {(appointment.status === 'cancelled' ||
        (appointment.status === 'confirmed' && !canManage)) && (
        <AppointmentCalendarSection appointmentStatus={appointment.status} calendar={calendar} />
      )}

      {appointment.status === 'cancelled' && appointment.cancelledAt && (
        <Surface padding="compact" style={styles.notice} variant="muted">
          <DecorativeIcon color={theme.colors.warning} name="information-circle" size={20} />
          <AppText style={styles.flexText} tone="secondary" variant="bodyMedium">
            {strings.cancelledOn(formatAppointmentDate(appointment.cancelledAt, intlLocale))}
          </AppText>
        </Surface>
      )}

      {actions.confirmingCancel && canManage && (
        <CancelConfirmation
          isCancelling={actions.isCancelling}
          onConfirm={() => void actions.confirmCancel()}
          onKeep={actions.dismissCancel}
        />
      )}

      {actions.showReschedule && canManage && (
        <>
          <Button onPress={actions.closeReschedule} variant="secondary">
            {strings.keepCurrentTime}
          </Button>
          <RescheduleSection
            currentSlotId={appointment.slotId}
            onSelect={(slotId) => void actions.reschedule(slotId)}
            providerState={providerState}
            submitting={actions.isRescheduling}
          />
        </>
      )}

      {actions.actionError && (
        <InlineError message={localizeAppointmentError(actions.actionError, locale)} />
      )}

      {!canManage && appointment.status !== 'cancelled' && (
        <Surface padding="compact" variant="muted">
          <AppText tone="secondary" variant="bodyMedium">
            {strings.historyNotice}
          </AppText>
        </Surface>
      )}

      {!actions.confirmingCancel && !actions.showReschedule && (
        <Button onPress={onFindCare} variant="tertiary">
          {strings.findAnotherClinician}
        </Button>
      )}
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    flexText: { flex: 1 },
    notice: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
    actions: { gap: theme.spacing.sm },
  });
}
