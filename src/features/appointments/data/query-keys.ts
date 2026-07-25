export type AppointmentQueryScope = 'account' | 'demo';

export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  detail: (appointmentId: string, scope: AppointmentQueryScope = 'account') =>
    ['appointments', scope, 'detail', appointmentId] as const,
  list: (scope: AppointmentQueryScope = 'account') => ['appointments', scope, 'list'] as const,
};
