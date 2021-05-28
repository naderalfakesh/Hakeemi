import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AppStack from '../AppStack';
import { DoctorStackParams } from '../types';

const Stack = createStackNavigator<DoctorStackParams>();

const ModalStack = () => {
  return (
    <Stack.Navigator initialRouteName="Profile" mode="modal" headerMode="none">
      <Stack.Screen name="Profile">
        {({ route }) => (
          <AppStack initialRouteName="Profile" initialParams={route.params} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default ModalStack;
