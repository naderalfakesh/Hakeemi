import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import type { AvailabilitySlot, Provider } from '../domain/types';
import { formatAvailability, formatVisitMode } from '../presentation/formatters';
import { ProviderAvatar } from './provider-avatar';

type ProviderCardProps = {
  nextSlot: AvailabilitySlot | null;
  onPress: (providerId: string) => void;
  provider: Provider;
  specialtyName: string;
};

export const ProviderCard = memo(function ProviderCard({
  nextSlot,
  onPress,
  provider,
  specialtyName,
}: ProviderCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onPress(provider.id), [onPress, provider.id]);

  return (
    <Pressable
      accessibilityLabel={`View profile for ${provider.displayName}`}
      accessibilityRole="button"
      android_ripple={{ color: theme.colors.brandSoft }}
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <ProviderAvatar name={provider.displayName} providerId={provider.id} />
        <View style={styles.identity}>
          <AppText numberOfLines={1} variant="titleSmall">
            {provider.displayName}
          </AppText>
          <AppText numberOfLines={1} tone="secondary" variant="bodyMedium">
            {specialtyName}
          </AppText>
          {provider.ratingSummary && (
            <View style={styles.rating}>
              <DecorativeIcon color={theme.colors.warning} name="star" size={15} />
              <AppText variant="caption">
                {provider.ratingSummary.average.toFixed(1)} · {provider.ratingSummary.count} reviews
              </AppText>
            </View>
          )}
        </View>
        <DecorativeIcon color={theme.colors.textSecondary} name="chevron-forward" size={20} />
      </View>

      <View style={styles.divider} />

      {nextSlot ? (
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityIcon}>
            <DecorativeIcon color={theme.colors.brand} name="calendar-outline" size={18} />
          </View>
          <View style={styles.availabilityCopy}>
            <AppText tone="secondary" variant="caption">
              Next available
            </AppText>
            <AppText variant="bodyStrong">{formatAvailability(nextSlot)}</AppText>
          </View>
          <AppText tone="brand" variant="caption">
            {formatVisitMode(nextSlot.visitMode)}
          </AppText>
        </View>
      ) : (
        <AppText tone="secondary" variant="caption">
          Contact the clinic for availability
        </AppText>
      )}
    </Pressable>
  );
});

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      ...theme.shadows.raised,
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.lg,
      overflow: 'hidden',
      padding: theme.spacing.md,
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    identity: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    rating: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xxs,
      marginTop: theme.spacing.xxs,
    },
    divider: {
      backgroundColor: theme.colors.borderSubtle,
      height: StyleSheet.hairlineWidth,
      marginVertical: theme.spacing.md,
    },
    availabilityRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    availabilityIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.sm,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    availabilityCopy: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
  });
}
