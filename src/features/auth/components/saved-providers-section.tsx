import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  DecorativeIcon,
  EmptyState,
  IconButton,
  InlineError,
  stateIllustrations,
  Surface,
} from '@/components/ui';
import { ProviderAvatar } from '@/features/care/components/provider-avatar';
import type { Provider } from '@/features/care/domain/types';
import type { SavedProvidersStatus } from '@/features/care/hooks/use-saved-providers';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { profileStrings } from '../localization/profile-strings';

type SavedProvidersSectionProps = {
  onOpenProvider?: ((providerId: string) => void) | undefined;
  onRemoveProvider?: ((providerId: string) => void) | undefined;
  onRetry?: (() => void) | undefined;
  providers: readonly Provider[];
  status: SavedProvidersStatus;
};

export function SavedProvidersSection({
  onOpenProvider,
  onRemoveProvider,
  onRetry,
  providers,
  status,
}: SavedProvidersSectionProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.savedProvidersCard} variant="plain">
      <View style={styles.savedProvidersHeading}>
        <View style={styles.savedProvidersTitle}>
          <DecorativeIcon color={theme.colors.brand} name="bookmark-outline" size={22} />
          <AppText style={styles.flexText} variant="titleSmall">
            {strings.savedCliniciansTitle}
          </AppText>
        </View>
        <AppText tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansSubtitle}
        </AppText>
      </View>

      {status === 'unavailable' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansUnavailable}
        </AppText>
      )}
      {status === 'loading' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansLoading}
        </AppText>
      )}
      {status === 'saving' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansSaving}
        </AppText>
      )}
      {status === 'error' && (
        <>
          <InlineError message={strings.savedCliniciansError} />
          <Button onPress={onRetry} variant="secondary">
            {strings.retrySavedClinicians}
          </Button>
        </>
      )}
      {status === 'ready' && providers.length === 0 && (
        <EmptyState
          description={strings.savedCliniciansEmptyDescription}
          illustration={stateIllustrations.noSaved}
          title={strings.savedCliniciansEmptyTitle}
        />
      )}
      {status === 'ready' && providers.length > 0 && (
        <View style={styles.savedProvidersList}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.savedProviderRow}>
              <ProviderAvatar name={provider.displayName.en} providerId={provider.id} />
              <Pressable
                accessibilityLabel={strings.savedCliniciansOpen(provider.displayName[locale])}
                accessibilityRole="button"
                disabled={!onOpenProvider}
                onPress={() => onOpenProvider?.(provider.id)}
                style={styles.savedProviderCopy}
              >
                <AppText numberOfLines={1} variant="bodyStrong">
                  {provider.displayName[locale]}
                </AppText>
                <AppText numberOfLines={2} tone="secondary" variant="caption">
                  {provider.credentialSummary[locale]}
                </AppText>
              </Pressable>
              <IconButton
                accessibilityLabel={strings.savedCliniciansRemove(provider.displayName[locale])}
                onPress={() => onRemoveProvider?.(provider.id)}
                variant="soft"
              >
                <DecorativeIcon color={theme.colors.brand} name="bookmark" size={20} />
              </IconButton>
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    flexText: {
      flex: 1,
    },
    savedProvidersCard: {
      gap: theme.spacing.md,
    },
    savedProvidersHeading: {
      gap: theme.spacing.xxs,
    },
    savedProvidersTitle: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    savedProvidersList: {
      gap: theme.spacing.sm,
    },
    savedProviderRow: {
      alignItems: 'center',
      borderBottomColor: theme.colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: theme.spacing.sm,
      minHeight: theme.sizes.controlHeight,
      paddingBottom: theme.spacing.sm,
    },
    savedProviderCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
      justifyContent: 'center',
      minHeight: theme.sizes.minimumTouchTarget,
    },
  });
}
