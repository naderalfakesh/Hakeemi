import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon } from '@/components/ui';
import type { AppLocale } from '@/localization/locale-provider';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Clinic } from '../domain/types';

type ClinicRowProps = {
  clinic: Clinic;
  locale: AppLocale;
};

export function ClinicRow({ clinic, locale }: ClinicRowProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.infoRow}>
      <DecorativeIcon color={theme.colors.brand} name="location-outline" size={20} />
      <View style={styles.clinicCopy}>
        <AppText variant="bodyStrong">{clinic.name[locale]}</AppText>
        <AppText tone="secondary" variant="caption">
          {clinic.address[locale]}
        </AppText>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    infoRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    clinicCopy: {
      flex: 1,
    },
  });
}
