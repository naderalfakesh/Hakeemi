import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { profileStrings } from '../localization/profile-strings';

type GuestCardProps = {
  isDemo: boolean;
  isSigningOut: boolean;
  onCreateAccount: () => void;
  onExitDemo?: (() => void) | undefined;
  onSignIn: () => void;
  signOutError: string | undefined;
};

export function GuestCard({
  isDemo,
  isSigningOut,
  onCreateAccount,
  onExitDemo,
  onSignIn,
  signOutError,
}: GuestCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.guestCard} variant="brand">
      <View style={styles.guestIcon}>
        <DecorativeIcon
          color={theme.colors.brand}
          name={isDemo ? 'flask-outline' : 'person-outline'}
          size={30}
        />
      </View>
      <AppText variant="titleMedium">{isDemo ? strings.demoTitle : strings.guestTitle}</AppText>
      <AppText tone="secondary" variant="bodyLarge">
        {isDemo ? strings.demoSubtitle : strings.guestSubtitle}
      </AppText>
      <Button onPress={isDemo ? onCreateAccount : onSignIn}>
        {isDemo ? strings.createAccount : strings.signIn}
      </Button>
      <Button onPress={isDemo ? onSignIn : onCreateAccount} variant="secondary">
        {isDemo ? strings.signIn : strings.createAccount}
      </Button>
      {isDemo && onExitDemo && (
        <>
          {signOutError && <InlineError message={signOutError} />}
          <Button busy={isSigningOut} onPress={onExitDemo} variant="tertiary">
            {strings.exitDemo}
          </Button>
        </>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
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
  });
}
