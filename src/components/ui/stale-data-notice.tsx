import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppLocale } from '@/localization/locale-provider';
import { useStrings, type LocalizedStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { AppText } from './app-text';
import { DecorativeIcon } from './decorative-icon';

export type StaleDataReason = 'offline' | 'refresh-failed';

const en = {
  messages: {
    offline: 'Offline — showing saved results.',
    'refresh-failed': 'Latest refresh failed — showing earlier results.',
  } as Record<StaleDataReason, string>,
  updatedAt: (time: string) => `Updated ${time}`,
};

const staleDataStrings: LocalizedStrings<typeof en> = {
  ar: {
    messages: {
      offline: 'أنت غير متصل بالإنترنت — تُعرض نتائج محفوظة.',
      'refresh-failed': 'تعذّر آخر تحديث — تُعرض نتائج سابقة.',
    },
    updatedAt: (time) => `آخر تحديث ${time}`,
  },
  en,
};

type StaleDataNoticeProps = Omit<ViewProps, 'children'> & {
  reason: StaleDataReason;
  updatedAt?: number | null;
};

export function StaleDataNotice({ reason, style, updatedAt, ...props }: StaleDataNoticeProps) {
  const theme = useAppTheme();
  const strings = useStrings(staleDataStrings);
  const { intlLocale } = useAppLocale();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const updatedLabel = updatedAt
    ? strings.updatedAt(
        new Intl.DateTimeFormat(intlLocale, { hour: 'numeric', minute: '2-digit' }).format(
          new Date(updatedAt),
        ),
      )
    : null;

  return (
    <View accessibilityLiveRegion="polite" {...props} style={[styles.container, style]}>
      <DecorativeIcon
        color={theme.colors.textSecondary}
        name={reason === 'offline' ? 'cloud-offline-outline' : 'refresh-circle-outline'}
        size={18}
      />
      <AppText style={styles.message} tone="secondary" variant="caption">
        {updatedLabel ? `${strings.messages[reason]} ${updatedLabel}` : strings.messages[reason]}
      </AppText>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: theme.radii.md,
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    message: {
      flex: 1,
    },
  });
}
