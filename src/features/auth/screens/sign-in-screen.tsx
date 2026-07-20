import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, InlineError, Surface, TextField } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { createSignInSchema, type SignInValues } from '../domain/schemas';
import { localizeAuthError } from '../localization/auth-error-strings';
import { signInStrings } from '../localization/auth-strings';
import { authValidationStrings } from '../localization/auth-validation-strings';
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
  const { locale } = useAppLocale();
  const strings = useStrings(signInStrings);
  const validationMessages = useStrings(authValidationStrings);
  const resolver = useMemo(
    () => zodResolver(createSignInSchema(validationMessages)),
    [validationMessages],
  );
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignInValues>({
    defaultValues: { email: '', password: '' },
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
              autoComplete="current-password"
              error={fieldState.error?.message}
              label={strings.passwordLabel}
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
          {strings.signIn}
        </Button>
        <Button disabled={isSubmitting} onPress={onForgotPassword} variant="tertiary">
          {strings.forgotPassword}
        </Button>
      </Surface>

      <View style={styles.secondaryActions}>
        <Button disabled={isSubmitting} onPress={onCreateAccount} variant="secondary">
          {strings.createAccount}
        </Button>
        <Button disabled={isSubmitting} onPress={onContinueAsGuest} variant="tertiary">
          {strings.continueAsGuest}
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
