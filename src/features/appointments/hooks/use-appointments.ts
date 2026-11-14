import { useQuery, useQueryClient } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { careRepository } from '@/features/care/data/care-repository';
import { careQueryKeys } from '@/features/care/data/query-keys';
import type { CareRepository } from '@/features/care/domain/repository';

import { appointmentQueryKeys, type AppointmentQueryScope } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment } from '../domain/types';

export type AppointmentListItem = {
  appointment: Appointment;
  provider: Awaited<ReturnType<CareRepository['getProvider']>>;
};

export type AppointmentFilter = 'cancelled' | 'past' | 'upcoming';

/** Keep lifecycle grouping in one place so list and home surfaces agree. */
export function selectAppointments(
  items: readonly AppointmentListItem[],
  filter: AppointmentFilter,
  now: Date = new Date(),
) {
  const direction = filter === 'upcoming' ? 1 : -1;

  // Upcoming reads soonest first; history reads most recent first.
  return items
    .filter(({ appointment }) => matchesFilter(appointment, filter, now))
    .sort(
      (left, right) =>
        direction * left.appointment.startsAt.localeCompare(right.appointment.startsAt),
    );
}

function matchesFilter(appointment: Appointment, filter: AppointmentFilter, now: Date) {
  if (filter === 'cancelled') {
    return appointment.status === 'cancelled';
  }

  if (filter === 'upcoming') {
    return appointment.status === 'confirmed' && new Date(appointment.startsAt) >= now;
  }

  return (
    appointment.status === 'completed' ||
    appointment.status === 'no_show' ||
    (appointment.status === 'confirmed' && new Date(appointment.startsAt) < now)
  );
}

export function useAppointments(
  repository: AppointmentRepository = appointmentRepository,
  providerRepository: CareRepository = careRepository,
  queryScope: AppointmentQueryScope = 'account',
  accountId: string | null = null,
) {
  const queryClient = useQueryClient();

  return useQuery({
    // Account appointments need a signed-in account.
    enabled: queryScope === 'demo' || accountId !== null,
    queryKey: appointmentQueryKeys.list(queryScope, accountId),
    queryFn: async () => {
      const appointments = await repository.listAppointments();
      const uniqueProviderIds = [
        ...new Set(appointments.map((appointment) => appointment.providerId)),
      ];
      const resolvedProviders = await Promise.all(
        uniqueProviderIds.map(async (providerId) => {
          const provider = await providerRepository.getProvider(providerId);
          queryClient.setQueryData(careQueryKeys.providerSummary(providerId, queryScope), provider);
          return [providerId, provider] as const;
        }),
      );
      const providersById = new Map(resolvedProviders);

      for (const appointment of appointments) {
        queryClient.setQueryData(
          appointmentQueryKeys.detail(appointment.id, queryScope, accountId),
          appointment,
        );
      }

      return appointments.map((appointment) => ({
        appointment,
        provider: providersById.get(appointment.providerId) ?? null,
      }));
    },
  });
}
