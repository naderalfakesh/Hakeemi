import * as Network from 'expo-network';

import type { AppDataScope } from '@/services/query/data-scope';

export type ConnectionCheck = () => Promise<boolean>;

export async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected !== false && state.isInternetReachable !== false;
}

const alwaysConnected: ConnectionCheck = async () => true;

export function connectionCheckFor(scope: AppDataScope): ConnectionCheck {
  return scope === 'demo' ? alwaysConnected : hasInternetConnection;
}
