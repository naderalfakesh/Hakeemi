import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careQueryKeys } from '@/features/care/data/query-keys';
import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { hasInternetConnection } from '@/services/connectivity/connectivity';

import { appointmentQueryKeys } from '../data/query-keys';
import { createOfflineAppointmentError, toAppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { BookAppointmentInput } from '../domain/types';

export function useBookAppointment({
  checkConnection = hasInternetConnection,
  repository = appointmentRepository,
}: {
  checkConnection?: () => Promise<boolean>;
  repository?: AppointmentRepository;
} = {}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: BookAppointmentInput) => {
      if (!(await checkConnection())) {
        throw createOfflineAppointmentError();
      }

      try {
        return await repository.book(input);
      } catch (error) {
        throw toAppointmentActionError(error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.list() });
      void queryClient.invalidateQueries({ queryKey: careQueryKeys.all });
    },
    retry: false,
  });

  return {
    confirm: mutation.mutateAsync,
    error: mutation.error ? toAppointmentActionError(mutation.error) : null,
    reset: mutation.reset,
    status: mutation.status,
  };
}
