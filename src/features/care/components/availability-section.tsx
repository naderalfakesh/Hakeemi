import { StyleSheet } from 'react-native';

import { AppText, Surface } from '@/components/ui';
import type { AppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import type { AvailabilitySlot, AvailabilityWindow, Clinic } from '../domain/types';
import { providerDetailStrings } from '../localization/care-strings';
import { AvailabilityCalendar } from './availability-calendar';

type AvailabilitySectionProps = {
  availabilityWindow: AvailabilityWindow;
  clinics: readonly Clinic[];
  locale: AppLocale;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  onSelectedSlotChange: (slot: AvailabilitySlot | null) => void;
  slots: readonly AvailabilitySlot[];
};

export function AvailabilitySection({
  availabilityWindow,
  clinics,
  locale,
  onChooseSlot,
  onSelectedSlotChange,
  slots,
}: AvailabilitySectionProps) {
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <Surface padding="spacious" variant="brand">
      <AppText tone="brand" variant="caption">
        {strings.next14Days}
      </AppText>
      <AppText style={styles.availabilityTitle} variant="titleMedium">
        {strings.availableAppointments}
      </AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {slots.length > 0 ? strings.timezoneNote : strings.noAppointments}
      </AppText>
      <AvailabilityCalendar
        availabilityWindow={availabilityWindow}
        clinics={clinics}
        hideConfirmButton
        locale={locale}
        onChooseSlot={onChooseSlot}
        onSelectedSlotChange={onSelectedSlotChange}
        slots={slots}
      />
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    availabilityTitle: {
      marginBottom: theme.spacing.xxs,
      marginTop: theme.spacing.sm,
    },
  });
}
