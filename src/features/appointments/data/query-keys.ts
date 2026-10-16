export type AppointmentQueryScope = 'account' | 'demo';

// Account data is keyed by the signed-in user so one account's cache is never
// served to the next account on the same device.
function scopeKey(scope: AppointmentQueryScope, accountId: string | null) {
  return scope === 'demo'
    ? (['appointments', 'demo'] as const)
    : (['appointments', 'account', accountId ?? 'anonymous'] as const);
}

export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  account: (accountId: string) => scopeKey('account', accountId),
  detail: (
    appointmentId: string,
    scope: AppointmentQueryScope = 'account',
    accountId: string | null = null,
  ) => [...scopeKey(scope, accountId), 'detail', appointmentId] as const,
  list: (scope: AppointmentQueryScope = 'account', accountId: string | null = null) =>
    [...scopeKey(scope, accountId), 'list'] as const,
};
