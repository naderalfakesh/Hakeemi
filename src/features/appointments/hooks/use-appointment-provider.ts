import { useQueryClient } from '@tanstack/react-query';

import { careQueryKeys } from '@/features/care/data/query-keys';
import type { Provider } from '@/features/care/domain/types';
import type { CareRepository } from '@/features/care/domain/repository';
import { useProviderDetail } from '@/features/care/hooks/use-provider-detail';
import type { AppDataScope } from '@/services/query/data-scope';

export function useAppointmentProvider(
  providerId: string,
  { queryScope, repository }: { queryScope: AppDataScope; repository: CareRepository },
) {
  const queryClient = useQueryClient();
  const providerQuery = useProviderDetail(providerId, { queryScope, repository });
  const cachedProvider =
    providerId.length > 0
      ? (queryClient.getQueryData<{ provider: Provider } | null>(
          careQueryKeys.detail(providerId, queryScope),
        )?.provider ??
        queryClient.getQueryData<Provider | null>(
          careQueryKeys.providerSummary(providerId, queryScope),
        ) ??
        null)
      : null;
  const provider =
    providerQuery.state.status === 'success' ? providerQuery.state.data.provider : cachedProvider;

  return { provider, providerState: providerQuery.state };
}
