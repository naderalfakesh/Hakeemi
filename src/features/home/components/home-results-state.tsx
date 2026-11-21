import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, InlineError, stateIllustrations, Surface } from '@/components/ui';
import { ProviderCardSkeleton } from '@/features/care/components/provider-card-skeleton';
import { homeStrings } from '@/features/home/localization/home-strings';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

type HomeResultsStateProps = {
  onFindCare: () => void;
  onRetry: () => void;
  status: 'error' | 'loading' | 'success';
};

export function HomeResultsState({ onFindCare, onRetry, status }: HomeResultsStateProps) {
  const strings = useStrings(homeStrings);
  const styles = useThemedStyles(createStyles);

  if (status === 'loading') {
    return (
      <View accessibilityLabel={strings.loadingFeatured} style={styles.loadingCards}>
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <Surface style={styles.errorSurface} variant="plain">
        <InlineError message={strings.errorMessage} />
        <Button onPress={onRetry} variant="secondary">
          {strings.tryAgain}
        </Button>
      </Surface>
    );
  }

  return (
    <EmptyState
      action={
        <Button onPress={onFindCare} variant="secondary">
          {strings.browseAllClinicians}
        </Button>
      }
      description={strings.emptyDescription}
      illustration={stateIllustrations.noResults}
      title={strings.emptyTitle}
    />
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    loadingCards: {
      gap: theme.spacing.sm,
    },
    errorSurface: {
      gap: theme.spacing.md,
    },
  });
}
