import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Illustration, stateIllustrations, Surface } from '@/components/ui';
import { AppointmentCalendarSection } from '@/features/appointments/components/appointment-calendar-section';
import type { Appointment } from '@/features/appointments/domain/types';
import type { AppointmentCalendar } from '@/features/appointments/hooks/use-appointment-calendar';
import type { Provider } from '@/features/care/domain/types';
import { formatAppointmentReference } from '@/features/appointments/domain/reference';
import { formatAppointmentDateTime } from '@/features/appointments/localization/format-appointment-time';
import { formatTimeZoneName } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { triggerHaptic } from '@/services/haptics/haptics';
import { useThemedStyles, type AppTheme } from '@/theme';

import { bookingStrings } from '../localization/booking-strings';

export function BookingConfirmationScreen({
  appointment,
  calendar,
  onFindCare,
  onViewAppointments,
  provider,
}: {
  appointment: Appointment;
  /** Offers to add the new visit to the device calendar right away. */
  calendar?: AppointmentCalendar | undefined;
  onFindCare: () => void;
  onViewAppointments: () => void;
  provider: Provider | null;
}) {
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(bookingStrings);
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    void triggerHaptic('success');
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
          <Illustration backdrop={false} size={168} source={stateIllustrations.bookingConfirmed} />
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
          <AppText variant="bodyStrong">
            {formatAppointmentDateTime(appointment, intlLocale)}
          </AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.confirmation.visitMeta(
              appointment.visitMode === 'video'
                ? strings.confirmation.videoVisit
                : strings.confirmation.inPersonVisit,
              formatTimeZoneName(appointment.timezone, locale, appointment.startsAt),
            )}
          </AppText>
          <AppText selectable tone="secondary" variant="caption">
            {strings.confirmation.reference(formatAppointmentReference(appointment.id))}
          </AppText>
          {calendar && (
            <View style={styles.calendar}>
              <AppointmentCalendarSection
                appointmentStatus={appointment.status}
                calendar={calendar}
              />
            </View>
          )}
        </Surface>

        <View style={styles.actions}>
          <Button onPress={onViewAppointments}>{strings.confirmation.viewAppointments}</Button>
          <Button onPress={onFindCare} variant="secondary">
            {strings.confirmation.findAnotherClinician}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      flexGrow: 1,
      gap: theme.spacing.lg,
      justifyContent: 'center',
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    // Sized to the illustration; a fixed 72pt box let the 200pt artwork
    // overflow onto the heading below.
    icon: {
      alignItems: 'center',
      alignSelf: 'center',
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
    calendar: {
      borderTopColor: theme.colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: theme.spacing.xs,
      paddingTop: theme.spacing.md,
    },
    actions: {
      gap: theme.spacing.sm,
    },
  });
}
