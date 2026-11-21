import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, stateIllustrations } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { findCareStrings } from '../localization/care-strings';
import { ProviderCardSkeleton } from './provider-card-skeleton';

type FindCareResultsStateProps = {
  hasFilters: boolean;
  onClear: () => void;
  onRetry: () => void;
  status: 'error' | 'loading' | 'success';
};

export function FindCareResultsState({
  hasFilters,
  onClear,
  onRetry,
  status,
}: FindCareResultsStateProps) {
  const strings = useStrings(findCareStrings);
  const styles = useThemedStyles(createStyles);

  if (status === 'loading') {
    return (
      <View accessibilityLabel={strings.loadingClinicians} style={styles.loadingCards}>
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
        <ProviderCardSkeleton />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        action={<Button onPress={onRetry}>{strings.tryAgain}</Button>}
        description={strings.errorDescription}
        illustration={stateIllustrations.offline}
        title={strings.errorTitle}
      />
    );
  }

  return (
    <EmptyState
      action={
        hasFilters ? (
          <Button onPress={onClear} variant="secondary">
            {strings.clearFilters}
          </Button>
        ) : undefined
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
  });
}
