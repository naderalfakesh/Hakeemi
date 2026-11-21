import { useMutation, useQueryClient } from '@tanstack/react-query';

import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { careQueryKeys } from '@/features/care/data/query-keys';
import { connectionCheckFor, type ConnectionCheck } from '@/services/connectivity/connectivity';
import type { AppDataScope } from '@/services/query/data-scope';

import { appointmentQueryKeys } from '../data/query-keys';
import { createOfflineAppointmentError, toAppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { CancelAppointmentInput } from '../domain/types';

export function useCancelAppointment({
  queryScope = 'account',
  checkConnection = connectionCheckFor(queryScope),
  repository = appointmentRepository,
}: {
  checkConnection?: ConnectionCheck | undefined;
  queryScope?: AppDataScope | undefined;
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.all });
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
