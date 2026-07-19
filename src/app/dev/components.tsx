import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Chip,
  EmptyState,
  IconButton,
  InlineError,
  Skeleton,
  Surface,
  TextField,
} from '@/components/ui';
import { environment } from '@/config/env';
import { useAppTheme, type AppTheme } from '@/theme';

export default function ComponentCatalogueScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(true);

  if (!__DEV__ || environment.appEnvironment !== 'development') {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <AppText accessibilityRole="header" variant="display">
            Hakeemi UI
          </AppText>
          <AppText tone="secondary" variant="bodyLarge">
            Development-only states for reviewing the app’s semantic component system.
          </AppText>
        </View>

        <CatalogueSection title="Typography">
          <AppText variant="titleLarge">Find care that fits</AppText>
          <AppText variant="titleMedium">Next appointment</AppText>
          <AppText tone="secondary" variant="bodyLarge">
            Clear, calm language with enough room for larger accessibility text.
          </AppText>
          <AppText tone="brand" variant="labelLarge">
            Earliest availability
          </AppText>
        </CatalogueSection>

        <CatalogueSection title="Actions">
          <Button>Find a clinician</Button>
          <Button variant="secondary">View appointments</Button>
          <Button variant="tertiary">Not now</Button>
          <Button variant="danger">Cancel appointment</Button>
          <Button busy>Finding availability</Button>
          <Button disabled>Unavailable</Button>
          <View style={styles.inlineRow}>
            <IconButton accessibilityLabel="Search" variant="soft">
              <Ionicons color={theme.colors.brand} name="search" size={22} />
            </IconButton>
            <IconButton accessibilityLabel="Close">
              <Ionicons color={theme.colors.textPrimary} name="close" size={24} />
            </IconButton>
          </View>
        </CatalogueSection>

        <CatalogueSection title="Inputs and filters">
          <TextField
            hint="Search by name, specialty, or clinic"
            label="Search"
            onChangeText={setQuery}
            placeholder="Try cardiology"
            value={query}
          />
          <TextField error="Enter a valid email address" label="Email address" value="nader@" />
          <View style={styles.inlineRow}>
            <Chip
              label="Available today"
              onPress={() => setSelected((value) => !value)}
              selected={selected}
            />
            <Chip label="Video visit" />
            <Chip disabled label="Insurance" />
          </View>
        </CatalogueSection>

        <CatalogueSection title="Surfaces and feedback">
          <Surface variant="brand">
            <AppText variant="titleSmall">Tuesday, 9:30 AM</AppText>
            <AppText tone="secondary">Video visit · 30 minutes</AppText>
          </Surface>
          <Surface variant="raised">
            <AppText variant="titleSmall">Dr. Lina Haddad</AppText>
            <AppText tone="secondary">Family medicine</AppText>
          </Surface>
          <InlineError message="Availability changed. Choose another time." />
        </CatalogueSection>

        <CatalogueSection title="Loading and empty states">
          <Surface variant="raised">
            <View style={styles.skeletonRow}>
              <Skeleton height={56} radius="md" width={56} />
              <View style={styles.skeletonCopy}>
                <Skeleton height={18} width="62%" />
                <Skeleton height={14} width="42%" />
              </View>
            </View>
          </Surface>
          <EmptyState
            action={<Button variant="secondary">Browse clinicians</Button>}
            description="Appointments you book will appear here with the details you need."
            icon={<Ionicons color={theme.colors.brand} name="calendar-outline" size={32} />}
            title="No appointments yet"
          />
        </CatalogueSection>
      </ScrollView>
    </SafeAreaView>
  );
}

type CatalogueSectionProps = {
  children: ReactNode;
  title: string;
};

function CatalogueSection({ children, title }: CatalogueSectionProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <AppText variant="labelLarge">{title}</AppText>
      <View style={styles.stack}>{children}</View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    content: {
      alignSelf: 'center',
      gap: theme.spacing.xl,
      maxWidth: theme.sizes.contentMaxWidth,
      paddingBottom: theme.spacing.xxxl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      width: '100%',
    },
    intro: {
      gap: theme.spacing.xs,
    },
    section: {
      gap: theme.spacing.sm,
    },
    stack: {
      gap: theme.spacing.md,
    },
    inlineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    skeletonRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    skeletonCopy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
  });
}
