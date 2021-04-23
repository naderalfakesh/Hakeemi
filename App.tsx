/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/RootStack';
import { StatusBar } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

const App: () => ReactNode = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" translucent={true} />
      <I18nextProvider i18n={i18n}>
        <RootStack />
      </I18nextProvider>
    </NavigationContainer>
  );
};

export default App;
