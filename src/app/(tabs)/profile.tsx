import { router } from 'expo-router';

import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { ProfileScreen } from '@/features/auth/screens/profile-screen';
import { useNotificationRegistration } from '@/features/notifications/context/notification-registration-provider';
import { useAppPreferences } from '@/features/preferences/context/app-preferences-provider';

export default function ProfileRoute() {
  const session = useAuthSession();
  const appPreferences = useAppPreferences();
  const notifications = useNotificationRegistration();

  return (
    <ProfileScreen
      onCreateAccount={() => router.push('/auth/sign-up')}
      onEnableNotifications={notifications.enable}
      onRetryPreferences={appPreferences.retry}
      onRetryProfile={session.retryProfile}
      onSignIn={() => router.push('/auth/sign-in')}
      onSignOut={session.signOut}
      onUpdatePreferences={appPreferences.update}
      notificationError={notifications.error}
      notificationStatus={notifications.status}
      preferences={appPreferences.preferences}
      preferencesError={appPreferences.error}
      preferencesStatus={appPreferences.status}
      profile={session.profile}
      profileError={session.profileError}
      profileStatus={session.profileStatus}
      user={session.user}
    />
  );
}
