import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { localizeAuthError } from '../localization/auth-error-strings';
import { verifyEmailStrings } from '../localization/auth-strings';

type VerifyEmailScreenProps = {
  email: string;
  onBack: () => void;
  onContinue: () => Promise<void>;
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
  const { locale } = useAppLocale();
  const strings = useStrings(verifyEmailStrings);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string>();
  const [submissionError, setSubmissionError] = useState<string>();

  async function handleResend() {
    setIsResending(true);
    setMessage(undefined);
    setSubmissionError(undefined);

    try {
      await onResend();
      setMessage(strings.resendConfirmation);
    } catch (error) {
      setSubmissionError(localizeAuthError(error, locale));
    } finally {
      setIsResending(false);
    }
  }

  async function handleContinue() {
    setIsChecking(true);
    setMessage(undefined);
    setSubmissionError(undefined);

    try {
      await onContinue();
    } catch (error) {
      setSubmissionError(localizeAuthError(error, locale));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow={strings.eyebrow}
      onBack={onBack}
      subtitle={strings.subtitle}
      title={strings.title}
    >
      <Surface padding="spacious" style={styles.card} variant="brand">
        <View style={styles.icon}>
          <DecorativeIcon color={theme.colors.brand} name="mail-unread-outline" size={30} />
        </View>
        <AppText variant="bodyLarge">{strings.sentTo}</AppText>
        <AppText selectable variant="bodyStrong">
          {email}
        </AppText>

        {message && (
          <AppText accessibilityLiveRegion="polite" tone="success" variant="bodyMedium">
            {message}
          </AppText>
        )}
        {submissionError && <InlineError message={submissionError} />}

        <Button busy={isChecking} onPress={() => void handleContinue()}>
          {strings.continueToHakeemi}
        </Button>
        <Button busy={isResending} onPress={() => void handleResend()} variant="secondary">
          {strings.resendEmail}
        </Button>
        <Button
          disabled={isResending}
          onPress={() => void onUseAnotherAccount()}
          variant="tertiary"
        >
          {strings.useAnotherAccount}
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
