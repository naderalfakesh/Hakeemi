import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  DecorativeIcon,
  type DecorativeIconName,
  EmptyState,
  IconButton,
  Skeleton,
  stateIllustrations,
  Surface,
} from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import { useAppTheme, type AppTheme } from '@/theme';

import { ProviderAvatar } from '../components/provider-avatar';
import { AvailabilityCalendar } from '../components/availability-calendar';
import type { CareQueryScope } from '../data/query-keys';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot, AvailabilityWindow, Clinic } from '../domain/types';
import { useProviderDetail } from '../hooks/use-provider-detail';
import { providerDetailStrings, reviewCountLabels } from '../localization/care-strings';
import { formatFee, formatVisitMode } from '../presentation/formatters';

type ProviderDetailScreenProps = {
  onBack: () => void;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  onSignInToSave?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  providerId: string;
  queryScope?: CareQueryScope;
  repository?: CareRepository;
  savedProviderStatus?: 'error' | 'loading' | 'ready' | 'saving' | 'unavailable' | undefined;
  isProviderSaved?: boolean;
};

export function ProviderDetailScreen({
  onBack,
  onChooseSlot,
  onSignInToSave,
  onToggleSavedProvider,
  providerId,
  queryScope = 'account',
  repository,
  savedProviderStatus = 'unavailable',
  isProviderSaved = false,
}: ProviderDetailScreenProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
  const strings = useStrings(providerDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { retry, state } = useProviderDetail(providerId, repository, queryScope);

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

  const { availabilityWindow, clinics, provider, slots, specialties } = state.data;
  const specialtyNames = specialties.map((specialty) => specialty.name[locale]).join(' · ');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton accessibilityLabel={strings.backToClinicians} onPress={onBack} variant="soft">
            <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
          </IconButton>
          <AppText tone="secondary" variant="labelLarge">
            {strings.providerProfile}
          </AppText>
          <View style={styles.topBarSpacer} />
          <IconButton
            accessibilityLabel={
              isProviderSaved
                ? strings.removeFromSaved(provider.displayName[locale])
                : strings.save(provider.displayName[locale])
            }
            disabled={savedProviderStatus === 'saving' || savedProviderStatus === 'loading'}
            onPress={() => {
              if (onToggleSavedProvider) {
                onToggleSavedProvider(provider.id);
              } else {
                onSignInToSave?.();
              }
            }}
            variant="soft"
          >
            <DecorativeIcon
              color={theme.colors.brand}
              name={isProviderSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
            />
          </IconButton>
        </View>

        <View style={styles.identity}>
          <ProviderAvatar name={provider.displayName.en} providerId={provider.id} size="large" />
          <View style={styles.identityCopy}>
            <AppText accessibilityRole="header" variant="titleLarge">
              {provider.displayName[locale]}
            </AppText>
            <AppText tone="brand" variant="bodyStrong">
              {specialtyNames}
            </AppText>
            <AppText tone="secondary" variant="bodyMedium">
              {provider.credentialSummary[locale]}
            </AppText>
          </View>
        </View>

        <View style={styles.statRow}>
          {provider.ratingSummary && (
            <Surface style={styles.stat} variant="muted">
              <DecorativeIcon color={theme.colors.warning} name="star" size={18} />
              <AppText variant="bodyStrong">{provider.ratingSummary.average.toFixed(1)}</AppText>
              <AppText tone="secondary" variant="caption">
                {formatLocalizedCount(provider.ratingSummary.count, locale, reviewCountLabels)}
              </AppText>
            </Surface>
          )}
          <Surface style={styles.stat} variant="muted">
            <DecorativeIcon color={theme.colors.brand} name="wallet-outline" size={18} />
            <AppText variant="bodyStrong">{formatFee(provider.consultationFee, locale)}</AppText>
            <AppText tone="secondary" variant="caption">
              {strings.consultation}
            </AppText>
          </Surface>
        </View>

        <AvailabilitySection
          availabilityWindow={availabilityWindow}
          locale={locale}
          onChooseSlot={onChooseSlot}
          slots={slots}
        />

        <DetailSection title={strings.about}>
          <AppText tone="secondary" variant="bodyLarge">
            {provider.bio[locale]}
          </AppText>
        </DetailSection>

        <DetailSection title={strings.visitOptions}>
          <InfoRow
            icon="videocam-outline"
            label={provider.visitModes.map((mode) => formatVisitMode(mode, locale)).join(' · ')}
          />
          <InfoRow
            icon="language-outline"
            label={provider.languages.map((language) => language[locale]).join(' · ')}
          />
        </DetailSection>

        <DetailSection title={strings.clinics}>
          {clinics.map((clinic) => (
            <ClinicRow clinic={clinic} key={clinic.id} locale={locale} />
          ))}
        </DetailSection>

        <Surface style={styles.disclosure} variant="plain">
          <DecorativeIcon color={theme.colors.textSecondary} name="information-circle" size={20} />
          <AppText tone="secondary" variant="caption">
            {strings.disclosure}
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
  const strings = useStrings(providerDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (status === 'loading') {
    return (
      <SafeAreaView
        accessibilityLabel={strings.loadingProfile}
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
        <IconButton accessibilityLabel={strings.backToClinicians} onPress={onBack} variant="soft">
          <DecorativeIcon color={theme.colors.brand} name="arrow-back" size={22} />
        </IconButton>
      </View>
      <EmptyState
        action={
          isMissing ? (
            <Button onPress={onBack} variant="secondary">
              {strings.browseClinicians}
            </Button>
          ) : (
            <Button onPress={onRetry}>{strings.tryAgain}</Button>
          )
        }
        description={isMissing ? strings.notFoundDescription(providerId) : strings.errorDescription}
        illustration={isMissing ? stateIllustrations.noResults : stateIllustrations.offline}
        title={isMissing ? strings.notFoundTitle : strings.errorTitle}
      />
    </SafeAreaView>
  );
}

function AvailabilitySection({
  availabilityWindow,
  locale,
  onChooseSlot,
  slots,
}: {
  availabilityWindow: AvailabilityWindow;
  locale: 'ar' | 'en';
  onChooseSlot: (slot: AvailabilitySlot) => void;
  slots: readonly AvailabilitySlot[];
}) {
  const theme = useAppTheme();
  const strings = useStrings(providerDetailStrings);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface padding="spacious" variant="brand">
      <AppText tone="brand" variant="caption">
        {strings.next14Days}
      </AppText>
      <AppText style={styles.availabilityTitle} variant="titleMedium">
        {strings.availableAppointments}
      </AppText>
      <AppText tone="secondary" variant="bodyMedium">
        {slots.length > 0 ? strings.timezoneNote : strings.noAppointments}
      </AppText>
      <AvailabilityCalendar
        availabilityWindow={availabilityWindow}
        locale={locale}
        onChooseSlot={onChooseSlot}
        slots={slots}
      />
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

function InfoRow({ icon, label }: { icon: DecorativeIconName; label: string }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.infoRow}>
      <DecorativeIcon color={theme.colors.brand} name={icon} size={20} />
      <AppText variant="bodyMedium">{label}</AppText>
    </View>
  );
}

function ClinicRow({ clinic, locale }: { clinic: Clinic; locale: 'ar' | 'en' }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.infoRow}>
      <DecorativeIcon color={theme.colors.brand} name="location-outline" size={20} />
      <View style={styles.clinicCopy}>
        <AppText variant="bodyStrong">{clinic.name[locale]}</AppText>
        <AppText tone="secondary" variant="caption">
          {clinic.address[locale]}
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
    topBarSpacer: {
      flex: 1,
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
