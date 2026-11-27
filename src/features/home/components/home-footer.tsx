import { StyleSheet, View } from 'react-native';

import { AppText, Button, DecorativeIcon } from '@/components/ui';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { homeStrings } from '../localization/home-strings';

type HomeFooterProps = {
  onOpenCatalogue?: (() => void) | undefined;
};

export function HomeFooter({ onOpenCatalogue }: HomeFooterProps) {
  const theme = useAppTheme();
  const strings = useStrings(homeStrings);
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.footer}>
      <View style={styles.note}>
        <DecorativeIcon color={theme.colors.textSecondary} name="information-circle" size={20} />
        <AppText style={styles.noteText} tone="secondary" variant="caption">
          {strings.fictionalDataNote}
        </AppText>
      </View>
      {onOpenCatalogue && (
        <Button onPress={onOpenCatalogue} variant="tertiary">
          {strings.openCatalogue}
        </Button>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    footer: {
      gap: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    note: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    noteText: {
      flex: 1,
    },
  });
}
