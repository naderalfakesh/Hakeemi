import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, type DecorativeIconName } from '@/components/ui';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

type FeatureRowProps = {
  icon: DecorativeIconName;
  text: string;
};

export function FeatureRow({ icon, text }: FeatureRowProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      </View>
      <AppText style={styles.rowText} variant="bodyMedium">
        {text}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    rowIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    rowText: {
      flex: 1,
    },
  });
}
