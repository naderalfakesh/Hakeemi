export const DEFAULT_DISPLAY_NAME = 'Hakeemi member';

export type AuthIdentity = {
  displayName?: string | undefined;
  email: string;
  photoURL?: string | undefined;
};

export type UserProfileFields = {
  displayName: string;
  email: string;
  locale: 'ar' | 'en';
  photoURL: string | null;
  role: 'patient';
  theme: 'dark' | 'light' | 'system';
};

export function buildUserProfile(identity: AuthIdentity): UserProfileFields {
  return {
    displayName: normalizeOptionalText(identity.displayName) ?? DEFAULT_DISPLAY_NAME,
    email: identity.email.trim().toLowerCase(),
    locale: 'en',
    photoURL: normalizeOptionalText(identity.photoURL),
    role: 'patient',
    theme: 'system',
  };
}

export function reconcileUserProfile(
  current: Partial<UserProfileFields>,
  identity: AuthIdentity,
): UserProfileFields {
  const candidate = buildUserProfile(identity);
  const currentDisplayName = normalizeOptionalText(current.displayName);

  return {
    displayName:
      candidate.displayName === DEFAULT_DISPLAY_NAME && currentDisplayName
        ? currentDisplayName
        : candidate.displayName,
    email: candidate.email,
    locale: current.locale === 'en' || current.locale === 'ar' ? current.locale : candidate.locale,
    photoURL: candidate.photoURL,
    role: 'patient',
    theme:
      current.theme === 'system' || current.theme === 'light' || current.theme === 'dark'
        ? current.theme
        : candidate.theme,
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
