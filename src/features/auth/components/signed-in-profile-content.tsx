import { Button, InlineError } from '@/components/ui';
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
import { useStrings } from '@/localization/use-strings';

import type { ProfileStatus } from '../context/auth-session-state';
import type { UserProfile } from '../domain/profile';
import type { AuthFailureCode, AuthUser } from '../domain/types';
import { profileStrings } from '../localization/profile-strings';
import { NotificationRemindersCard } from './notification-reminders-card';
import { PreferencesCard } from './preferences-card';
import { ProfileIdentityCard } from './profile-identity-card';
import { ProfileSyncStatusCard } from './profile-sync-status-card';
import { SavedProvidersSection } from './saved-providers-section';

type SignedInProfileContentProps = {
  isSigningOut: boolean;
  notificationError: NotificationRegistrationError | null;
  notificationStatus: NotificationRegistrationStatus;
  onEnableNotifications: () => Promise<void>;
  onOpenSavedProvider?: ((providerId: string) => void) | undefined;
  onRetryPreferences: () => void;
  onRetryProfile: () => Promise<void>;
  onRetrySavedProviders?: (() => void) | undefined;
  onSignOut: () => void;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: PreferencesError | null;
  preferencesStatus: PreferencesStatus;
  profile: UserProfile | null;
  profileError: AuthFailureCode | null;
  profileStatus: ProfileStatus;
  savedProviders: readonly Provider[];
  savedProvidersStatus: SavedProvidersStatus;
  signOutError: string | undefined;
  user: AuthUser;
};

export function SignedInProfileContent({
  isSigningOut,
  notificationError,
  notificationStatus,
  onEnableNotifications,
  onOpenSavedProvider,
  onRetryPreferences,
  onRetryProfile,
  onRetrySavedProviders,
  onSignOut,
  onToggleSavedProvider,
  onUpdatePreferences,
  preferences,
  preferencesError,
  preferencesStatus,
  profile,
  profileError,
  profileStatus,
  savedProviders,
  savedProvidersStatus,
  signOutError,
  user,
}: SignedInProfileContentProps) {
  const strings = useStrings(profileStrings);
  const displayName = profile?.displayName ?? user.displayName ?? strings.memberFallback;
  const email = profile?.email ?? user.email;

  return (
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
      <Button busy={isSigningOut} onPress={onSignOut} variant="secondary">
        {strings.signOut}
      </Button>
    </>
  );
}
