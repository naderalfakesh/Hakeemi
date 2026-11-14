import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careQueryKeys } from '@/features/care/data/query-keys';
import { appointmentRepository } from '@/features/appointments/data/appointment-repository';
import { hasInternetConnection } from '@/services/connectivity/connectivity';

import { appointmentQueryKeys, type AppointmentQueryScope } from '../data/query-keys';
import { createOfflineAppointmentError, toAppointmentActionError } from '../domain/errors';
import type { AppointmentRepository } from '../domain/repository';
import type { Appointment, BookAppointmentInput } from '../domain/types';

export function useBookAppointment({
  accountId = null,
  checkConnection = hasInternetConnection,
  queryScope = 'account',
  repository = appointmentRepository,
}: {
  accountId?: string | null;
  checkConnection?: () => Promise<boolean>;
  queryScope?: AppointmentQueryScope;
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
    onSuccess: (result) => {
      const nowIso = new Date().toISOString();
      const seededDetail: Appointment = {
        ...result.appointment,
        cancelledAt: null,
        cancelledBy: null,
        createdAt: nowIso,
        patientId: accountId ?? (queryScope === 'demo' ? 'demo-patient' : 'pending'),
        updatedAt: nowIso,
      };
      queryClient.setQueryData(
        appointmentQueryKeys.detail(result.appointment.id, queryScope, accountId),
        seededDetail,
      );
      void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
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
