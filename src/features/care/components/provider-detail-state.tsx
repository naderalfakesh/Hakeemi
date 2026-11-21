import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  DecorativeIcon,
  EmptyState,
  IconButton,
  Skeleton,
  stateIllustrations,
} from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { providerDetailStrings } from '../localization/care-strings';

type ProviderDetailStateProps = {
  onBack: () => void;
  onRetry: () => void;
  providerId: string;
  status: 'error' | 'loading' | 'not-found';
};

export function ProviderDetailState({
  onBack,
  onRetry,
  providerId,
  status,
}: ProviderDetailStateProps) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);

  if (status === 'loading') {
    return (
      <SafeAreaView
        accessibilityLabel={strings.loadingProfile}
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.loadingContent}>
          <Skeleton height={48} radius="md" width={48} />
          <Skeleton height={88} radius="xl" width={88} />
          <Skeleton height={34} width="74%" />
          <Skeleton height={20} width="48%" />
          <Skeleton height={170} radius="lg" width="100%" />
        </View>
      </SafeAreaView>
    );
  }

  const isMissing = status === 'not-found';
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.stateBack}>
        <IconButton accessibilityLabel={strings.backToClinicians} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={
          isMissing ? (
            <Button onPress={onBack} variant="secondary">
              {strings.browseClinicians}
            </Button>
          ) : (
            <Button onPress={onRetry}>{strings.tryAgain}</Button>
          )
        }
        description={isMissing ? strings.notFoundDescription(providerId) : strings.errorDescription}
        illustration={isMissing ? stateIllustrations.noResults : stateIllustrations.offline}
        title={isMissing ? strings.notFoundTitle : strings.errorTitle}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    loadingContent: {
      alignSelf: 'center',
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    stateBack: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
  });
}
