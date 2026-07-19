import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { UserProfile } from '@/features/auth/domain/profile';
import type { AuthUser } from '@/features/auth/domain/types';
import { useAppTheme, type AppTheme } from '@/theme';

import { toAuthActionError } from '../domain/errors';

type ProfileScreenProps = {
  onCreateAccount: () => void;
  onRetryProfile: () => Promise<void>;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
  profile: UserProfile | null;
  profileError: string | null;
  profileStatus: ProfileStatus;
  user: AuthUser | null;
};

export function ProfileScreen({
  onCreateAccount,
  onRetryProfile,
  onSignIn,
  onSignOut,
  profile,
  profileError,
  profileStatus,
  user,
}: ProfileScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(undefined);

    try {
      await onSignOut();
    } catch (error) {
      setSignOutError(toAuthActionError(error).message);
    } finally {
      setIsSigningOut(false);
    }
  }

  const displayName = profile?.displayName ?? user?.displayName ?? 'Hakeemi member';
  const email = profile?.email ?? user?.email;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <AppText tone="secondary" variant="labelLarge">
            YOUR ACCOUNT
          </AppText>
          <AppText accessibilityRole="header" variant="display">
            Profile
          </AppText>
        </View>

        {user ? (
          <>
            <Surface padding="spacious" style={styles.identityCard} variant="raised">
              <View style={styles.avatar}>
                <AppText tone="brand" variant="titleMedium">
                  {displayName.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.identityCopy}>
                <AppText variant="titleMedium">{displayName}</AppText>
                {email && (
                  <AppText selectable tone="secondary" variant="bodyMedium">
                    {email}
                  </AppText>
                )}
              </View>
              <View style={styles.verificationRow}>
                <DecorativeIcon
                  color={user.emailVerified ? theme.colors.success : theme.colors.warning}
                  name={user.emailVerified ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                />
                <AppText tone={user.emailVerified ? 'success' : 'secondary'} variant="caption">
                  {user.emailVerified ? 'Email verified' : 'Email verification pending'}
                </AppText>
              </View>
            </Surface>

            <Surface padding="spacious" style={styles.statusCard} variant="plain">
              <AppText variant="titleSmall">Secure profile sync</AppText>
              {profileStatus === 'loading' && (
                <AppText tone="secondary" variant="bodyMedium">
                  Confirming your server-managed profile…
                </AppText>
              )}
              {profileStatus === 'ready' && (
                <AppText tone="secondary" variant="bodyMedium">
                  Your account profile was created through an idempotent Cloud Function; direct
                  client writes are denied by Firestore rules.
                </AppText>
              )}
              {profileStatus === 'error' && (
                <>
                  <InlineError
                    message={profileError ?? 'The secure profile could not be synchronized.'}
                  />
                  <Button onPress={() => void onRetryProfile()} variant="secondary">
                    Retry profile sync
                  </Button>
                </>
              )}
            </Surface>

            {signOutError && <InlineError message={signOutError} />}
            <Button busy={isSigningOut} onPress={() => void handleSignOut()} variant="secondary">
              Sign out
            </Button>
          </>
        ) : (
          <Surface padding="spacious" style={styles.guestCard} variant="brand">
            <View style={styles.guestIcon}>
              <DecorativeIcon color={theme.colors.brand} name="person-outline" size={30} />
            </View>
            <AppText variant="titleMedium">You’re exploring as a guest</AppText>
            <AppText tone="secondary" variant="bodyLarge">
              Sign in to demonstrate secure session restoration, profile ownership, and account
              recovery.
            </AppText>
            <Button onPress={onSignIn}>Sign in</Button>
            <Button onPress={onCreateAccount} variant="secondary">
              Create an account
            </Button>
          </Surface>
        )}

        <AppText style={styles.disclaimer} tone="secondary" variant="caption">
          Fictional portfolio environment. Never enter real patient or medical information.
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
    identityCard: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      height: 60,
      justifyContent: 'center',
      width: 60,
    },
    identityCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
      minWidth: 180,
    },
    verificationRow: {
      alignItems: 'center',
      flexBasis: '100%',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    statusCard: {
      gap: theme.spacing.md,
    },
    guestCard: {
      gap: theme.spacing.md,
    },
    guestIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: theme.radii.md,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    disclaimer: {
      textAlign: 'center',
    },
  });
}
