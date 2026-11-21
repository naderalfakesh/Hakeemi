import { StyleSheet, View } from 'react-native';

import { AppText, DecorativeIcon, Surface } from '@/components/ui';
import type { ProfileStatus } from '@/features/auth/context/auth-session-provider';
import type { AuthUser } from '@/features/auth/domain/types';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { profileStrings } from '../localization/profile-strings';

type ProfileIdentityCardProps = {
  displayName: string;
  email: string | null | undefined;
  profileStatus: ProfileStatus;
  user: AuthUser;
};

export function ProfileIdentityCard({
  displayName,
  email,
  profileStatus,
  user,
}: ProfileIdentityCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const strings = useStrings(profileStrings);

  return (
    <Surface padding="spacious" style={styles.identityCard} variant="raised">
      <View style={styles.avatar}>
        <AppText tone="brand" variant="titleMedium">
          {displayName.slice(0, 1).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.identityCopy}>
        <AppText variant="titleMedium">{displayName}</AppText>
        {email && (
          <AppText selectable tone="secondary" variant="bodyMedium">
            {email}
          </AppText>
        )}
      </View>
      <View style={styles.verificationRow}>
        <DecorativeIcon
          color={user.emailVerified ? theme.colors.success : theme.colors.warning}
          name={user.emailVerified ? 'checkmark-circle' : 'alert-circle'}
          size={20}
        />
        <AppText
          style={styles.flexText}
          tone={user.emailVerified ? 'success' : 'secondary'}
          variant="caption"
        >
          {user.emailVerified ? strings.emailVerified : strings.emailVerificationPending}
        </AppText>
      </View>
      {profileStatus === 'ready' && (
        <AppText style={styles.profileReadyCopy} tone="secondary" variant="caption">
          {strings.profileReady}
        </AppText>
      )}
    </Surface>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    identityCard: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.brandSoft,
      borderRadius: theme.radii.full,
      height: 60,
      justifyContent: 'center',
      width: 60,
    },
    identityCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
      minWidth: 180,
    },
    verificationRow: {
      alignItems: 'center',
      flexBasis: '100%',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    profileReadyCopy: {
      flexBasis: '100%',
    },
    flexText: {
      flex: 1,
    },
  });
}
