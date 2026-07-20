import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon, InlineError, Surface, TextField } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { AuthScaffold } from '../components/auth-scaffold';
import { createPasswordResetSchema, type PasswordResetValues } from '../domain/schemas';
import { localizeAuthError } from '../localization/auth-error-strings';
import { forgotPasswordStrings } from '../localization/auth-strings';
import { authValidationStrings } from '../localization/auth-validation-strings';

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
  const { locale } = useAppLocale();
  const strings = useStrings(forgotPasswordStrings);
  const validationMessages = useStrings(authValidationStrings);
  const resolver = useMemo(
    () => zodResolver(createPasswordResetSchema(validationMessages)),
    [validationMessages],
  );
  const [submissionError, setSubmissionError] = useState<string>();
  const [requestedEmail, setRequestedEmail] = useState<string>();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<PasswordResetValues>({
    defaultValues: { email: '' },
    resolver,
  });

  const submit = handleSubmit(async (values) => {
    setSubmissionError(undefined);

    try {
      await onSubmit(values);
      setRequestedEmail(values.email);
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
      {requestedEmail ? (
        <Surface padding="spacious" style={styles.success} variant="brand">
          <View style={styles.successIcon}>
            <DecorativeIcon color={theme.colors.success} name="mail-outline" size={28} />
          </View>
          <AppText accessibilityRole="header" variant="titleMedium">
            {strings.checkInbox}
          </AppText>
          <AppText tone="secondary" variant="bodyMedium">
            {strings.resetSent(requestedEmail)}
          </AppText>
          <Button onPress={onBackToSignIn}>{strings.backToSignIn}</Button>
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
                label={strings.emailLabel}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                onSubmitEditing={() => void submit()}
                placeholder={strings.emailPlaceholder}
                returnKeyType="send"
                textContentType="emailAddress"
                value={field.value}
              />
            )}
          />

          {submissionError && <InlineError message={submissionError} />}

          <Button busy={isSubmitting} onPress={() => void submit()}>
            {strings.sendResetInstructions}
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
