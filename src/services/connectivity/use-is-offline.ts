import * as Network from 'expo-network';

// Unknown network state defaults to online to avoid premature offline banners.
export function useIsOffline(): boolean {
  const networkState = Network.useNetworkState();

  if (networkState.isConnected === undefined) {
    return false;
  }

  return !(networkState.isConnected && networkState.isInternetReachable !== false);
}
