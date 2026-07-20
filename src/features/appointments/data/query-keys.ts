export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  detail: (appointmentId: string) => ['appointments', 'detail', appointmentId] as const,
  list: () => ['appointments', 'list'] as const,
};
