import * as Network from 'expo-network';

/**
 * Treats an unknown network state as online so cached-data notices never
 * appear before the platform reports a definitive answer.
 */
export function useIsOffline(): boolean {
  const networkState = Network.useNetworkState();

  if (networkState.isConnected === undefined) {
    return false;
  }

  return !(networkState.isConnected && networkState.isInternetReachable !== false);
}
