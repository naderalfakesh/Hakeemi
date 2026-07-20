import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Chip,
  DecorativeIcon,
  EmptyState,
  IconButton,
  InlineError,
  Surface,
} from '@/components/ui';
import type { Provider } from '@/features/care/domain/types';
import { ProviderAvatar } from '@/features/care/components/provider-avatar';
import type { SavedProvidersStatus } from '@/features/care/hooks/use-saved-providers';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { UserProfile } from '@/features/auth/domain/profile';
import type { AuthUser } from '@/features/auth/domain/types';
import type { NotificationRegistrationStatus } from '@/features/notifications/context/notification-registration-provider';
import type { PreferencesStatus } from '@/features/preferences/context/app-preferences-provider';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useAppTheme, type AppTheme } from '@/theme';

import { toAuthActionError } from '../domain/errors';

type ProfileScreenProps = {
  onCreateAccount: () => void;
  onEnableNotifications: () => Promise<void>;
  onRetryPreferences: () => void;
  onRetryProfile: () => Promise<void>;
  onSignIn: () => void;
  onSignOut: () => Promise<void>;
  onOpenSavedProvider?: ((providerId: string) => void) | undefined;
  onRetrySavedProviders?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: string | null;
  preferencesStatus: PreferencesStatus;
  notificationError: string | null;
  notificationStatus: NotificationRegistrationStatus;
  profile: UserProfile | null;
  profileError: string | null;
  profileStatus: ProfileStatus;
  savedProviders?: readonly Provider[] | undefined;
  savedProvidersStatus?: SavedProvidersStatus | undefined;
  user: AuthUser | null;
};

export function ProfileScreen({
  onCreateAccount,
  onEnableNotifications,
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

            <Surface padding="spacious" style={styles.preferenceCard} variant="plain">
              <View style={styles.preferenceHeading}>
                <AppText variant="titleSmall">Synced app preferences</AppText>
                <AppText tone="secondary" variant="bodyMedium">
                  These non-sensitive choices follow your account across native devices.
                </AppText>
              </View>

              <PreferenceChoices
                disabled={preferencesStatus !== 'ready'}
                label="Appearance"
                onChange={(themePreference) =>
                  onUpdatePreferences({ ...preferences, theme: themePreference })
                }
                options={[
                  { label: 'Use device', value: 'system' },
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]}
                value={preferences.theme}
              />

              <PreferenceChoices
                disabled={preferencesStatus !== 'ready'}
                label="Preferred language"
                onChange={(locale) => onUpdatePreferences({ ...preferences, locale })}
                options={[
                  { label: 'English', value: 'en' },
                  { label: 'العربية', value: 'ar' },
                ]}
                value={preferences.locale}
              />

              {preferencesStatus === 'loading' && (
                <AppText tone="secondary" variant="caption">
                  Loading your preferences…
                </AppText>
              )}
              {preferencesStatus === 'saving' && (
                <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
                  Saving preferences…
                </AppText>
              )}
              {preferencesStatus === 'error' && (
                <>
                  <InlineError
                    message={preferencesError ?? 'Your preferences could not be synchronized.'}
                  />
                  <Button onPress={onRetryPreferences} variant="secondary">
                    Retry preferences
                  </Button>
                </>
              )}
            </Surface>

            <Surface padding="spacious" style={styles.notificationCard} variant="brand">
              <View style={styles.notificationHeading}>
                <DecorativeIcon color={theme.colors.brand} name="notifications-outline" size={24} />
                <AppText variant="titleSmall">Appointment reminders</AppText>
              </View>
              {notificationStatus === 'registered' && (
                <AppText tone="secondary" variant="bodyMedium">
                  Reminders are enabled on this device. You can change permission in system
                  settings.
                </AppText>
              )}
              {notificationStatus === 'denied' && (
                <AppText tone="secondary" variant="bodyMedium">
                  Notifications are off. You can enable them later from system settings.
                </AppText>
              )}
              {notificationStatus === 'unavailable' && (
                <AppText tone="secondary" variant="bodyMedium">
                  Reminders are available in the iOS and Android development builds.
                </AppText>
              )}
              {notificationStatus === 'error' && (
                <InlineError message={notificationError ?? 'Notifications could not be enabled.'} />
              )}
              {(notificationStatus === 'idle' ||
                notificationStatus === 'denied' ||
                notificationStatus === 'error') && (
                <Button onPress={() => void onEnableNotifications()} variant="secondary">
                  {notificationStatus === 'idle' ? 'Enable reminders' : 'Try again'}
                </Button>
              )}
              {notificationStatus === 'requesting' && (
                <Button busy onPress={() => undefined} variant="secondary">
                  Enabling reminders…
                </Button>
              )}
            </Surface>

            <SavedProvidersSection
              onOpenProvider={onOpenSavedProvider}
              onRemoveProvider={onToggleSavedProvider}
              onRetry={onRetrySavedProviders}
              providers={savedProviders}
              status={savedProvidersStatus}
            />

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

function SavedProvidersSection({
  onOpenProvider,
  onRemoveProvider,
  onRetry,
  providers,
  status,
}: {
  onOpenProvider?: ((providerId: string) => void) | undefined;
  onRemoveProvider?: ((providerId: string) => void) | undefined;
  onRetry?: (() => void) | undefined;
  providers: readonly Provider[];
  status: SavedProvidersStatus;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface padding="spacious" style={styles.savedProvidersCard} variant="plain">
      <View style={styles.savedProvidersHeading}>
        <View style={styles.savedProvidersTitle}>
          <DecorativeIcon color={theme.colors.brand} name="bookmark-outline" size={22} />
          <AppText variant="titleSmall">Saved clinicians</AppText>
        </View>
        <AppText tone="secondary" variant="bodyMedium">
          Keep a shortlist for your next appointment.
        </AppText>
      </View>

      {status === 'unavailable' && (
        <AppText tone="secondary" variant="bodyMedium">
          Saving clinicians is available in the iOS and Android development builds.
        </AppText>
      )}
      {status === 'loading' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          Loading your saved clinicians…
        </AppText>
      )}
      {status === 'saving' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          Updating your saved list…
        </AppText>
      )}
      {status === 'error' && (
        <>
          <InlineError message="Your saved clinicians could not be loaded." />
          <Button onPress={onRetry} variant="secondary">
            Retry saved clinicians
          </Button>
        </>
      )}
      {status === 'ready' && providers.length === 0 && (
        <EmptyState
          description="Tap the bookmark on a clinician profile to keep it here."
          icon={<DecorativeIcon color={theme.colors.brand} name="bookmark-outline" size={30} />}
          title="No saved clinicians yet"
        />
      )}
      {status === 'ready' && providers.length > 0 && (
        <View style={styles.savedProvidersList}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.savedProviderRow}>
              <ProviderAvatar name={provider.displayName} providerId={provider.id} />
              <Pressable
                accessibilityLabel={`Open saved clinician ${provider.displayName}`}
                accessibilityRole="button"
                disabled={!onOpenProvider}
                onPress={() => onOpenProvider?.(provider.id)}
                style={styles.savedProviderCopy}
              >
                <AppText numberOfLines={1} variant="bodyStrong">
                  {provider.displayName}
                </AppText>
                <AppText numberOfLines={1} tone="secondary" variant="caption">
                  {provider.credentialSummary}
                </AppText>
              </Pressable>
              <IconButton
                accessibilityLabel={`Remove ${provider.displayName} from saved clinicians`}
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

type PreferenceOption<Value extends string> = {
  label: string;
  value: Value;
};

function PreferenceChoices<Value extends string>({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: Value) => void;
  options: readonly PreferenceOption<Value>[];
  value: Value;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.preferenceGroup}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View accessibilityRole="radiogroup" style={styles.preferenceOptions}>
        {options.map((option) => (
          <Chip
            disabled={disabled}
            key={option.value}
            label={option.label}
            onPress={() => onChange(option.value)}
            selected={option.value === value}
          />
        ))}
      </View>
    </View>
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
    preferenceCard: {
      gap: theme.spacing.lg,
    },
    notificationCard: {
      gap: theme.spacing.md,
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
    },
    notificationHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    preferenceHeading: {
      gap: theme.spacing.xxs,
    },
    preferenceGroup: {
      gap: theme.spacing.sm,
    },
    preferenceOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
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
