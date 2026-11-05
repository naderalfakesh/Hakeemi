import { router, type Href } from 'expo-router';

import {
  selectAppointments,
  useAppointments,
} from '@/features/appointments/hooks/use-appointments';
import { useAuthSession } from '@/features/auth/context/auth-session-provider';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { homeStrings } from '@/features/home/localization/home-strings';
import { HomeScreen } from '@/features/home/screens/home-screen';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';

export default function HomeRoute() {
  const session = useAuthSession();
  const dataSources = useAppDataSources();
  const { locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  // Shares the Appointments tab's cache, so the card and the list agree.
  const appointments = useAppointments(
    dataSources.appointmentRepository,
    dataSources.careRepository,
    dataSources.scope,
    session.user?.id ?? null,
  );
  const next = appointments.data ? selectAppointments(appointments.data, 'upcoming')[0] : undefined;

  return (
    <HomeScreen
      isDemo={dataSources.isDemo}
      nextVisit={
        next
          ? {
              appointment: next.appointment,
              providerName: next.provider?.displayName[locale] ?? strings.clinicianFallback,
            }
          : null
      }
      onFindCare={() => router.push('/find-care')}
      onOpenAppointment={(appointmentId) => router.push(`/appointments/${appointmentId}` as Href)}
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
      {...(__DEV__ ? { onOpenCatalogue: () => router.push('/dev/components') } : {})}
    />
  );
}
