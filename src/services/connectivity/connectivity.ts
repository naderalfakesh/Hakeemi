import * as Network from 'expo-network';

export async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
