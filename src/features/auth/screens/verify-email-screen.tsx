import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { toAuthActionError } from '../domain/errors';

type VerifyEmailScreenProps = {
  email: string;
  onBack: () => void;
  onContinue: () => void;
  onResend: () => Promise<void>;
  onUseAnotherAccount: () => Promise<void>;
};

export function VerifyEmailScreen({
  email,
  onBack,
  onContinue,
  onResend,
  onUseAnotherAccount,
}: VerifyEmailScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [submissionError, setSubmissionError] = useState<string>();

  async function handleResend() {
    setIsResending(true);
    setMessage(undefined);
    setSubmissionError(undefined);

    try {
      await onResend();
      setMessage('A fresh verification email was sent.');
    } catch (error) {
      setSubmissionError(toAuthActionError(error).message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="ONE LAST STEP"
      onBack={onBack}
      subtitle="Verification keeps the demo account recoverable and prevents mistyped addresses."
      title="Verify your email"
    >
      <Surface padding="spacious" style={styles.card} variant="brand">
        <View style={styles.icon}>
          <DecorativeIcon color={theme.colors.brand} name="mail-unread-outline" size={30} />
        </View>
        <AppText variant="bodyLarge">We sent a verification link to:</AppText>
        <AppText selectable variant="bodyStrong">
          {email}
        </AppText>

        {message && (
          <AppText accessibilityLiveRegion="polite" tone="success" variant="bodyMedium">
            {message}
          </AppText>
        )}
        {submissionError && <InlineError message={submissionError} />}

        <Button onPress={onContinue}>Continue to Hakeemi</Button>
        <Button busy={isResending} onPress={() => void handleResend()} variant="secondary">
          Resend email
        </Button>
        <Button
          disabled={isResending}
          onPress={() => void onUseAnotherAccount()}
          variant="tertiary"
        >
          Use another account
        </Button>
      </Surface>
    </AuthScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
    },
    icon: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.md,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
  });
}
