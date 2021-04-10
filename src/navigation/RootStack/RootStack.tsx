import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootParamsList } from './params';
import Welcome from '../../screens/Welcome';
import SignUp from '../../screens/SignUp';
import SignIn from '../../screens/SignIn';

const RootStack = () => {
  const Stack = createStackNavigator<RootParamsList>();
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="welcome">
      <Stack.Screen name="welcome" component={Welcome} />
      <Stack.Screen name="signup" component={SignUp} />
      <Stack.Screen name="signin" component={SignIn} />
    </Stack.Navigator>
  );
};

export default RootStack;
