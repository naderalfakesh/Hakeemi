import type { AppDataScope } from '@/services/query/data-scope';

function scopeKey(scope: AppDataScope, accountId: string | null) {
  return scope === 'demo'
    ? (['appointments', 'demo'] as const)
    : (['appointments', 'account', accountId ?? 'anonymous'] as const);
}

export const appointmentQueryKeys = {
  all: ['appointments'] as const,
  account: (accountId: string) => scopeKey('account', accountId),
  detail: (
    appointmentId: string,
    scope: AppDataScope = 'account',
    accountId: string | null = null,
  ) => [...scopeKey(scope, accountId), 'detail', appointmentId] as const,
  list: (scope: AppDataScope = 'account', accountId: string | null = null) =>
    [...scopeKey(scope, accountId), 'list'] as const,
};
