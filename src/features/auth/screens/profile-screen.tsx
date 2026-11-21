import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, InlineError } from '@/components/ui';
import type { Provider } from '@/features/care/domain/types';
import type { SavedProvidersStatus } from '@/features/care/hooks/use-saved-providers';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { UserProfile } from '@/features/auth/domain/profile';
import type { AuthFailureCode, AuthUser } from '@/features/auth/domain/types';
import type {
  NotificationRegistrationError,
  NotificationRegistrationStatus,
} from '@/features/notifications/context/notification-registration-provider';
import type {
  PreferencesError,
  PreferencesStatus,
} from '@/features/preferences/context/app-preferences-provider';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import { GuestCard } from '../components/guest-card';
import { NotificationRemindersCard } from '../components/notification-reminders-card';
import { PreferencesCard } from '../components/preferences-card';
import { ProfileIdentityCard } from '../components/profile-identity-card';
import { ProfileSyncStatusCard } from '../components/profile-sync-status-card';
import { SavedProvidersSection } from '../components/saved-providers-section';
import { localizeAuthError } from '../localization/auth-error-strings';
import { profileStrings } from '../localization/profile-strings';

type ProfileScreenProps = {
  /** A demo session has no account, so it gets a way out instead of sign-out. */
  isDemo?: boolean;
  onCreateAccount: () => void;
  onEnableNotifications: () => Promise<void>;
  onExitDemo?: (() => Promise<void>) | undefined;
  onRetryPreferences: () => void;
  onRetryProfile: () => Promise<void>;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
  onOpenSavedProvider?: ((providerId: string) => void) | undefined;
  onRetrySavedProviders?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: PreferencesError | null;
  preferencesStatus: PreferencesStatus;
  notificationError: NotificationRegistrationError | null;
  notificationStatus: NotificationRegistrationStatus;
  profile: UserProfile | null;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
  savedProviders?: readonly Provider[] | undefined;
  savedProvidersStatus?: SavedProvidersStatus | undefined;
  user: AuthUser | null;
};

export function ProfileScreen({
  isDemo = false,
  onCreateAccount,
  onEnableNotifications,
  onExitDemo,
  onRetryPreferences,
  onRetryProfile,
  onSignIn,
  onSignOut,
  onOpenSavedProvider,
  onRetrySavedProviders,
  onToggleSavedProvider,
  onUpdatePreferences,
  preferences,
  preferencesError,
  preferencesStatus,
  notificationError,
  notificationStatus,
  profile,
  profileError,
  profileStatus,
  savedProviders = [],
  savedProvidersStatus = 'unavailable',
  user,
}: ProfileScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppLocale();
  const strings = useStrings(profileStrings);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();

  async function handleSignOut(leave: () => Promise<void> = onSignOut) {
    setIsSigningOut(true);
    setSignOutError(undefined);

    try {
      await leave();
    } catch (error) {
      setSignOutError(localizeAuthError(error, locale));
    } finally {
      setIsSigningOut(false);
    }
  }

  const displayName = profile?.displayName ?? user?.displayName ?? strings.memberFallback;
  const email = profile?.email ?? user?.email;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText tone="secondary" variant="labelLarge">
            {strings.eyebrow}
          </AppText>
          <AppText accessibilityRole="header" variant="display">
            {strings.title}
          </AppText>
        </View>

        {user ? (
          <>
            <ProfileIdentityCard
              displayName={displayName}
              email={email}
              profileStatus={profileStatus}
              user={user}
            />

            {(profileStatus === 'loading' || profileStatus === 'error') && (
              <ProfileSyncStatusCard
                onRetryProfile={onRetryProfile}
                profileError={profileError}
                profileStatus={profileStatus}
              />
            )}

            <PreferencesCard
              onRetryPreferences={onRetryPreferences}
              onUpdatePreferences={onUpdatePreferences}
              preferences={preferences}
              preferencesError={preferencesError}
              preferencesStatus={preferencesStatus}
              subtitle={strings.preferencesSubtitle}
            />

            <NotificationRemindersCard
              notificationError={notificationError}
              notificationStatus={notificationStatus}
              onEnableNotifications={onEnableNotifications}
            />

            <SavedProvidersSection
              onOpenProvider={onOpenSavedProvider}
              onRemoveProvider={onToggleSavedProvider}
              onRetry={onRetrySavedProviders}
              providers={savedProviders}
              status={savedProvidersStatus}
            />

            {signOutError && <InlineError message={signOutError} />}
            <Button busy={isSigningOut} onPress={() => void handleSignOut()} variant="secondary">
              {strings.signOut}
            </Button>
          </>
        ) : (
          <>
            <GuestCard
              isDemo={isDemo}
              isSigningOut={isSigningOut}
              onCreateAccount={onCreateAccount}
              onExitDemo={onExitDemo ? () => void handleSignOut(onExitDemo) : undefined}
              onSignIn={onSignIn}
              signOutError={signOutError}
            />

            <PreferencesCard
              onRetryPreferences={onRetryPreferences}
              onUpdatePreferences={onUpdatePreferences}
              preferences={preferences}
              preferencesError={preferencesError}
              preferencesStatus={preferencesStatus}
              subtitle={strings.preferencesLocalSubtitle}
            />

            {isDemo && savedProvidersStatus !== 'unavailable' && (
              <SavedProvidersSection
                onOpenProvider={onOpenSavedProvider}
                onRemoveProvider={onToggleSavedProvider}
                onRetry={onRetrySavedProviders}
                providers={savedProviders}
                status={savedProvidersStatus}
              />
            )}
          </>
        )}

        <AppText style={styles.disclaimer} tone="secondary" variant="caption">
          {strings.disclaimer}
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.canvas,
      flex: 1,
    },
    content: {
      alignSelf: 'center',
      gap: theme.spacing.lg,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      width: '100%',
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    disclaimer: {
      textAlign: 'center',
    },
  });
}
