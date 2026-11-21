import * as Network from 'expo-network';

import type { AppDataScope } from '@/services/query/data-scope';

export type ConnectionCheck = () => Promise<boolean>;

export async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected !== false && state.isInternetReachable !== false;
}

const alwaysConnected: ConnectionCheck = async () => true;

/** The demo runs on local data, so its actions never wait on the network. */
export function connectionCheckFor(scope: AppDataScope): ConnectionCheck {
  return scope === 'demo' ? alwaysConnected : hasInternetConnection;
}
