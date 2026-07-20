import { act, renderHook, waitFor } from '@testing-library/react-native';

import { TestAppProviders } from '@/test/test-app-providers';

import { careRepository } from '@/features/care/data/care-repository';
import { savedProvidersRepository } from '@/features/care/data/saved-providers-repository';
import { providerFixtures } from '../data/fixtures';
import { useSavedProviders } from './use-saved-providers';

jest.mock('@/features/care/data/care-repository', () => ({
  careRepository: {
    getProvider: jest.fn(),
  },
}));

jest.mock('@/features/care/data/saved-providers-repository', () => ({
  savedProvidersRepository: {
    available: true,
    listSavedProviderIds: jest.fn(),
    removeProvider: jest.fn(),
    saveProvider: jest.fn(),
  },
}));

const mockedCareRepository = jest.mocked(careRepository);
const mockedSavedProvidersRepository = jest.mocked(savedProvidersRepository);

const user = {
  displayName: 'Demo Patient',
  email: 'demo@example.test',
  emailVerified: true,
  id: 'demo-user',
};

describe('useSavedProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSavedProvidersRepository.listSavedProviderIds
      .mockResolvedValueOnce(['lina-haddad'])
      .mockResolvedValue([]);
    mockedSavedProvidersRepository.removeProvider.mockResolvedValue(undefined);
    mockedSavedProvidersRepository.saveProvider.mockResolvedValue(undefined);
    mockedCareRepository.getProvider.mockResolvedValue(providerFixtures[1] ?? null);
  });

  it('loads the owner shortlist and optimistically removes a clinician', async () => {
    const { result } = await renderHook(() => useSavedProviders(user), {
      wrapper: TestAppProviders,
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.providers).toHaveLength(1);
    expect(result.current.isSaved('lina-haddad')).toBe(true);

    await act(async () => result.current.toggle('lina-haddad'));

    expect(mockedSavedProvidersRepository.removeProvider).toHaveBeenCalledWith('lina-haddad');
    await waitFor(() => expect(result.current.isSaved('lina-haddad')).toBe(false));
  });
});
