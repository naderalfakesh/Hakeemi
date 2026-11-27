import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, DecorativeIcon, Surface } from '@/components/ui';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';
import type { AppDataScope } from '@/services/query/data-scope';
import { useAppTheme, useThemedStyles, type AppTheme } from '@/theme';

import { AvailabilitySection } from '../components/availability-section';
import { ClinicRow } from '../components/clinic-row';
import { DetailSection } from '../components/detail-section';
import { InfoRow } from '../components/info-row';
import { ProviderBookingFooter } from '../components/provider-booking-footer';
import { ProviderDetailHeader } from '../components/provider-detail-header';
import { ProviderDetailState } from '../components/provider-detail-state';
import type { CareRepository } from '../domain/repository';
import type { AvailabilitySlot } from '../domain/types';
import { useProviderDetail } from '../hooks/use-provider-detail';
import { providerDetailStrings } from '../localization/care-strings';
import { formatVisitMode } from '../presentation/formatters';

type ProviderDetailScreenProps = {
  isProviderSaved?: boolean;
  onBack: () => void;
  onChooseSlot: (slot: AvailabilitySlot) => void;
  onSignInToSave?: (() => void) | undefined;
  onToggleSavedProvider?: ((providerId: string) => void) | undefined;
  providerId: string;
  queryScope?: AppDataScope;
  repository?: CareRepository;
  savedProviderStatus?: 'error' | 'loading' | 'ready' | 'saving' | 'unavailable' | undefined;
};

export function ProviderDetailScreen({
  isProviderSaved = false,
  onBack,
  onChooseSlot,
  onSignInToSave,
  onToggleSavedProvider,
  providerId,
  queryScope = 'account',
  repository,
  savedProviderStatus = 'unavailable',
}: ProviderDetailScreenProps) {
  const theme = useAppTheme();
  const { locale } = useAppLocale();
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProviderDetailHeader
          isProviderSaved={isProviderSaved}
          onBack={onBack}
          onSignInToSave={onSignInToSave}
          onToggleSavedProvider={onToggleSavedProvider}
          provider={provider}
          savedProviderStatus={savedProviderStatus}
          specialties={specialties}
        />

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
        <ProviderBookingFooter
          clinics={clinics}
          onChooseSlot={onChooseSlot}
          selectedSlot={selectedSlot}
        />
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
    flexText: {
      flex: 1,
    },
    disclosure: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  });
}
