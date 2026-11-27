import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, IconButton, Surface } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Provider, Specialty } from '../domain/types';
import { providerDetailStrings, reviewCountLabels } from '../localization/care-strings';
import { formatFee } from '../presentation/formatters';
import { ProviderAvatar } from './provider-avatar';

type ProviderDetailHeaderProps = {
  isProviderSaved: boolean;
  onBack: () => void;
  onSignInToSave?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  provider: Provider;
  savedProviderStatus: 'error' | 'loading' | 'ready' | 'saving' | 'unavailable';
  specialties: readonly Specialty[];
};

export function ProviderDetailHeader({
  isProviderSaved,
  onBack,
  onSignInToSave,
  onToggleSavedProvider,
  provider,
  savedProviderStatus,
  specialties,
}: ProviderDetailHeaderProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);
  const specialtyNames = specialties.map((specialty) => specialty.name[locale]).join(' · ');

  return (
    <>
      <View style={styles.topBar}>
        <IconButton accessibilityLabel={strings.backToClinicians} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
        <AppText tone="secondary" variant="labelLarge">
          {strings.providerProfile}
        </AppText>
        <View style={styles.topBarSpacer} />
        <IconButton
          accessibilityLabel={
            isProviderSaved
              ? strings.removeFromSaved(provider.displayName[locale])
              : strings.save(provider.displayName[locale])
          }
          disabled={savedProviderStatus === 'saving' || savedProviderStatus === 'loading'}
          onPress={() => {
            if (onToggleSavedProvider) {
              onToggleSavedProvider(provider.id);
            } else {
              onSignInToSave?.();
            }
          }}
          variant="soft"
        >
          <DecorativeIcon
            color={theme.colors.brand}
            name={isProviderSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
          />
        </IconButton>
      </View>

      <View style={styles.identity}>
        <ProviderAvatar name={provider.displayName.en} providerId={provider.id} size="large" />
        <View style={styles.identityCopy}>
          <AppText accessibilityRole="header" variant="titleLarge">
            {provider.displayName[locale]}
          </AppText>
          <AppText tone="brand" variant="bodyStrong">
            {specialtyNames}
          </AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {provider.credentialSummary[locale]}
          </AppText>
        </View>
      </View>

      <View style={styles.statRow}>
        {provider.ratingSummary && (
          <Surface style={styles.stat} variant="muted">
            <DecorativeIcon color={theme.colors.warning} name="star" size={18} />
            <AppText variant="bodyStrong">{provider.ratingSummary.average.toFixed(1)}</AppText>
            <AppText tone="secondary" variant="caption">
              {formatLocalizedCount(provider.ratingSummary.count, locale, reviewCountLabels)}
            </AppText>
          </Surface>
        )}
        <Surface style={styles.stat} variant="muted">
          <DecorativeIcon color={theme.colors.brand} name="wallet-outline" size={18} />
          <AppText variant="bodyStrong">{formatFee(provider.consultationFee, locale)}</AppText>
          <AppText tone="secondary" variant="caption">
            {strings.consultation}
          </AppText>
        </Surface>
      </View>
    </>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    topBarSpacer: {
      flex: 1,
    },
    identity: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    identityCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    statRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    stat: {
      alignItems: 'flex-start',
      flex: 1,
      gap: theme.spacing.xxs,
    },
  });
}
