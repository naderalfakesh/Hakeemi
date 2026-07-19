import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, EmptyState, IconButton, Skeleton, Surface } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

import { ProviderAvatar } from '../components/provider-avatar';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot, Clinic } from '../domain/types';
import { useProviderDetail } from '../hooks/use-provider-detail';
import { formatAvailability, formatFee, formatVisitMode } from '../presentation/formatters';

type ProviderDetailScreenProps = {
  onBack: () => void;
  providerId: string;
  repository?: CareRepository;
};

export function ProviderDetailScreen({
  onBack,
  providerId,
  repository,
}: ProviderDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { retry, state } = useProviderDetail(providerId, repository);

  if (state.status !== 'success') {
    return (
      <ProviderDetailState
        onBack={onBack}
        onRetry={retry}
        providerId={providerId}
        status={state.status}
      />
    );
  }

  const { clinics, provider, slots, specialties } = state.data;
  const specialtyNames = specialties.map((specialty) => specialty.name.en).join(' · ');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton accessibilityLabel="Back to clinicians" onPress={onBack} variant="soft">
            <Ionicons color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>
          <AppText tone="secondary" variant="labelLarge">
            Provider profile
          </AppText>
        </View>

        <View style={styles.identity}>
          <ProviderAvatar name={provider.displayName} providerId={provider.id} size="large" />
          <View style={styles.identityCopy}>
            <AppText accessibilityRole="header" variant="titleLarge">
              {provider.displayName}
            </AppText>
            <AppText tone="brand" variant="bodyStrong">
              {specialtyNames}
            </AppText>
            <AppText tone="secondary" variant="bodyMedium">
              {provider.credentialSummary}
            </AppText>
          </View>
        </View>

        <View style={styles.statRow}>
          {provider.ratingSummary && (
            <Surface style={styles.stat} variant="muted">
              <Ionicons color={theme.colors.warning} name="star" size={18} />
              <AppText variant="bodyStrong">{provider.ratingSummary.average.toFixed(1)}</AppText>
              <AppText tone="secondary" variant="caption">
                {provider.ratingSummary.count} reviews
              </AppText>
            </Surface>
          )}
          <Surface style={styles.stat} variant="muted">
            <Ionicons color={theme.colors.brand} name="wallet-outline" size={18} />
            <AppText variant="bodyStrong">{formatFee(provider.consultationFee)}</AppText>
            <AppText tone="secondary" variant="caption">
              Consultation
            </AppText>
          </Surface>
        </View>

        <AvailabilitySection slots={slots} />

        <DetailSection title="About">
          <AppText tone="secondary" variant="bodyLarge">
            {provider.bio}
          </AppText>
        </DetailSection>

        <DetailSection title="Visit options">
          <InfoRow
            icon="videocam-outline"
            label={provider.visitModes.map(formatVisitMode).join(' · ')}
          />
          <InfoRow icon="language-outline" label={provider.languages.join(' · ')} />
        </DetailSection>

        <DetailSection title="Clinics">
          {clinics.map((clinic) => (
            <ClinicRow clinic={clinic} key={clinic.id} />
          ))}
        </DetailSection>

        <Surface style={styles.disclosure} variant="plain">
          <Ionicons color={theme.colors.textSecondary} name="information-circle" size={20} />
          <AppText tone="secondary" variant="caption">
            This fictional profile demonstrates discovery UX. Booking and live availability arrive
            after the secure Firebase rebuild.
          </AppText>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProviderDetailStateProps = {
  onBack: () => void;
  onRetry: () => void;
  providerId: string;
  status: 'error' | 'loading' | 'not-found';
};

function ProviderDetailState({ onBack, onRetry, providerId, status }: ProviderDetailStateProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <SafeAreaView
        accessibilityLabel="Loading provider profile"
        edges={['top']}
        style={styles.safeArea}
      >
        <View style={styles.loadingContent}>
          <Skeleton height={48} radius="md" width={48} />
          <Skeleton height={88} radius="xl" width={88} />
          <Skeleton height={34} width="74%" />
          <Skeleton height={20} width="48%" />
          <Skeleton height={170} radius="lg" width="100%" />
        </View>
      </SafeAreaView>
    );
  }

  const isMissing = status === 'not-found';
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.stateBack}>
        <IconButton accessibilityLabel="Back to clinicians" onPress={onBack} variant="soft">
          <Ionicons color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={
          isMissing ? (
            <Button onPress={onBack} variant="secondary">
              Browse clinicians
            </Button>
          ) : (
            <Button onPress={onRetry}>Try again</Button>
          )
        }
        description={
          isMissing
            ? `No active fictional provider matches “${providerId}”.`
            : 'Check your connection and retry the profile.'
        }
        icon={
          <Ionicons
            color={isMissing ? theme.colors.brand : theme.colors.danger}
            name={isMissing ? 'person-outline' : 'cloud-offline-outline'}
            size={34}
          />
        }
        title={isMissing ? 'Provider not found' : 'Profile could not be loaded'}
      />
    </SafeAreaView>
  );
}

function AvailabilitySection({ slots }: { slots: readonly AvailabilitySlot[] }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface padding="spacious" variant="brand">
      <AppText tone="brand" variant="caption">
        Demo availability
      </AppText>
      <AppText style={styles.availabilityTitle} variant="titleMedium">
        {slots[0] ? formatAvailability(slots[0]) : 'Contact the clinic'}
      </AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {slots[0]
          ? `${formatVisitMode(slots[0].visitMode)} · Times shown in Gulf Standard Time`
          : 'No fixture slots are currently available.'}
      </AppText>
      {slots.length > 1 && (
        <View style={styles.moreSlots}>
          {slots.slice(1, 3).map((slot) => (
            <AppText key={slot.id} tone="secondary" variant="caption">
              Also available {formatAvailability(slot)}
            </AppText>
          ))}
        </View>
      )}
    </Surface>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <AppText variant="titleSmall">{title}</AppText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.infoRow}>
      <Ionicons color={theme.colors.brand} name={icon} size={20} />
      <AppText variant="bodyMedium">{label}</AppText>
    </View>
  );
}

function ClinicRow({ clinic }: { clinic: Clinic }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.infoRow}>
      <Ionicons color={theme.colors.brand} name="location-outline" size={20} />
      <View style={styles.clinicCopy}>
        <AppText variant="bodyStrong">{clinic.name.en}</AppText>
        <AppText tone="secondary" variant="caption">
          {clinic.address.en}
        </AppText>
      </View>
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
      paddingTop: theme.spacing.md,
      width: '100%',
    },
    topBar: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    identity: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    identityCopy: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    statRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    stat: {
      alignItems: 'flex-start',
      flex: 1,
      gap: theme.spacing.xxs,
    },
    availabilityTitle: {
      marginBottom: theme.spacing.xxs,
      marginTop: theme.spacing.sm,
    },
    moreSlots: {
      gap: theme.spacing.xxs,
      marginTop: theme.spacing.md,
    },
    section: {
      gap: theme.spacing.sm,
    },
    sectionContent: {
      gap: theme.spacing.sm,
    },
    infoRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    clinicCopy: {
      flex: 1,
    },
    disclosure: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    loadingContent: {
      alignSelf: 'center',
      gap: theme.spacing.md,
      maxWidth: theme.sizes.contentMaxWidth,
      padding: theme.spacing.lg,
      width: '100%',
    },
    stateBack: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
  });
}
