import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useThemedStyles, type AppTheme } from '@/theme';

import type { AppointmentFilter } from '../hooks/use-appointments';
import { appointmentsStrings } from '../localization/appointments-strings';

const FILTER_KEYS: readonly AppointmentFilter[] = ['upcoming', 'past', 'cancelled'];

type AppointmentsFilterBarProps = {
  filter: AppointmentFilter;
  onChange: (filter: AppointmentFilter) => void;
};

export function AppointmentsFilterBar({ filter, onChange }: AppointmentsFilterBarProps) {
  const strings = useStrings(appointmentsStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      contentContainerStyle={styles.filterRow}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {FILTER_KEYS.map((candidate) => (
        <Chip
          key={candidate}
          label={strings.filterLabels[candidate]}
          onPress={() => onChange(candidate)}
          selected={candidate === filter}
        />
      ))}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    filterRow: {
      gap: theme.spacing.xs,
      paddingBottom: theme.spacing.xxs,
    },
  });
}
