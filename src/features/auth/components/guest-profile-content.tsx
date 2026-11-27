import type { Provider } from '@/features/care/domain/types';
import type { SavedProvidersStatus } from '@/features/care/hooks/use-saved-providers';
import type {
  PreferencesError,
  PreferencesStatus,
} from '@/features/preferences/context/app-preferences-provider';
import type { AppPreferences } from '@/features/preferences/domain/preferences';
import { useStrings } from '@/localization/use-strings';

import { profileStrings } from '../localization/profile-strings';
import { GuestCard } from './guest-card';
import { PreferencesCard } from './preferences-card';
import { SavedProvidersSection } from './saved-providers-section';

type GuestProfileContentProps = {
  isDemo: boolean;
  isSigningOut: boolean;
  onCreateAccount: () => void;
  onExitDemo?: (() => void) | undefined;
  onOpenSavedProvider?: ((providerId: string) => void) | undefined;
  onRetryPreferences: () => void;
  onRetrySavedProviders?: (() => void) | undefined;
  onSignIn: () => void;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  onUpdatePreferences: (preferences: AppPreferences) => void;
  preferences: AppPreferences;
  preferencesError: PreferencesError | null;
  preferencesStatus: PreferencesStatus;
  savedProviders: readonly Provider[];
  savedProvidersStatus: SavedProvidersStatus;
  signOutError: string | undefined;
};

export function GuestProfileContent({
  isDemo,
  isSigningOut,
  onCreateAccount,
  onExitDemo,
  onOpenSavedProvider,
  onRetryPreferences,
  onRetrySavedProviders,
  onSignIn,
  onToggleSavedProvider,
  onUpdatePreferences,
  preferences,
  preferencesError,
  preferencesStatus,
  savedProviders,
  savedProvidersStatus,
  signOutError,
}: GuestProfileContentProps) {
  const strings = useStrings(profileStrings);

  return (
    <>
      <GuestCard
        isDemo={isDemo}
        isSigningOut={isSigningOut}
        onCreateAccount={onCreateAccount}
        onExitDemo={onExitDemo}
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
  );
}
