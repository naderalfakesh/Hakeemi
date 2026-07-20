import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { careRepository } from '@/features/care/data/care-repository';
import type { CareRepository } from '@/features/care/domain/repository';

import { appointmentQueryKeys } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';

export function useAppointments(
  repository: AppointmentRepository = appointmentRepository,
  providerRepository: CareRepository = careRepository,
) {
  return useQuery({
    queryKey: appointmentQueryKeys.list(),
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
