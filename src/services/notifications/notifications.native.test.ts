import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHash } from 'node:crypto';

import { hasInternetConnection } from '@/services/connectivity/connectivity';

import type * as NotificationService from './notifications.native';

type Service = typeof NotificationService;
type CallableRecord = { data: unknown; name: string };

const mockState: {
  calls: CallableRecord[];
  currentUserId: string | null;
  handleCallable: (name: string, data: unknown) => Promise<unknown>;
  refreshListener: ((token: string) => void) | null;
  refreshUnsubscribe: jest.Mock;
  getToken: () => Promise<string | null>;
} = {
  calls: [],
  currentUserId: null,
  getToken: async () => null,
  handleCallable: async () => undefined,
  refreshListener: null,
  refreshUnsubscribe: jest.fn(),
};

jest.mock('@react-native-firebase/app', () => ({ getApp: () => ({ name: 'test' }) }));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({
    currentUser: mockState.currentUserId ? { uid: mockState.currentUserId } : null,
  }),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getInitialNotification: async () => null,
  getMessaging: () => ({}),
  getToken: () => mockState.getToken(),
  onNotificationOpenedApp: () => () => undefined,
  onTokenRefresh: (_messaging: unknown, listener: (token: string) => void) => {
    mockState.refreshListener = listener;
    return mockState.refreshUnsubscribe;
  },
}));
jest.mock('@react-native-firebase/functions', () => ({
  getFunctions: () => ({}),
  httpsCallable: (_functions: unknown, name: string) => async (data: unknown) => {
    mockState.calls.push({ data, name });
    return { data: await mockState.handleCallable(name, data) };
  },
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_algorithm: string, data: string) =>
    mockCreateHash('sha256').update(data).digest('hex'),
}));
jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: async () => ({ granted: true }),
  requestPermissionsAsync: async () => ({ granted: true }),
  setNotificationChannelAsync: async () => undefined,
}));
jest.mock('@/services/connectivity/connectivity', () => ({ hasInternetConnection: jest.fn() }));

// Referenced lazily from the expo-crypto factory; the `mock` prefix is what
// Jest requires for that.
const mockCreateHash = createHash;
const STORAGE_KEY = '@hakeemi/notification-deregistrations/v1';
const TOKEN_A = 'fcm-token-for-a-fictional-device-123456';
const TOKEN_ROTATED = 'fcm-token-for-the-same-device-after-refresh-123456';
const mockedHasInternetConnection = jest.mocked(hasInternetConnection);

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function respondLikeServer(name: string, data: unknown) {
  const request = data as { token: string };
  const tokenId = sha256(request.token);

  return name === 'registerDeviceToken' ? { enabled: true, tokenId } : { disabled: true, tokenId };
}

async function readPending() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as { tokenId: string | null; userId: string }[]) : [];
}

function loadService(): Service {
  let service: Service | undefined;
  jest.isolateModules(() => {
    service = jest.requireActual<Service>('./notifications.native');
  });
  return service as Service;
}

describe('notification registration lifecycle on sign-out', () => {
  let service: Service;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockState.calls = [];
    mockState.currentUserId = 'user-a';
    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    mockState.refreshListener = null;
    mockState.refreshUnsubscribe = jest.fn();
    mockState.getToken = async () => TOKEN_A;
    mockedHasInternetConnection.mockResolvedValue(true);
    service = loadService();
  });

  it('disables the signed-in account registration on the server when online', async () => {
    await service.disableAppointmentNotifications();

    expect(mockState.calls).toEqual([
      { data: { token: TOKEN_A, userId: 'user-a' }, name: 'unregisterDeviceToken' },
    ]);
    expect(await readPending()).toEqual([]);
  });

  it('records the sign-out locally without touching the network when offline', async () => {
    mockedHasInternetConnection.mockResolvedValue(false);

    await expect(service.disableAppointmentNotifications()).resolves.toBeUndefined();

    expect(mockState.calls).toEqual([]);
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);
  });

  it('keeps the sign-out usable and queued when the server rejects the request', async () => {
    mockState.handleCallable = async () => {
      throw new Error('internal');
    };

    await expect(service.disableAppointmentNotifications()).resolves.toBeUndefined();

    expect(mockState.calls).toHaveLength(1);
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);
  });

  it('gives up on a hanging request after the deregistration budget and queues it', async () => {
    jest.useFakeTimers();
    try {
      mockState.handleCallable = () => new Promise(() => undefined);

      const signOut = service.disableAppointmentNotifications();
      await jest.advanceTimersByTimeAsync(5_000);
      await expect(signOut).resolves.toBeUndefined();

      expect(mockState.calls).toHaveLength(1);
      expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does nothing and records nothing when no account is signed in', async () => {
    mockState.currentUserId = null;

    await service.disableAppointmentNotifications();

    expect(mockState.calls).toEqual([]);
    expect(await readPending()).toEqual([]);
  });
});

describe('pending deregistration flush', () => {
  let service: Service;

  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]),
    );
    mockState.calls = [];
    mockState.currentUserId = 'user-b';
    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    mockState.refreshListener = null;
    mockState.getToken = async () => TOKEN_A;
    mockedHasInternetConnection.mockResolvedValue(true);
    service = loadService();
  });

  it('lets the next signed-in account flush the previous account sign-out with the raw token', async () => {
    await service.flushPendingNotificationDeregistrations();

    expect(mockState.calls).toEqual([
      { data: { token: TOKEN_A, userId: 'user-a' }, name: 'unregisterDeviceToken' },
    ]);
    expect(await readPending()).toEqual([]);
  });

  it('flushes before registering the next account and clears the queue', async () => {
    const result = await service.registerForAppointmentNotifications({ locale: 'en' });

    expect(result).toEqual({ status: 'registered', tokenId: sha256(TOKEN_A) });
    expect(mockState.calls.map((call) => call.name)).toEqual([
      'unregisterDeviceToken',
      'registerDeviceToken',
    ]);
    expect(mockState.calls[0]?.data).toEqual({ token: TOKEN_A, userId: 'user-a' });
    expect(mockState.calls[1]?.data).toMatchObject({ enabled: true, token: TOKEN_A });
    expect(await readPending()).toEqual([]);
  });

  it('keeps the entry when the flush fails and retries it later', async () => {
    mockState.handleCallable = async () => {
      throw new Error('unavailable');
    };

    await service.flushPendingNotificationDeregistrations();
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);

    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    await service.flushPendingNotificationDeregistrations();
    expect(await readPending()).toEqual([]);
    expect(mockState.calls).toHaveLength(2);
  });

  it('drops an entry whose token has rotated since the sign-out was recorded', async () => {
    mockState.getToken = async () => TOKEN_ROTATED;

    await service.flushPendingNotificationDeregistrations();

    expect(mockState.calls).toEqual([]);
    expect(await readPending()).toEqual([]);
  });

  it('waits for a signed-in account before contacting the server', async () => {
    mockState.currentUserId = null;

    await service.flushPendingNotificationDeregistrations();

    expect(mockState.calls).toEqual([]);
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);
  });

  it('treats a successful re-registration by the same account as superseding its sign-out', async () => {
    mockState.currentUserId = 'user-a';
    mockState.handleCallable = async (name, data) => {
      if (name === 'unregisterDeviceToken') {
        throw new Error('unavailable');
      }
      return respondLikeServer(name, data);
    };

    const result = await service.registerForAppointmentNotifications({ locale: 'ar' });

    expect(result.status).toBe('registered');
    expect(await readPending()).toEqual([]);
  });
});

describe('registration and sign-out races', () => {
  let service: Service;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockState.calls = [];
    mockState.currentUserId = 'user-a';
    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    mockState.refreshListener = null;
    mockState.refreshUnsubscribe = jest.fn();
    mockState.getToken = async () => TOKEN_A;
    mockedHasInternetConnection.mockResolvedValue(true);
    service = loadService();
  });

  it('stops the refresh listener at sign-out so a refreshed token is never re-registered', async () => {
    await service.registerForAppointmentNotifications({ locale: 'en' });
    expect(mockState.refreshListener).not.toBeNull();

    const signOut = service.disableAppointmentNotifications();
    expect(mockState.refreshUnsubscribe).toHaveBeenCalledTimes(1);
    mockState.refreshListener?.(TOKEN_ROTATED);
    await signOut;

    expect(mockState.calls.map((call) => call.name)).toEqual([
      'registerDeviceToken',
      'unregisterDeviceToken',
    ]);
    expect(mockState.calls[1]?.data).toEqual({ token: TOKEN_A, userId: 'user-a' });
  });

  it('never leaves a token refreshed just before sign-out registered to the old account', async () => {
    await service.registerForAppointmentNotifications({ locale: 'en' });

    mockState.getToken = async () => TOKEN_ROTATED;
    mockState.refreshListener?.(TOKEN_ROTATED);
    await service.disableAppointmentNotifications();

    // The queued refresh registration is dropped because sign-out had already
    // begun, and the sign-out disables whatever token the device now holds.
    expect(
      mockState.calls.map((call) => [call.name, (call.data as { token: string }).token]),
    ).toEqual([
      ['registerDeviceToken', TOKEN_A],
      ['unregisterDeviceToken', TOKEN_ROTATED],
    ]);
    expect(await readPending()).toEqual([]);
  });

  it('drops an enable request that was still resolving its token when sign-out started', async () => {
    let releaseToken: (token: string) => void = () => undefined;
    const pendingToken = new Promise<string>((resolve) => {
      releaseToken = resolve;
    });
    mockState.getToken = jest.fn().mockReturnValueOnce(pendingToken).mockResolvedValue(TOKEN_A);

    const enable = service.registerForAppointmentNotifications({ locale: 'en' });
    await service.disableAppointmentNotifications();
    releaseToken(TOKEN_A);

    await expect(enable).resolves.toEqual({ status: 'unavailable' });
    expect(mockState.calls.map((call) => call.name)).toEqual(['unregisterDeviceToken']);
    expect(mockState.refreshListener).toBeNull();
  });
});

describe('bounded sign-out behind a hung registration', () => {
  let service: Service;
  let releaseRegistration: () => void = () => undefined;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockState.calls = [];
    mockState.currentUserId = 'user-a';
    mockState.refreshListener = null;
    mockState.refreshUnsubscribe = jest.fn();
    mockState.getToken = async () => TOKEN_A;
    mockedHasInternetConnection.mockResolvedValue(true);
    service = loadService();

    // The first registration never completes until the test releases it, and
    // every callable is refused once nobody is signed in, like the real server.
    let hung = false;
    mockState.handleCallable = async (name, data) => {
      if (!mockState.currentUserId) {
        throw new Error('unauthenticated');
      }
      if (name === 'registerDeviceToken' && !hung) {
        hung = true;
        await new Promise<void>((resolve) => {
          releaseRegistration = resolve;
        });
      }
      return respondLikeServer(name, data);
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('signs out within the budget, keeps the sign-out queued, and disables the late registration', async () => {
    const enable = service.registerForAppointmentNotifications({ locale: 'en' });
    await jest.advanceTimersByTimeAsync(0);
    expect(mockState.calls.map((call) => call.name)).toEqual(['registerDeviceToken']);

    const signOut = service.disableAppointmentNotifications();
    await jest.advanceTimersByTimeAsync(5_000);
    await expect(signOut).resolves.toBeUndefined();

    // Sign-out returned while the registration still hangs: nothing else was
    // sent, and the sign-out is recorded for a later retry.
    expect(mockState.calls).toHaveLength(1);
    expect(await readPending()).toEqual([{ tokenId: null, userId: 'user-a' }]);

    // Firebase sign-out completes, then the registration finally lands.
    mockState.currentUserId = null;
    releaseRegistration();
    await expect(enable).resolves.toEqual({ status: 'registered', tokenId: sha256(TOKEN_A) });
    await jest.advanceTimersByTimeAsync(0);

    // The queued disable ran without credentials, so it stays recorded with
    // the exact token the device held, and no unregister went out.
    expect(mockState.calls.map((call) => call.name)).toEqual(['registerDeviceToken']);
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);

    // The next signed-in account flushes it, then registers itself.
    mockState.currentUserId = 'user-b';
    await service.flushPendingNotificationDeregistrations();
    const next = await service.registerForAppointmentNotifications({ locale: 'ar' });

    expect(next.status).toBe('registered');
    expect(
      mockState.calls.map((call) => [call.name, (call.data as { userId?: string }).userId]),
    ).toEqual([
      ['registerDeviceToken', undefined],
      ['unregisterDeviceToken', 'user-a'],
      ['registerDeviceToken', undefined],
    ]);
    expect(await readPending()).toEqual([]);
  });

  it('never lets the queued sign-out touch the next account that registers behind it', async () => {
    const enable = service.registerForAppointmentNotifications({ locale: 'en' });
    await jest.advanceTimersByTimeAsync(0);

    const signOut = service.disableAppointmentNotifications();
    await jest.advanceTimersByTimeAsync(5_000);
    await signOut;

    // Account B signs in and enables notifications while A's registration is
    // still hanging ahead of A's queued sign-out.
    mockState.currentUserId = 'user-b';
    const nextEnable = service.registerForAppointmentNotifications({ locale: 'ar' });
    await jest.advanceTimersByTimeAsync(0);
    expect(mockState.calls).toHaveLength(1);

    releaseRegistration();
    await expect(enable).resolves.toEqual({ status: 'registered', tokenId: sha256(TOKEN_A) });
    await expect(nextEnable).resolves.toEqual({ status: 'registered', tokenId: sha256(TOKEN_A) });

    // Order: A's late registration, A's sign-out flushed under B by possession
    // of the token and scoped to A, then B's own registration last.
    expect(
      mockState.calls.map((call) => [call.name, (call.data as { userId?: string }).userId]),
    ).toEqual([
      ['registerDeviceToken', undefined],
      ['unregisterDeviceToken', 'user-a'],
      ['registerDeviceToken', undefined],
    ]);
    expect(await readPending()).toEqual([]);
    expect(mockState.refreshListener).not.toBeNull();
  });
});

describe('degraded storage and failed token reads', () => {
  let service: Service;
  const setItem = jest.mocked(AsyncStorage.setItem);
  const workingSetItem = setItem.getMockImplementation();

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockState.calls = [];
    mockState.currentUserId = 'user-a';
    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    mockState.refreshListener = null;
    mockState.refreshUnsubscribe = jest.fn();
    mockState.getToken = async () => TOKEN_A;
    mockedHasInternetConnection.mockResolvedValue(true);
    service = loadService();
  });

  afterEach(() => {
    setItem.mockImplementation(workingSetItem);
    jest.useRealTimers();
  });

  it('still disables the registration on the server when the retry record cannot be written', async () => {
    setItem.mockRejectedValue(new Error('disk full'));

    await expect(service.disableAppointmentNotifications()).resolves.toBeUndefined();

    expect(mockState.calls).toEqual([
      { data: { token: TOKEN_A, userId: 'user-a' }, name: 'unregisterDeviceToken' },
    ]);
  });

  it('keeps the sign-out bounded and recorded when storage fails and the server is unreachable', async () => {
    jest.useFakeTimers();
    setItem.mockRejectedValue(new Error('disk full'));
    mockState.handleCallable = () => new Promise(() => undefined);

    const signOut = service.disableAppointmentNotifications();
    await jest.advanceTimersByTimeAsync(5_000);
    await expect(signOut).resolves.toBeUndefined();
    expect(mockState.calls.map((call) => call.name)).toEqual(['unregisterDeviceToken']);
    expect(await readPending()).toEqual([]);

    // Storage recovers while the server is still rejecting: the next sign-out
    // is recorded again, and the next signed-in account flushes it.
    setItem.mockImplementation(workingSetItem);
    mockState.handleCallable = async () => {
      throw new Error('unavailable');
    };
    await service.disableAppointmentNotifications();
    expect(await readPending()).toEqual([{ tokenId: sha256(TOKEN_A), userId: 'user-a' }]);

    mockState.currentUserId = 'user-b';
    mockState.handleCallable = async (name, data) => respondLikeServer(name, data);
    await service.flushPendingNotificationDeregistrations();
    expect(await readPending()).toEqual([]);
    expect(mockState.calls.map((call) => (call.data as { userId?: string }).userId)).toEqual([
      'user-a',
      'user-a',
      'user-a',
    ]);
  });

  it('puts the placeholder back when a late registration superseded it and the token cannot be read', async () => {
    jest.useFakeTimers();
    let releaseRegistration: () => void = () => undefined;
    let hung = false;
    mockState.handleCallable = async (name, data) => {
      if (!mockState.currentUserId) {
        throw new Error('unauthenticated');
      }
      if (name === 'registerDeviceToken' && !hung) {
        hung = true;
        await new Promise<void>((resolve) => {
          releaseRegistration = resolve;
        });
      }
      return respondLikeServer(name, data);
    };
    // Token reads: A's registration, then the queued disable (fails), then B.
    mockState.getToken = jest
      .fn<Promise<string | null>, []>()
      .mockResolvedValueOnce(TOKEN_A)
      .mockRejectedValueOnce(new Error('messaging unavailable'))
      .mockResolvedValue(TOKEN_A);

    const enable = service.registerForAppointmentNotifications({ locale: 'en' });
    await jest.advanceTimersByTimeAsync(0);
    const signOut = service.disableAppointmentNotifications();
    await jest.advanceTimersByTimeAsync(5_000);
    await signOut;
    expect(await readPending()).toEqual([{ tokenId: null, userId: 'user-a' }]);

    // Firebase sign-out, then A's registration lands late and supersedes the
    // placeholder; the queued disable cannot read the token.
    mockState.currentUserId = null;
    releaseRegistration();
    await expect(enable).resolves.toEqual({ status: 'registered', tokenId: sha256(TOKEN_A) });
    await jest.advanceTimersByTimeAsync(0);
    expect(mockState.calls.map((call) => call.name)).toEqual(['registerDeviceToken']);
    expect(await readPending()).toEqual([{ tokenId: null, userId: 'user-a' }]);

    // The next account still ends A's registration and keeps its own.
    mockState.currentUserId = 'user-b';
    await service.flushPendingNotificationDeregistrations();
    const next = await service.registerForAppointmentNotifications({ locale: 'ar' });

    expect(next.status).toBe('registered');
    expect(
      mockState.calls.map((call) => [call.name, (call.data as { userId?: string }).userId]),
    ).toEqual([
      ['registerDeviceToken', undefined],
      ['unregisterDeviceToken', 'user-a'],
      ['registerDeviceToken', undefined],
    ]);
    expect(await readPending()).toEqual([]);
  });
});
