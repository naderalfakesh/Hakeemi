import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, type DecorativeIconName } from '@/components/ui';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

type InfoRowProps = {
  icon: DecorativeIconName;
  label: string;
};

export function InfoRow({ icon, label }: InfoRowProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.infoRow}>
      <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      <AppText style={styles.flexText} variant="bodyMedium">
        {label}
      </AppText>
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
    flexText: {
      flex: 1,
    },
  });
}
