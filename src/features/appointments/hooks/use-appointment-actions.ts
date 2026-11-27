import { useRef, useState } from 'react';

import type { CalendarEventTime } from '@/services/calendar/calendar';
import { triggerHaptic } from '@/services/haptics/haptics';
import type { AppDataScope } from '@/services/query/data-scope';

import type { AppointmentRepository } from '../domain/repository';
import { useCancelAppointment } from './use-cancel-appointment';
import { useRescheduleAppointment } from './use-reschedule-appointment';

export function useAppointmentActions({
  appointmentId,
  createRequestId,
  onCancelled,
  onRescheduled,
  queryScope,
  repository,
}: {
  appointmentId: string;
  createRequestId: () => string;
  onCancelled: () => void;
  onRescheduled: (time: CalendarEventTime) => void;
  queryScope: AppDataScope;
  repository?: AppointmentRepository | undefined;
}) {
  const cancelMutation = useCancelAppointment({ queryScope, repository });
  const rescheduleMutation = useRescheduleAppointment({ queryScope, repository });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  // A retry of a failed action reuses its request ID, so the server can
  // replay an action that committed but whose response never arrived.
  const cancelRequestId = useRef<string | null>(null);
  const rescheduleRequest = useRef<{ requestId: string; slotId: string } | null>(null);
  const actionError = cancelMutation.error ?? rescheduleMutation.error;

  // Failures are shown from the mutation's error state, so the handlers
  // settle instead of rejecting.
  async function confirmCancel() {
    await triggerHaptic('warning');
    cancelRequestId.current ??= createRequestId();

    try {
      await cancelMutation.cancel({
        appointmentId,
        requestId: cancelRequestId.current,
      });
    } catch {
      return;
    }

    cancelRequestId.current = null;
    setConfirmingCancel(false);
    onCancelled();
  }

  async function reschedule(slotId: string) {
    if (rescheduleRequest.current?.slotId !== slotId) {
      rescheduleRequest.current = { requestId: createRequestId(), slotId };
    }

    let moved: Awaited<ReturnType<typeof rescheduleMutation.reschedule>>['appointment'];

    try {
      ({ appointment: moved } = await rescheduleMutation.reschedule({
        appointmentId,
        requestId: rescheduleRequest.current.requestId,
        slotId,
      }));
    } catch {
      return;
    }

    rescheduleRequest.current = null;
    setShowReschedule(false);
    onRescheduled({
      endsAt: moved.endsAt,
      startsAt: moved.startsAt,
      timezone: moved.timezone,
    });
  }

  return {
    actionError,
    confirmCancel,
    confirmingCancel,
    closeReschedule: () => setShowReschedule(false),
    dismissCancel: () => setConfirmingCancel(false),
    isCancelling: cancelMutation.status === 'pending',
    isRescheduling: rescheduleMutation.status === 'pending',
    openReschedule: () => setShowReschedule(true),
    reschedule,
    showReschedule,
    startCancel: () => setConfirmingCancel(true),
  };
}

export type AppointmentActions = ReturnType<typeof useAppointmentActions>;
