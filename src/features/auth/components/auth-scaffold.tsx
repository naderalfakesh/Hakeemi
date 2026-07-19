import { useMemo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, DecorativeIcon, IconButton } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type AuthScaffoldProps = {
  children: ReactNode;
  eyebrow: string;
  onBack: () => void;
  subtitle: string;
  title: string;
};

export function AuthScaffold({ children, eyebrow, onBack, subtitle, title }: AuthScaffoldProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconButton accessibilityLabel="Go back" onPress={onBack} variant="soft">
            <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>

          <View style={styles.heading}>
            <AppText tone="brand" variant="labelSmall">
              {eyebrow}
            </AppText>
            <AppText accessibilityRole="header" variant="titleLarge">
              {title}
            </AppText>
            <AppText tone="secondary" variant="bodyLarge">
              {subtitle}
            </AppText>
          </View>

          {children}

          <AppText style={styles.disclaimer} tone="secondary" variant="caption">
            Portfolio demonstration only. Do not enter real medical information.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      flexGrow: 1,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      width: '100%',
      maxWidth: 560,
    },
    heading: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
      marginTop: theme.spacing.lg,
    },
    disclaimer: {
      marginTop: 'auto',
      paddingTop: theme.spacing.xl,
      textAlign: 'center',
    },
  });
}
