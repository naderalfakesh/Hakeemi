import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface, TextField } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { toAuthActionError } from '../domain/errors';
import { passwordResetSchema, type PasswordResetValues } from '../domain/schemas';

type ForgotPasswordScreenProps = {
  onBack: () => void;
  onBackToSignIn: () => void;
  onSubmit: (values: PasswordResetValues) => Promise<void>;
};

export function ForgotPasswordScreen({
  onBack,
  onBackToSignIn,
  onSubmit,
}: ForgotPasswordScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [submissionError, setSubmissionError] = useState<string>();
  const [requestedEmail, setRequestedEmail] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<PasswordResetValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(passwordResetSchema),
  });

  const submit = handleSubmit(async (values) => {
    setSubmissionError(undefined);

    try {
      await onSubmit(values);
      setRequestedEmail(values.email);
    } catch (error) {
      setSubmissionError(toAuthActionError(error).message);
    }
  });

  return (
    <AuthScaffold
      eyebrow="ACCOUNT RECOVERY"
      onBack={onBack}
      subtitle="We keep the response neutral so an email address cannot be used to discover accounts."
      title="Reset your password"
    >
      {requestedEmail ? (
        <Surface padding="spacious" style={styles.success} variant="brand">
          <View style={styles.successIcon}>
            <DecorativeIcon color={theme.colors.success} name="mail-outline" size={28} />
          </View>
          <AppText accessibilityRole="header" variant="titleMedium">
            Check your inbox
          </AppText>
          <AppText tone="secondary" variant="bodyMedium">
            If an account exists for {requestedEmail}, Firebase has sent password reset
            instructions.
          </AppText>
          <Button onPress={onBackToSignIn}>Back to sign in</Button>
        </Surface>
      ) : (
        <Surface padding="spacious" style={styles.form} variant="raised">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                error={fieldState.error?.message}
                keyboardType="email-address"
                label="Email"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                onSubmitEditing={() => void submit()}
                placeholder="you@example.com"
                returnKeyType="send"
                textContentType="emailAddress"
                value={field.value}
              />
            )}
          />

          {submissionError && <InlineError message={submissionError} />}

          <Button busy={isSubmitting} onPress={() => void submit()}>
            Send reset instructions
          </Button>
        </Surface>
      )}
    </AuthScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    form: {
      gap: theme.spacing.md,
    },
    success: {
      gap: theme.spacing.md,
    },
    successIcon: {
      alignItems: 'center',
      backgroundColor: theme.colors.successSoft,
      borderRadius: theme.radii.md,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
  });
}
