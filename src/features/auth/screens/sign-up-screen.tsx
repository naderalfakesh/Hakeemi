import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, InlineError, Surface, TextField } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { toAuthActionError } from '../domain/errors';
import { signUpSchema, type SignUpValues } from '../domain/schemas';

type SignUpScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
  onSubmit: (values: SignUpValues) => Promise<void>;
};

export function SignUpScreen({ onBack, onSignIn, onSubmit }: SignUpScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignUpValues>({
    defaultValues: { confirmPassword: '', displayName: '', email: '', password: '' },
    resolver: zodResolver(signUpSchema),
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
      eyebrow="YOUR HAKEEMI"
      onBack={onBack}
      subtitle="Use fictional details for this portfolio environment."
      title="Create your account"
    >
      <Surface padding="spacious" style={styles.form} variant="raised">
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="words"
              autoComplete="name"
              error={fieldState.error?.message}
              label="Name"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Demo Patient"
              textContentType="name"
              value={field.value}
            />
          )}
        />
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
              placeholder="demo@example.com"
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
              autoComplete="new-password"
              error={fieldState.error?.message}
              hint="At least 8 characters"
              label="Password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry
              textContentType="newPassword"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              autoComplete="new-password"
              error={fieldState.error?.message}
              label="Confirm password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              onSubmitEditing={() => void submit()}
              returnKeyType="go"
              secureTextEntry
              textContentType="newPassword"
              value={field.value}
            />
          )}
        />

        {submissionError && <InlineError message={submissionError} />}

        <Button busy={isSubmitting} onPress={() => void submit()}>
          Create account
        </Button>
        <Button disabled={isSubmitting} onPress={onSignIn} variant="tertiary">
          I already have an account
        </Button>
      </Surface>
    </AuthScaffold>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    form: {
      gap: theme.spacing.md,
    },
  });
}
