import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, InlineError, Surface, TextField } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { createSignUpSchema, type SignUpValues } from '../domain/schemas';
import { localizeAuthError } from '../localization/auth-error-strings';
import { signUpStrings } from '../localization/auth-strings';
import { authValidationStrings } from '../localization/auth-validation-strings';

type SignUpScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
  onSubmit: (values: SignUpValues) => Promise<void>;
};

export function SignUpScreen({ onBack, onSignIn, onSubmit }: SignUpScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { locale } = useAppLocale();
  const strings = useStrings(signUpStrings);
  const validationMessages = useStrings(authValidationStrings);
  const resolver = useMemo(
    () => zodResolver(createSignUpSchema(validationMessages)),
    [validationMessages],
  );
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignUpValues>({
    defaultValues: { confirmPassword: '', displayName: '', email: '', password: '' },
    resolver,
  });

  const submit = handleSubmit(async (values) => {
    setSubmissionError(undefined);

    try {
      await onSubmit(values);
    } catch (error) {
      setSubmissionError(localizeAuthError(error, locale));
    }
  });

  return (
    <AuthScaffold
      eyebrow={strings.eyebrow}
      onBack={onBack}
      subtitle={strings.subtitle}
      title={strings.title}
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
              label={strings.nameLabel}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={strings.namePlaceholder}
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
              label={strings.emailLabel}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={strings.emailPlaceholder}
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
              hint={strings.passwordHint}
              label={strings.passwordLabel}
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
              label={strings.confirmPasswordLabel}
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
          {strings.createAccount}
        </Button>
        <Button disabled={isSubmitting} onPress={onSignIn} variant="tertiary">
          {strings.alreadyHaveAccount}
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
