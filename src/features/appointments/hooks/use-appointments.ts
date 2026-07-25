import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { careRepository } from '@/features/care/data/care-repository';
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
  return items.filter(({ appointment }) => matchesFilter(appointment, filter, now));
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
) {
  return useQuery({
    queryKey: appointmentQueryKeys.list(queryScope),
    queryFn: async () => {
      const appointments = await repository.listAppointments();
      const providers = await Promise.all(
        appointments.map((appointment) => providerRepository.getProvider(appointment.providerId)),
      );

      return appointments.map((appointment, index) => ({
        appointment,
        provider: providers[index] ?? null,
      }));
    },
  });
}
