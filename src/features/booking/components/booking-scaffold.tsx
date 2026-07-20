import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, DecorativeIcon, IconButton } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

export function BookingScaffold({
  children,
  onBack,
  step,
  subtitle,
  title,
}: {
  children: ReactNode;
  onBack: () => void;
  step: string;
  subtitle: string;
  title: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton accessibilityLabel="Back" onPress={onBack} variant="soft">
            <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>
          <AppText tone="secondary" variant="labelLarge">
            {step}
          </AppText>
        </View>
        <View style={styles.heading}>
          <AppText accessibilityRole="header" variant="titleLarge">
            {title}
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            {subtitle}
          </AppText>
        </View>
        {children}
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
      gap: theme.spacing.lg,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      width: '100%',
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    heading: {
      gap: theme.spacing.xs,
    },
  });
}
