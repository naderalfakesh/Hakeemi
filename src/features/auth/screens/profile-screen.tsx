import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { UserProfile } from '@/features/auth/domain/profile';
import type { AuthFailureCode, AuthUser } from '@/features/auth/domain/types';
import type { Provider } from '@/features/care/domain/types';
import type { SavedProvidersStatus } from '@/features/care/hooks/use-saved-providers';
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

import { GuestProfileContent } from '../components/guest-profile-content';
import { SignedInProfileContent } from '../components/signed-in-profile-content';
import { localizeAuthError } from '../localization/auth-error-strings';
import { profileStrings } from '../localization/profile-strings';

type ProfileScreenProps = {
  isDemo?: boolean;
  notificationError: NotificationRegistrationError | null;
  notificationStatus: NotificationRegistrationStatus;
  onCreateAccount: () => void;
  onEnableNotifications: () => Promise<void>;
  onExitDemo?: (() => Promise<void>) | undefined;
  onOpenSavedProvider?: ((providerId: string) => void) | undefined;
  onRetryPreferences: () => void;
  onRetryProfile: () => Promise<void>;
  onRetrySavedProviders?: (() => void) | undefined;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: PreferencesError | null;
  preferencesStatus: PreferencesStatus;
  profile: UserProfile | null;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
  savedProviders?: readonly Provider[] | undefined;
  savedProvidersStatus?: SavedProvidersStatus | undefined;
  user: AuthUser | null;
};

export function ProfileScreen({
  isDemo = false,
  notificationError,
  notificationStatus,
  onCreateAccount,
  onEnableNotifications,
  onExitDemo,
  onOpenSavedProvider,
  onRetryPreferences,
  onRetryProfile,
  onRetrySavedProviders,
  onSignIn,
  onSignOut,
  onToggleSavedProvider,
  onUpdatePreferences,
  preferences,
  preferencesError,
  preferencesStatus,
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
          <SignedInProfileContent
            isSigningOut={isSigningOut}
            notificationError={notificationError}
            notificationStatus={notificationStatus}
            onEnableNotifications={onEnableNotifications}
            onOpenSavedProvider={onOpenSavedProvider}
            onRetryPreferences={onRetryPreferences}
            onRetryProfile={onRetryProfile}
            onRetrySavedProviders={onRetrySavedProviders}
            onSignOut={() => void handleSignOut()}
            onToggleSavedProvider={onToggleSavedProvider}
            onUpdatePreferences={onUpdatePreferences}
            preferences={preferences}
            preferencesError={preferencesError}
            preferencesStatus={preferencesStatus}
            profile={profile}
            profileError={profileError}
            profileStatus={profileStatus}
            savedProviders={savedProviders}
            savedProvidersStatus={savedProvidersStatus}
            signOutError={signOutError}
            user={user}
          />
        ) : (
          <GuestProfileContent
            isDemo={isDemo}
            isSigningOut={isSigningOut}
            onCreateAccount={onCreateAccount}
            onExitDemo={onExitDemo ? () => void handleSignOut(onExitDemo) : undefined}
            onOpenSavedProvider={onOpenSavedProvider}
            onRetryPreferences={onRetryPreferences}
            onRetrySavedProviders={onRetrySavedProviders}
            onSignIn={onSignIn}
            onToggleSavedProvider={onToggleSavedProvider}
            onUpdatePreferences={onUpdatePreferences}
            preferences={preferences}
            preferencesError={preferencesError}
            preferencesStatus={preferencesStatus}
            savedProviders={savedProviders}
            savedProvidersStatus={savedProvidersStatus}
            signOutError={signOutError}
          />
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
