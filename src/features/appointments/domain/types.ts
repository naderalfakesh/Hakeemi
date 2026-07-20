export const appointmentReasonCategories = [
  'routine_visit',
  'new_concern',
  'follow_up',
  'preventive_care',
  'other',
] as const;

export type AppointmentReasonCategory = (typeof appointmentReasonCategories)[number];
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type VisitMode = 'in_person' | 'video';

export type Appointment = {
  cancelledAt: string | null;
  cancelledBy: 'patient' | 'provider' | 'system' | null;
  clinicId: string | null;
  createdAt: string;
  endsAt: string;
  id: string;
  patientId: string;
  providerId: string;
  reasonCategory: AppointmentReasonCategory | null;
  slotId: string;
  startsAt: string;
  status: AppointmentStatus;
  timezone: string;
  updatedAt: string;
  visitMode: VisitMode;
};

export type BookAppointmentInput = {
  reasonCategory: AppointmentReasonCategory | null;
  requestId: string;
  slotId: string;
};

export type BookAppointmentResult = {
  appointment: Pick<
    Appointment,
    | 'clinicId'
    | 'endsAt'
    | 'id'
    | 'providerId'
    | 'reasonCategory'
    | 'slotId'
    | 'startsAt'
    | 'status'
    | 'timezone'
    | 'visitMode'
  >;
  isReplay: boolean;
};

/**
 * Lifecycle writes are deliberately kept behind callable functions.  The
 * request ID makes a retry safe when the mobile client loses the response
 * after the server has committed the transaction.
 */
export type AppointmentActionInput = {
  appointmentId: string;
  requestId: string;
};

export type CancelAppointmentInput = AppointmentActionInput;

export type RescheduleAppointmentInput = AppointmentActionInput & {
  slotId: string;
};

export type AppointmentActionResult = {
  appointment: Pick<
    Appointment,
    | 'cancelledAt'
    | 'cancelledBy'
    | 'clinicId'
    | 'endsAt'
    | 'id'
    | 'providerId'
    | 'reasonCategory'
    | 'slotId'
    | 'startsAt'
    | 'status'
    | 'timezone'
    | 'visitMode'
  >;
  isReplay: boolean;
};
