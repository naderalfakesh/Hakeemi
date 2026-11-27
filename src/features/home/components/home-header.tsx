import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, DecorativeIcon, Surface } from '@/components/ui';
import type { Appointment } from '@/features/appointments/domain/types';
import { NextVisitCard } from '@/features/appointments/components/next-visit-card';
import type { Specialty } from '@/features/care/domain/types';
import { homeStrings } from '@/features/home/localization/home-strings';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

export type HomeNextVisit = {
  appointment: Appointment;
  providerName: string;
};

type HomeHeaderProps = {
  isDemo: boolean;
  nextVisit: HomeNextVisit | null;
  onFindCare: () => void;
  onOpenAppointment: ((appointmentId: string) => void) | undefined;
  onSelectSpecialty: ((specialtyId: string) => void) | undefined;
  specialties: readonly Specialty[];
};

export function HomeHeader({
  isDemo,
  nextVisit,
  onFindCare,
  onOpenAppointment,
  onSelectSpecialty,
  specialties,
}: HomeHeaderProps) {
  const theme = useAppTheme();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const styles = useThemedStyles(createStyles);
  const today = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date());

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <View style={styles.eyebrow}>
          <AppText tone="secondary" variant="labelLarge">
            {today}
          </AppText>
          {isDemo && (
            <View style={styles.demoBadge}>
              <DecorativeIcon color={theme.colors.accent} name="flask-outline" size={14} />
              <AppText variant="labelSmall">{strings.demoBadge}</AppText>
            </View>
          )}
        </View>
        <AppText accessibilityRole="header" variant="display">
          {strings.greeting}
        </AppText>
      </View>

      {nextVisit && onOpenAppointment && (
        <NextVisitCard
          appointment={nextVisit.appointment}
          onPress={() => onOpenAppointment(nextVisit.appointment.id)}
          providerName={nextVisit.providerName}
        />
      )}

      <Pressable
        accessibilityLabel={strings.featureTitle}
        accessibilityRole="button"
        onPress={onFindCare}
        style={({ pressed }) => pressed && styles.featurePressed}
      >
        <Surface padding="compact" style={styles.featureCard} variant="brand">
          <View style={styles.featureIcon}>
            <DecorativeIcon color={theme.colors.brand} name="search" size={22} />
          </View>
          <View style={styles.featureCopy}>
            <AppText variant="titleSmall">{strings.featureTitle}</AppText>
            <AppText numberOfLines={2} tone="secondary" variant="bodyMedium">
              {strings.featureDescription}
            </AppText>
          </View>
          <DecorativeIcon color={theme.colors.textSecondary} name="chevron-forward" size={20} />
        </Surface>
      </Pressable>

      {specialties.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.specialtyRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {specialties.map((specialty) => (
            <Chip
              key={specialty.id}
              label={specialty.name[locale]}
              onPress={() => (onSelectSpecialty ? onSelectSpecialty(specialty.id) : onFindCare())}
              selected={false}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeading}>
        <View>
          <AppText variant="titleMedium">{strings.availableSoon}</AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.featuredClinicians}
          </AppText>
        </View>
        <Button onPress={onFindCare} variant="tertiary">
          {strings.seeAll}
        </Button>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    header: {
      gap: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    eyebrow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      justifyContent: 'space-between',
    },
    demoBadge: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radii.full,
      flexDirection: 'row',
      gap: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },
    featureCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    featureCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    featurePressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sectionHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    specialtyRow: {
      gap: theme.spacing.xs,
    },
  });
}
