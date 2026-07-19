import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme, type AppTheme } from '@/theme';

type PlaceholderScreenProps = {
  description: string;
  title: string;
};

export function PlaceholderScreen({ description, title }: PlaceholderScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typeScale.titleLarge,
      color: theme.colors.textPrimary,
    },
    description: {
      ...theme.typeScale.bodyLarge,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      maxWidth: theme.sizes.contentMaxWidth,
    },
  });
}
