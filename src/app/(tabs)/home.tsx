import { router } from 'expo-router';

import {
  selectAppointments,
  useAppointments,
} from '@/features/appointments/hooks/use-appointments';
import { useAppDataSources } from '@/features/demo/use-app-data-sources';
import { homeStrings } from '@/features/home/localization/home-strings';
import { HomeScreen } from '@/features/home/screens/home-screen';
import { useAppLocale } from '@/localization/locale-provider';
import { useStrings } from '@/localization/use-strings';

export default function HomeRoute() {
  const dataSources = useAppDataSources();
  const { locale } = useAppLocale();
  const strings = useStrings(homeStrings);
  const appointments = useAppointments({
    accountId: dataSources.accountId,
    careRepository: dataSources.careRepository,
    queryScope: dataSources.scope,
    repository: dataSources.appointmentRepository,
  });
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
      onOpenAppointment={(appointmentId) =>
        router.push({ pathname: '/appointments/[appointmentId]', params: { appointmentId } })
      }
      onSelectProvider={(providerId) =>
        router.push({ pathname: '/providers/[providerId]', params: { providerId } })
      }
      onSelectSpecialty={(specialtyId) =>
        router.push({ pathname: '/find-care', params: { specialtyId } })
      }
      queryScope={dataSources.scope}
      repository={dataSources.careRepository}
      {...(__DEV__ ? { onOpenCatalogue: () => router.push('/dev/components') } : {})}
    />
  );
}
