import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useThemedStyles, type AppTheme } from '@/theme';

type DetailSectionProps = {
  children: ReactNode;
  title: string;
};

export function DetailSection({ children, title }: DetailSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <AppText variant="titleSmall">{title}</AppText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    section: {
      gap: theme.spacing.sm,
    },
    sectionContent: {
      gap: theme.spacing.sm,
    },
  });
}
