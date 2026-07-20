import { useQuery } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';

import { appointmentQueryKeys } from '../data/query-keys';
import type { AppointmentRepository } from '../domain/repository';

export function useAppointmentDetail(
  appointmentId: string,
  repository: AppointmentRepository = appointmentRepository,
) {
  return useQuery({
    queryKey: appointmentQueryKeys.detail(appointmentId),
    queryFn: () => repository.getAppointment(appointmentId),
  });
}
