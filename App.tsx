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

const App: () => ReactNode = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" translucent={true} />
      <RootStack />
    </NavigationContainer>
  );
};

export default App;
