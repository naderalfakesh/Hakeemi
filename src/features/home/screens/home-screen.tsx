import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type HomeScreenProps = {
  onFindCare: () => void;
  onOpenCatalogue?: () => void;
};

export function HomeScreen({ onFindCare, onOpenCatalogue }: HomeScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText tone="secondary" variant="labelLarge">
            Portfolio demo
          </AppText>
          <AppText accessibilityRole="header" variant="display">
            What would help today?
          </AppText>
        </View>

        <Surface padding="spacious" variant="brand">
          <View style={styles.featureIcon}>
            <Ionicons color={theme.colors.brand} name="search" size={26} />
          </View>
          <AppText style={styles.featureTitle} variant="titleMedium">
            Find the right clinician
          </AppText>
          <AppText style={styles.featureDescription} tone="secondary" variant="bodyLarge">
            Search by specialty and compare the details that matter before choosing.
          </AppText>
          <Button onPress={onFindCare}>Find care</Button>
        </Surface>

        <View style={styles.note}>
          <Ionicons color={theme.colors.textSecondary} name="information-circle" size={20} />
          <AppText tone="secondary" variant="caption">
            Hakeemi uses fictional data while the rebuilt Firebase environment is prepared.
          </AppText>
        </View>

        {onOpenCatalogue && (
          <Button onPress={onOpenCatalogue} variant="tertiary">
            Open component catalogue
          </Button>
        )}
      </ScrollView>
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
      alignSelf: 'center',
      gap: theme.spacing.xl,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      width: '100%',
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    featureTitle: {
      marginTop: theme.spacing.lg,
    },
    featureDescription: {
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.xs,
    },
    note: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
  });
}
