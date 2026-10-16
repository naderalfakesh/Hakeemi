import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';

import { appointmentQueryKeys, type AppointmentQueryScope } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';

export function useAppointmentDetail(
  appointmentId: string,
  repository: AppointmentRepository = appointmentRepository,
  queryScope: AppointmentQueryScope = 'account',
  accountId: string | null = null,
) {
  return useQuery({
    // Account appointments need a signed-in account.
    enabled: queryScope === 'demo' || accountId !== null,
    queryKey: appointmentQueryKeys.detail(appointmentId, queryScope, accountId),
    queryFn: () => repository.getAppointment(appointmentId),
  });
}
