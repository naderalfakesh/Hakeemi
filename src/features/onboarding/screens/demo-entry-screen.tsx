import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { onboardingStrings } from '../localization/onboarding-strings';

type DemoEntryScreenProps = {
  onContinue: () => void;
  onSignIn: () => void;
};

export function DemoEntryScreen({ onContinue, onSignIn }: DemoEntryScreenProps) {
  const theme = useAppTheme();
  const strings = useStrings(onboardingStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.brandMark}>
            <DecorativeIcon color={theme.colors.textInverse} name="pulse" size={22} />
          </View>
          <AppText variant="titleSmall">{strings.brandWordmark}</AppText>
          <AppText style={styles.rebuildLabel} tone="secondary" variant="caption">
            {strings.rebuiltIn}
          </AppText>
        </View>

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.preview}
        >
          <View style={styles.ambientOrb} />
          <View style={styles.previewCopy}>
            <AppText tone="secondary" variant="caption">
              {strings.earliestVisit}
            </AppText>
            <AppText variant="display">09:30</AppText>
            <AppText tone="secondary" variant="bodyMedium">
              {strings.previewSchedule}
            </AppText>
          </View>
          <Surface padding="compact" style={styles.providerCard} variant="raised">
            <View style={styles.providerAvatar}>
              <DecorativeIcon color={theme.colors.brand} name="person" size={24} />
            </View>
            <View style={styles.providerCopy}>
              <AppText variant="bodyStrong">{strings.familyMedicine}</AppText>
              <AppText tone="secondary" variant="caption">
                {strings.nextAvailableAppointment}
              </AppText>
            </View>
            <DecorativeIcon color={theme.colors.brand} name="arrow-forward" size={20} />
          </Surface>
        </View>

        <View style={styles.message}>
          <AppText accessibilityRole="header" variant="display">
            {strings.headline}
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            {strings.subheadline}
          </AppText>
        </View>

        <View style={styles.proofList}>
          <ProofPoint label={strings.proofAvailability} />
          <ProofPoint label={strings.proofSteps} />
        </View>

        <View style={styles.actions}>
          <Button accessibilityLabel={strings.exploreDemoAccessibilityLabel} onPress={onContinue}>
            {strings.exploreDemo}
          </Button>
          <Button onPress={onSignIn} variant="secondary">
            {strings.signIn}
          </Button>
          <AppText style={styles.disclaimer} tone="secondary" variant="caption">
            {strings.disclaimer}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProofPoint({ label }: { label: string }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.proofPoint}>
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.proofIcon}>
        <DecorativeIcon color={theme.colors.brand} name="checkmark" size={16} />
      </View>
      <AppText variant="bodyStrong">{label}</AppText>
    </View>
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
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      width: '100%',
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: theme.sizes.minimumTouchTarget,
    },
    brandMark: {
      alignItems: 'center',
      backgroundColor: theme.colors.brand,
      borderRadius: theme.radii.sm,
      height: 40,
      justifyContent: 'center',
      marginEnd: theme.spacing.sm,
      transform: [{ rotate: '-5deg' }],
      width: 40,
    },
    rebuildLabel: {
      marginStart: 'auto',
    },
    preview: {
      backgroundColor: theme.colors.surfaceBrand,
      borderRadius: theme.radii.xl,
      height: 250,
      marginTop: theme.spacing.xl,
      overflow: 'hidden',
      padding: theme.spacing.lg,
    },
    ambientOrb: {
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      end: -60,
      height: 210,
      position: 'absolute',
      top: -72,
      width: 210,
    },
    previewCopy: {
      gap: theme.spacing.xxs,
    },
    providerCard: {
      alignItems: 'center',
      bottom: theme.spacing.lg,
      end: theme.spacing.lg,
      flexDirection: 'row',
      position: 'absolute',
      start: theme.spacing.lg,
    },
    providerAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.md,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    providerCopy: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    message: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xl,
    },
    proofList: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    proofPoint: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    proofIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.sm,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    actions: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    disclaimer: {
      alignSelf: 'center',
      maxWidth: 480,
      textAlign: 'center',
    },
  });
}
