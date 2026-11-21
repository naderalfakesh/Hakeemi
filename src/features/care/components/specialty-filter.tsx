import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { Chip } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import type { Specialty } from '../domain/types';
import { specialtyFilterStrings } from '../localization/care-strings';

type SpecialtyFilterProps = {
  onChange: (specialtyId: string | null) => void;
  selectedId: string | null;
  specialties: readonly Specialty[];
};

export function SpecialtyFilter({ onChange, selectedId, specialties }: SpecialtyFilterProps) {
  const { locale } = useAppLocale();
  const strings = useStrings(specialtyFilterStrings);
  const styles = useThemedStyles(createStyles);
  const renderItem = useCallback<ListRenderItem<Specialty>>(
    ({ item }) => (
      <Chip
        label={item.name[locale]}
        onPress={() => onChange(item.id)}
        selected={selectedId === item.id}
      />
    ),
    [locale, onChange, selectedId],
  );

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.headerChip}>
          <Chip label={strings.all} onPress={() => onChange(null)} selected={selectedId === null} />
        </View>
      }
      ItemSeparatorComponent={ChipSeparator}
      contentContainerStyle={styles.content}
      data={specialties}
      horizontal
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  );
}

function ChipSeparator() {
  const theme = useAppTheme();
  return <View style={{ width: theme.spacing.xs }} />;
}

function keyExtractor(item: Specialty) {
  return item.id;
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      paddingEnd: theme.spacing.lg,
    },
    headerChip: {
      marginEnd: theme.spacing.xs,
    },
  });
}
