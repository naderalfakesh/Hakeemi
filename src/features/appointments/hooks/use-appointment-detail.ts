import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import type { AppDataScope } from '@/services/query/data-scope';

import { appointmentQueryKeys } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';

export function useAppointmentDetail(
  appointmentId: string,
  {
    accountId = null,
    queryScope = 'account',
    repository = appointmentRepository,
  }: {
    accountId?: string | null | undefined;
    queryScope?: AppDataScope | undefined;
    repository?: AppointmentRepository | undefined;
  } = {},
) {
  return useQuery({
    enabled: queryScope === 'demo' || accountId !== null,
    queryKey: appointmentQueryKeys.detail(appointmentId, queryScope, accountId),
    queryFn: () => repository.getAppointment(appointmentId),
  });
}
