import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, InlineError, Surface, TextField } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { toAuthActionError } from '../domain/errors';
import { signInSchema, type SignInValues } from '../domain/schemas';
import { AuthScaffold } from '../components/auth-scaffold';

type SignInScreenProps = {
  onBack: () => void;
  onContinueAsGuest: () => void;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  onSubmit: (values: SignInValues) => Promise<void>;
};

export function SignInScreen({
  onBack,
  onContinueAsGuest,
  onCreateAccount,
  onForgotPassword,
  onSubmit,
}: SignInScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignInValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(signInSchema),
  });

  const submit = handleSubmit(async (values) => {
    setSubmissionError(undefined);

    try {
      await onSubmit(values);
    } catch (error) {
      setSubmissionError(toAuthActionError(error).message);
    }
  });

  return (
    <AuthScaffold
      eyebrow="SECURE ACCOUNT"
      onBack={onBack}
      subtitle="Restore appointments and preferences across your devices."
      title="Welcome back"
    >
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
              placeholder="you@example.com"
              textContentType="emailAddress"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              autoComplete="current-password"
              error={fieldState.error?.message}
              label="Password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              onSubmitEditing={() => void submit()}
              returnKeyType="go"
              secureTextEntry
              textContentType="password"
              value={field.value}
            />
          )}
        />

        {submissionError && <InlineError message={submissionError} />}

        <Button busy={isSubmitting} onPress={() => void submit()}>
          Sign in
        </Button>
        <Button disabled={isSubmitting} onPress={onForgotPassword} variant="tertiary">
          Forgot password?
        </Button>
      </Surface>

      <View style={styles.secondaryActions}>
        <Button disabled={isSubmitting} onPress={onCreateAccount} variant="secondary">
          Create an account
        </Button>
        <Button disabled={isSubmitting} onPress={onContinueAsGuest} variant="tertiary">
          Continue as guest
        </Button>
      </View>
    </AuthScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    form: {
      gap: theme.spacing.md,
    },
    secondaryActions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
  });
}
