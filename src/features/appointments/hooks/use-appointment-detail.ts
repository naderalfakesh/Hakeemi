import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';

import { appointmentQueryKeys, type AppointmentQueryScope } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';

export function useAppointmentDetail(
  appointmentId: string,
  repository: AppointmentRepository = appointmentRepository,
  queryScope: AppointmentQueryScope = 'account',
) {
  return useQuery({
    queryKey: appointmentQueryKeys.detail(appointmentId, queryScope),
    queryFn: () => repository.getAppointment(appointmentId),
  });
}
