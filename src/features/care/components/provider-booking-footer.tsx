import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText, Button } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppMotion, useThemedStyles, type AppTheme } from '@/theme';

import type { AvailabilitySlot, Clinic } from '../domain/types';
import { providerDetailStrings } from '../localization/care-strings';
import { formatSlotDateSummary, formatSlotTime } from '../presentation/availability-calendar-days';
import { formatVisitMode } from '../presentation/formatters';

type ProviderBookingFooterProps = {
  clinics: readonly Clinic[];
  onChooseSlot: (slot: AvailabilitySlot) => void;
  selectedSlot: AvailabilitySlot;
};

export function ProviderBookingFooter({
  clinics,
  onChooseSlot,
  selectedSlot,
}: ProviderBookingFooterProps) {
  const motion = useAppMotion();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);
  const selectedClinic =
    selectedSlot.visitMode === 'in_person' && selectedSlot.clinicId
      ? clinics.find((clinic) => clinic.id === selectedSlot.clinicId)
      : undefined;

  return (
    <Animated.View
      {...(motion.prefersReducedMotion
        ? {}
        : { entering: FadeIn.duration(motion.duration.normal) })}
      style={styles.stickyFooter}
    >
      <AppText numberOfLines={1} tone="secondary" variant="caption">
        {`${formatSlotDateSummary(selectedSlot, intlLocale)} · ${formatVisitMode(
          selectedSlot.visitMode,
          locale,
        )}${selectedClinic ? ` · ${selectedClinic.name[locale]}` : ''}`}
      </AppText>
      <Button onPress={() => onChooseSlot(selectedSlot)}>
        {strings.continueWithTime(formatSlotTime(selectedSlot, intlLocale))}
      </Button>
    </Animated.View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    stickyFooter: {
      backgroundColor: theme.colors.canvas,
      borderTopColor: theme.colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
  });
}
