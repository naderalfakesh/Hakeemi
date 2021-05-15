import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AppStack from '../AppStack';
import { AppStackParams } from '../AppStack/params';

export type ModalStackParams = {
  AppStack: undefined;
  DoctorProfileModal: AppStackParams['DoctorProfile'];
};

const Stack = createStackNavigator<ModalStackParams>();

const ModalStack = () => {
  return (
    <Stack.Navigator initialRouteName="AppStack" mode="modal" headerMode="none">
      <Stack.Screen name="AppStack" component={AppStack} />
      <Stack.Screen name="DoctorProfileModal">
        {({ route }) => (
          <AppStack
            initialRouteName="DoctorProfile"
            initialParams={route.params}
            modal
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default ModalStack;
