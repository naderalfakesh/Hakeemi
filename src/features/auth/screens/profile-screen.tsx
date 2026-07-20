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
  stateIllustrations,
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
import { isLayoutDirectionPendingRestart } from '@/localization/layout-direction';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { localizeAuthError } from '../localization/auth-error-strings';
import { profileStrings } from '../localization/profile-strings';

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
  const { locale } = useAppLocale();
  const strings = useStrings(profileStrings);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(undefined);

    try {
      await onSignOut();
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
                  {user.emailVerified ? strings.emailVerified : strings.emailVerificationPending}
                </AppText>
              </View>
            </Surface>

            <Surface padding="spacious" style={styles.statusCard} variant="plain">
              <AppText variant="titleSmall">{strings.secureProfileSync}</AppText>
              {profileStatus === 'loading' && (
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.profileLoading}
                </AppText>
              )}
              {profileStatus === 'ready' && (
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.profileReady}
                </AppText>
              )}
              {profileStatus === 'error' && (
                <>
                  <InlineError message={profileError ?? strings.profileErrorFallback} />
                  <Button onPress={() => void onRetryProfile()} variant="secondary">
                    {strings.retryProfileSync}
                  </Button>
                </>
              )}
            </Surface>

            <Surface padding="spacious" style={styles.preferenceCard} variant="plain">
              <View style={styles.preferenceHeading}>
                <AppText variant="titleSmall">{strings.syncedPreferences}</AppText>
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.preferencesSubtitle}
                </AppText>
              </View>

              <PreferenceChoices
                disabled={preferencesStatus !== 'ready'}
                label={strings.appearance}
                onChange={(themePreference) =>
                  onUpdatePreferences({ ...preferences, theme: themePreference })
                }
                options={[
                  { label: strings.appearanceSystem, value: 'system' },
                  { label: strings.appearanceLight, value: 'light' },
                  { label: strings.appearanceDark, value: 'dark' },
                ]}
                value={preferences.theme}
              />

              <PreferenceChoices
                disabled={preferencesStatus !== 'ready'}
                label={strings.preferredLanguage}
                onChange={(preferredLocale) =>
                  onUpdatePreferences({ ...preferences, locale: preferredLocale })
                }
                options={[
                  { label: strings.languageEnglish, value: 'en' },
                  { label: strings.languageArabic, value: 'ar' },
                ]}
                value={preferences.locale}
              />

              {isLayoutDirectionPendingRestart(preferences.locale) && (
                <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
                  {strings.languageRestartHint}
                </AppText>
              )}

              {preferencesStatus === 'loading' && (
                <AppText tone="secondary" variant="caption">
                  {strings.loadingPreferences}
                </AppText>
              )}
              {preferencesStatus === 'saving' && (
                <AppText accessibilityLiveRegion="polite" tone="secondary" variant="caption">
                  {strings.savingPreferences}
                </AppText>
              )}
              {preferencesStatus === 'error' && (
                <>
                  <InlineError message={preferencesError ?? strings.preferencesErrorFallback} />
                  <Button onPress={onRetryPreferences} variant="secondary">
                    {strings.retryPreferences}
                  </Button>
                </>
              )}
            </Surface>

            <Surface padding="spacious" style={styles.notificationCard} variant="brand">
              <View style={styles.notificationHeading}>
                <DecorativeIcon color={theme.colors.brand} name="notifications-outline" size={24} />
                <AppText variant="titleSmall">{strings.appointmentReminders}</AppText>
              </View>
              {notificationStatus === 'registered' && (
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.remindersRegistered}
                </AppText>
              )}
              {notificationStatus === 'denied' && (
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.remindersDenied}
                </AppText>
              )}
              {notificationStatus === 'unavailable' && (
                <AppText tone="secondary" variant="bodyMedium">
                  {strings.remindersUnavailable}
                </AppText>
              )}
              {notificationStatus === 'error' && (
                <InlineError message={notificationError ?? strings.notificationErrorFallback} />
              )}
              {(notificationStatus === 'idle' ||
                notificationStatus === 'denied' ||
                notificationStatus === 'error') && (
                <Button onPress={() => void onEnableNotifications()} variant="secondary">
                  {notificationStatus === 'idle' ? strings.enableReminders : strings.retryReminders}
                </Button>
              )}
              {notificationStatus === 'requesting' && (
                <Button busy onPress={() => undefined} variant="secondary">
                  {strings.enablingReminders}
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
              {strings.signOut}
            </Button>
          </>
        ) : (
          <Surface padding="spacious" style={styles.guestCard} variant="brand">
            <View style={styles.guestIcon}>
              <DecorativeIcon color={theme.colors.brand} name="person-outline" size={30} />
            </View>
            <AppText variant="titleMedium">{strings.guestTitle}</AppText>
            <AppText tone="secondary" variant="bodyLarge">
              {strings.guestSubtitle}
            </AppText>
            <Button onPress={onSignIn}>{strings.signIn}</Button>
            <Button onPress={onCreateAccount} variant="secondary">
              {strings.createAccount}
            </Button>
          </Surface>
        )}

        <AppText style={styles.disclaimer} tone="secondary" variant="caption">
          {strings.disclaimer}
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
  const { locale } = useAppLocale();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.savedProvidersCard} variant="plain">
      <View style={styles.savedProvidersHeading}>
        <View style={styles.savedProvidersTitle}>
          <DecorativeIcon color={theme.colors.brand} name="bookmark-outline" size={22} />
          <AppText variant="titleSmall">{strings.savedCliniciansTitle}</AppText>
        </View>
        <AppText tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansSubtitle}
        </AppText>
      </View>

      {status === 'unavailable' && (
        <AppText tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansUnavailable}
        </AppText>
      )}
      {status === 'loading' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansLoading}
        </AppText>
      )}
      {status === 'saving' && (
        <AppText accessibilityLiveRegion="polite" tone="secondary" variant="bodyMedium">
          {strings.savedCliniciansSaving}
        </AppText>
      )}
      {status === 'error' && (
        <>
          <InlineError message={strings.savedCliniciansError} />
          <Button onPress={onRetry} variant="secondary">
            {strings.retrySavedClinicians}
          </Button>
        </>
      )}
      {status === 'ready' && providers.length === 0 && (
        <EmptyState
          description={strings.savedCliniciansEmptyDescription}
          illustration={stateIllustrations.noSaved}
          title={strings.savedCliniciansEmptyTitle}
        />
      )}
      {status === 'ready' && providers.length > 0 && (
        <View style={styles.savedProvidersList}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.savedProviderRow}>
              <ProviderAvatar name={provider.displayName.en} providerId={provider.id} />
              <Pressable
                accessibilityLabel={strings.savedCliniciansOpen(provider.displayName[locale])}
                accessibilityRole="button"
                disabled={!onOpenProvider}
                onPress={() => onOpenProvider?.(provider.id)}
                style={styles.savedProviderCopy}
              >
                <AppText numberOfLines={1} variant="bodyStrong">
                  {provider.displayName[locale]}
                </AppText>
                <AppText numberOfLines={1} tone="secondary" variant="caption">
                  {provider.credentialSummary[locale]}
                </AppText>
              </Pressable>
              <IconButton
                accessibilityLabel={strings.savedCliniciansRemove(provider.displayName[locale])}
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
      justifyContent: 'center',
      minHeight: theme.sizes.minimumTouchTarget,
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
