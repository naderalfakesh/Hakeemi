import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, DecorativeIcon, IconButton, Surface } from '@/components/ui';
import { formatLocalizedCount } from '@/localization/format';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppMotion, useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AvailabilitySection } from '../components/availability-section';
import { ClinicRow } from '../components/clinic-row';
import { DetailSection } from '../components/detail-section';
import { InfoRow } from '../components/info-row';
import { ProviderAvatar } from '../components/provider-avatar';
import { ProviderDetailState } from '../components/provider-detail-state';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot } from '../domain/types';
import { useProviderDetail } from '../hooks/use-provider-detail';
import { providerDetailStrings, reviewCountLabels } from '../localization/care-strings';
import { formatSlotDateSummary, formatSlotTime } from '../presentation/availability-calendar-days';
import { formatFee, formatVisitMode } from '../presentation/formatters';

type ProviderDetailScreenProps = {
  onBack: () => void;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  onSignInToSave?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  providerId: string;
  queryScope?: AppDataScope;
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
  const motion = useAppMotion();
  const { intlLocale, locale } = useAppLocale();
  const strings = useStrings(providerDetailStrings);
  const styles = useThemedStyles(createStyles);
  const { retry, state } = useProviderDetail(providerId, { queryScope, repository });
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

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
  const selectedClinic =
    selectedSlot?.visitMode === 'in_person' && selectedSlot.clinicId
      ? clinics.find((clinic) => clinic.id === selectedSlot.clinicId)
      : undefined;

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
          clinics={clinics}
          locale={locale}
          onChooseSlot={onChooseSlot}
          onSelectedSlotChange={setSelectedSlot}
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
          <AppText style={styles.flexText} tone="secondary" variant="caption">
            {strings.disclosure}
          </AppText>
        </Surface>
      </ScrollView>

      {selectedSlot && (
        <Animated.View
          {...(motion.prefersReducedMotion
            ? {}
            : { entering: FadeIn.duration(motion.duration.normal) })}
          style={styles.stickyFooter}
        >
          <AppText numberOfLines={1} tone="secondary" variant="caption">
            {`${formatSlotDateSummary(selectedSlot, intlLocale)} · ${formatVisitMode(
              selectedSlot.visitMode,
              locale,
            )}${selectedClinic ? ` · ${selectedClinic.name[locale]}` : ''}`}
          </AppText>
          <Button onPress={() => onChooseSlot(selectedSlot)}>
            {strings.continueWithTime(formatSlotTime(selectedSlot, intlLocale))}
          </Button>
        </Animated.View>
      )}
    </SafeAreaView>
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
    flexText: {
      flex: 1,
    },
    disclosure: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    stickyFooter: {
      backgroundColor: theme.colors.canvas,
      borderTopColor: theme.colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
  });
}
