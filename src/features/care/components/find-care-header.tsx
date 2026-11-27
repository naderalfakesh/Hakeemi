import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Skeleton, StaleDataNotice, TextField } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Specialty } from '../domain/types';
import { clinicianCountLabels, findCareStrings } from '../localization/care-strings';
import { SpecialtyFilter } from './specialty-filter';

type FindCareHeaderProps = {
  isUpdatingSearch: boolean;
  lastUpdatedAt: number | null;
  onQueryChange: (query: string) => void;
  onSpecialtyChange: (specialtyId: string | null) => void;
  providerCount: number | null;
  query: string;
  selectedSpecialtyId: string | null;
  specialties: readonly Specialty[] | null;
  staleReason: 'offline' | 'refresh-failed' | null;
};

export function FindCareHeader({
  isUpdatingSearch,
  lastUpdatedAt,
  onQueryChange,
  onSpecialtyChange,
  providerCount,
  query,
  selectedSpecialtyId,
  specialties,
  staleReason,
}: FindCareHeaderProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(findCareStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.heading}>
        <AppText accessibilityRole="header" variant="display">
          {strings.title}
        </AppText>
        <AppText tone="secondary" variant="bodyLarge">
          {strings.subtitle}
        </AppText>
      </View>

      <TextField
        accessibilityLabel={strings.searchAccessibilityLabel}
        autoCapitalize="none"
        label={strings.searchLabel}
        labelHidden
        onChangeText={onQueryChange}
        placeholder={strings.searchPlaceholder}
        returnKeyType="search"
        value={query}
      />

      {specialties ? (
        <SpecialtyFilter
          onChange={onSpecialtyChange}
          selectedId={selectedSpecialtyId}
          specialties={specialties}
        />
      ) : (
        <View style={styles.loadingFilters}>
          <Skeleton height={44} width={72} />
          <Skeleton height={44} width={132} />
          <Skeleton height={44} width={104} />
        </View>
      )}

      {providerCount !== null && staleReason && (
        <StaleDataNotice reason={staleReason} updatedAt={lastUpdatedAt} />
      )}

      {providerCount !== null && (providerCount > 0 || isUpdatingSearch) && (
        <View style={styles.resultsMeta}>
          {providerCount > 0 && (
            <AppText tone="secondary" variant="caption">
              {formatLocalizedCount(providerCount, locale, clinicianCountLabels)}
            </AppText>
          )}
          {isUpdatingSearch && (
            <ActivityIndicator
              accessibilityLabel={strings.loadingClinicians}
              color={theme.colors.brand}
              size="small"
            />
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    header: {
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    heading: {
      gap: theme.spacing.xxs,
    },
    loadingFilters: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      overflow: 'hidden',
    },
    resultsMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  });
}
