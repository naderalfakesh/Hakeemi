import { StyleSheet } from 'react-native';

import { AppText, Skeleton, Surface } from '@/components/ui';
import { AvailabilityCalendar } from '@/features/care/components/availability-calendar';
import type { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { appointmentDetailStrings } from '../localization/appointment-detail-strings';

type RescheduleSectionProps = {
  currentSlotId: string;
  onSelect: (slotId: string) => void;
  providerState: ReturnType<typeof useProviderDetail>['state'];
  submitting: boolean;
};

export function RescheduleSection({
  currentSlotId,
  onSelect,
  providerState,
  submitting,
}: RescheduleSectionProps) {
  const { locale } = useAppLocale();
  const strings = useStrings(appointmentDetailStrings);
  const styles = useThemedStyles(createStyles);

  if (providerState.status === 'loading') {
    return (
      <Surface padding="spacious" variant="plain">
        <Skeleton height={22} width="60%" />
        <Skeleton height={52} radius="md" width="100%" />
      </Surface>
    );
  }

  if (providerState.status !== 'success') {
    return (
      <Surface padding="compact" variant="muted">
        <AppText tone="secondary" variant="bodyMedium">
          {strings.rescheduleLoadError}
        </AppText>
      </Surface>
    );
  }

  const slots = providerState.data.slots.filter((slot) => slot.id !== currentSlotId);

  return (
    <Surface padding="spacious" style={styles.reschedule} variant="plain">
      <AppText variant="titleSmall">{strings.chooseNewTime}</AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {strings.rescheduleDescription}
      </AppText>
      {slots.length === 0 ? (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.noOtherTimes}
        </AppText>
      ) : (
        <AvailabilityCalendar
          availabilityWindow={providerState.data.availabilityWindow}
          isSubmitting={submitting}
          locale={locale}
          onChooseSlot={(slot) => onSelect(slot.id)}
          slots={slots}
        />
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    reschedule: { gap: theme.spacing.sm },
  });
}
