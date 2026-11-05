import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TestAppProviders } from '@/test/test-app-providers';

import { providerFixtures, specialtyFixtures } from '../data/fixtures';
import type { CareRepository } from '../domain/repository';
import { useProviderDiscovery } from './use-provider-discovery';

describe('useProviderDiscovery', () => {
  it('adds the next cursor page without duplicating the cached first page', async () => {
    const listProviderPage = jest
      .fn()
      .mockResolvedValueOnce({ items: [providerFixtures[0]], nextCursor: 'next-page' })
      .mockResolvedValueOnce({ items: [providerFixtures[1]], nextCursor: null });
    const listAvailableSlots = jest.fn().mockResolvedValue([]);
    const repository: CareRepository = {
      getClinic: jest.fn().mockResolvedValue(null),
      getProvider: jest.fn().mockResolvedValue(null),
      listAvailableSlots,
      listClinics: jest.fn().mockResolvedValue([]),
      listProviderPage,
      listSpecialties: jest.fn().mockResolvedValue(specialtyFixtures),
    };
    const { result } = await renderHook(
      () => useProviderDiscovery({ query: '', repository, specialtyId: null }),
      { wrapper: TestAppProviders },
    );

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.hasMore).toBe(true);

    await act(async () => result.current.loadMore());

    await waitFor(() =>
      expect(
        result.current.state.status === 'success'
          ? result.current.state.data.providers.map(({ id }) => id)
          : [],
      ).toEqual([providerFixtures[0].id, providerFixtures[1].id]),
    );
    expect(result.current.hasMore).toBe(false);
    expect(listProviderPage).toHaveBeenNthCalledWith(2, { query: '' }, 'next-page', 12);
    expect(listAvailableSlots).toHaveBeenCalledWith(
      providerFixtures[0].id,
      expect.objectContaining({
        endsBefore: expect.any(String),
        startsAtOrAfter: expect.any(String),
      }),
    );
  });

  it('keeps the list while a new page and its availability load', async () => {
    const [first, second] = providerFixtures;
    const listProviderPage = jest
      .fn()
      .mockResolvedValueOnce({ items: [first], nextCursor: 'next-page' })
      .mockResolvedValueOnce({ items: [second], nextCursor: null });
    const listAvailableSlots = jest.fn((providerId: string) =>
      providerId === first.id ? Promise.resolve([]) : new Promise<never>(() => undefined),
    );
    const repository: CareRepository = {
      getClinic: jest.fn().mockResolvedValue(null),
      getProvider: jest.fn().mockResolvedValue(null),
      listAvailableSlots,
      listClinics: jest.fn().mockResolvedValue([]),
      listProviderPage,
      listSpecialties: jest.fn().mockResolvedValue(specialtyFixtures),
    };
    const statuses: string[] = [];
    const { result } = await renderHook(
      () => {
        const discovery = useProviderDiscovery({ query: '', repository, specialtyId: null });
        statuses.push(discovery.state.status);
        return discovery;
      },
      { wrapper: TestAppProviders },
    );

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    statuses.length = 0;

    await act(async () => result.current.loadMore());
    await waitFor(() =>
      expect(listAvailableSlots).toHaveBeenCalledWith(second.id, expect.anything()),
    );

    expect(statuses).not.toContain('loading');
    const { state } = result.current;
    expect(state.status === 'success' && state.data.providers.map(({ id }) => id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(state.status === 'success' && [...state.data.pendingSlotProviderIds]).toEqual([
      second.id,
    ]);
  });

  it('keeps cached results and flags the failed refresh instead of erroring', async () => {
    const listProviderPage = jest
      .fn()
      .mockResolvedValueOnce({ items: [providerFixtures[0]], nextCursor: null })
      .mockRejectedValue(new Error('offline'));
    const listSpecialties = jest
      .fn()
      .mockResolvedValueOnce(specialtyFixtures)
      .mockRejectedValue(new Error('offline'));
    const repository: CareRepository = {
      getClinic: jest.fn().mockResolvedValue(null),
      getProvider: jest.fn().mockResolvedValue(null),
      listAvailableSlots: jest.fn().mockResolvedValue([]),
      listClinics: jest.fn().mockResolvedValue([]),
      listProviderPage,
      listSpecialties,
    };
    const { result } = await renderHook(
      () => useProviderDiscovery({ query: '', repository, specialtyId: null }),
      { wrapper: TestAppProviders },
    );

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.isRefreshFailed).toBe(false);

    await act(async () => result.current.retry());

    await waitFor(() => expect(result.current.isRefreshFailed).toBe(true));
    expect(result.current.state.status).toBe('success');
    expect(
      result.current.state.status === 'success'
        ? result.current.state.data.providers.map(({ id }) => id)
        : [],
    ).toEqual([providerFixtures[0].id]);
    expect(result.current.lastUpdatedAt).toEqual(expect.any(Number));
  });
});
