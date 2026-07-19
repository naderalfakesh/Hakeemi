import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type DemoEntryScreenProps = {
  onContinue: () => void;
};

export function DemoEntryScreen({ onContinue }: DemoEntryScreenProps) {
  const theme = useAppTheme();
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
            <Ionicons color={theme.colors.textInverse} name="pulse" size={22} />
          </View>
          <AppText variant="titleSmall">Hakeemi</AppText>
          <AppText style={styles.rebuildLabel} tone="secondary" variant="caption">
            Rebuilt in 2026
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
              Earliest visit
            </AppText>
            <AppText variant="display">09:30</AppText>
            <AppText tone="secondary" variant="bodyMedium">
              Tuesday · Video visit
            </AppText>
          </View>
          <Surface padding="compact" style={styles.providerCard} variant="raised">
            <View style={styles.providerAvatar}>
              <Ionicons color={theme.colors.brand} name="person" size={24} />
            </View>
            <View style={styles.providerCopy}>
              <AppText variant="bodyStrong">Family medicine</AppText>
              <AppText tone="secondary" variant="caption">
                Next available appointment
              </AppText>
            </View>
            <Ionicons color={theme.colors.brand} name="arrow-forward" size={20} />
          </Surface>
        </View>

        <View style={styles.message}>
          <AppText accessibilityRole="header" variant="display">
            Care, without the runaround.
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            Browse a fictional care network, compare availability, and follow a calm booking
            experience built to show modern React Native product engineering.
          </AppText>
        </View>

        <View style={styles.proofList}>
          <ProofPoint label="See useful availability before opening a profile" />
          <ProofPoint label="Understand every step before confirming a visit" />
        </View>

        <View style={styles.actions}>
          <Button accessibilityLabel="Explore the Hakeemi portfolio demo" onPress={onContinue}>
            Explore the demo
          </Button>
          <AppText style={styles.disclaimer} tone="secondary" variant="caption">
            Portfolio demonstration only. No real clinicians, medical services, or patient data.
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
        <Ionicons color={theme.colors.brand} name="checkmark" size={16} />
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
      height: 210,
      position: 'absolute',
      right: -60,
      top: -72,
      width: 210,
    },
    previewCopy: {
      gap: theme.spacing.xxs,
    },
    providerCard: {
      alignItems: 'center',
      bottom: theme.spacing.lg,
      flexDirection: 'row',
      left: theme.spacing.lg,
      position: 'absolute',
      right: theme.spacing.lg,
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
