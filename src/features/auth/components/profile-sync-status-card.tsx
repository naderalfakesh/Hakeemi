import { StyleSheet } from 'react-native';

import { AppText, Button, InlineError, Surface } from '@/components/ui';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { AuthFailureCode } from '@/features/auth/domain/types';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { localizeAuthFailure } from '../localization/auth-error-strings';
import { profileStrings } from '../localization/profile-strings';

type ProfileSyncStatusCardProps = {
  onRetryProfile: () => Promise<void>;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
};

export function ProfileSyncStatusCard({
  onRetryProfile,
  profileError,
  profileStatus,
}: ProfileSyncStatusCardProps) {
  const { locale } = useAppLocale();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.statusCard} variant="plain">
      <AppText variant="titleSmall">{strings.secureProfileSync}</AppText>
      {profileStatus === 'loading' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.profileLoading}
        </AppText>
      )}
      {profileStatus === 'error' && (
        <>
          <InlineError
            message={
              profileError
                ? localizeAuthFailure(profileError, locale)
                : strings.profileErrorFallback
            }
          />
          <Button onPress={() => void onRetryProfile()} variant="secondary">
            {strings.retryProfileSync}
          </Button>
        </>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    statusCard: {
      gap: theme.spacing.md,
    },
  });
}
