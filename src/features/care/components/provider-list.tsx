import { StyleSheet, View } from 'react-native';

import type { Provider } from '../domain/types';

export function ProviderListSeparator() {
  return <View style={separatorStyles.separator} />;
}

export function providerKeyExtractor(provider: Provider) {
  return provider.id;
}

const separatorStyles = StyleSheet.create({
  separator: {
    height: 12,
  },
});
