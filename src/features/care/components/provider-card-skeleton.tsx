import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

export function ProviderCardSkeleton() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface style={styles.card} variant="raised">
      <View style={styles.row}>
        <Skeleton height={64} radius="lg" width={64} />
        <View style={styles.copy}>
          <Skeleton height={20} width="64%" />
          <Skeleton height={15} width="42%" />
          <Skeleton height={14} width="52%" />
        </View>
      </View>
      <View style={styles.divider} />
      <Skeleton height={38} width="100%" />
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      padding: theme.spacing.md,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    divider: {
      height: theme.spacing.lg,
    },
  });
}
