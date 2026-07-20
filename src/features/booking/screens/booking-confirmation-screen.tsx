import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Illustration, stateIllustrations, Surface } from '@/components/ui';
import type { Appointment } from '@/features/appointments/domain/types';
import type { Provider } from '@/features/care/domain/types';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { triggerHaptic } from '@/services/haptics/haptics';
import { useAppTheme, type AppTheme } from '@/theme';

import { bookingStrings } from '../localization/booking-strings';

export function BookingConfirmationScreen({
  appointment,
  onFindCare,
  onViewAppointments,
  provider,
}: {
  appointment: Appointment;
  onFindCare: () => void;
  onViewAppointments: () => void;
  provider: Provider | null;
}) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(bookingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    void triggerHaptic('success');
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
          <Illustration backdrop={false} size={200} source={stateIllustrations.bookingConfirmed} />
        </View>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" style={styles.centered} variant="titleLarge">
            {strings.confirmation.title}
          </AppText>
          <AppText style={styles.centered} tone="secondary" variant="bodyLarge">
            {strings.confirmation.subtitle}
          </AppText>
        </View>

        <Surface padding="spacious" style={styles.card} variant="brand">
          <AppText variant="titleSmall">
            {provider
              ? provider.displayName[locale]
              : strings.confirmation.confirmedProviderFallback}
          </AppText>
          <AppText variant="bodyStrong">{formatAppointment(appointment, intlLocale)}</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.confirmation.visitMeta(
              appointment.visitMode === 'video'
                ? strings.confirmation.videoVisit
                : strings.confirmation.inPersonVisit,
              appointment.timezone,
            )}
          </AppText>
          <AppText selectable tone="secondary" variant="caption">
            {strings.confirmation.reference(appointment.id.slice(-10).toUpperCase())}
          </AppText>
        </Surface>

        <View style={styles.actions}>
          <Button onPress={onViewAppointments}>{strings.confirmation.viewAppointments}</Button>
          <Button onPress={onFindCare} variant="secondary">
            {strings.confirmation.findAnotherClinician}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function formatAppointment(appointment: Appointment, locale = 'en-AE') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: appointment.timezone,
  }).format(new Date(appointment.startsAt));
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      flex: 1,
      gap: theme.spacing.lg,
      justifyContent: 'center',
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    icon: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.success,
      borderRadius: theme.radii.full,
      height: 72,
      justifyContent: 'center',
      width: 72,
    },
    heading: {
      gap: theme.spacing.xs,
    },
    centered: {
      textAlign: 'center',
    },
    card: {
      gap: theme.spacing.sm,
    },
    actions: {
      gap: theme.spacing.sm,
    },
  });
}
