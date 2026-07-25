import { useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { careQueryKeys } from '@/features/care/data/query-keys';
import { hasInternetConnection } from '@/services/connectivity/connectivity';

import { appointmentQueryKeys } from '../data/query-keys';
import { createOfflineAppointmentError, toAppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { RescheduleAppointmentInput } from '../domain/types';

export function useRescheduleAppointment({
  checkConnection = hasInternetConnection,
  repository = appointmentRepository,
}: {
  checkConnection?: (() => Promise<boolean>) | undefined;
  repository?: AppointmentRepository | undefined;
} = {}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: RescheduleAppointmentInput) => {
      if (!(await checkConnection())) {
        throw createOfflineAppointmentError();
      }

      try {
        return await repository.reschedule(input);
      } catch (error) {
        throw toAppointmentActionError(error);
      }
    },
    onSuccess: ({ appointment }) => {
      void appointment;
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.all });
    },
    retry: false,
  });

  return {
    error: mutation.error ? toAppointmentActionError(mutation.error) : null,
    reset: mutation.reset,
    reschedule: mutation.mutateAsync,
    status: mutation.status,
  };
}
