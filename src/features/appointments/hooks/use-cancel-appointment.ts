import { useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { hasInternetConnection } from '@/services/connectivity/connectivity';

import { appointmentQueryKeys } from '../data/query-keys';
import { createOfflineAppointmentError, toAppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { CancelAppointmentInput } from '../domain/types';

export function useCancelAppointment({
  checkConnection = hasInternetConnection,
  repository = appointmentRepository,
}: {
  checkConnection?: (() => Promise<boolean>) | undefined;
  repository?: AppointmentRepository | undefined;
} = {}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CancelAppointmentInput) => {
      if (!(await checkConnection())) {
        throw createOfflineAppointmentError();
      }

      try {
        return await repository.cancel(input);
      } catch (error) {
        throw toAppointmentActionError(error);
      }
    },
    onSuccess: ({ appointment }) => {
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.detail(appointment.id) });
    },
    retry: false,
  });

  return {
    cancel: mutation.mutateAsync,
    error: mutation.error ? toAppointmentActionError(mutation.error) : null,
    reset: mutation.reset,
    status: mutation.status,
  };
}
