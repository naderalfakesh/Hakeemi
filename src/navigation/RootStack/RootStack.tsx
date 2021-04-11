import React, { Fragment } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootParamsList } from './params';
import Welcome from '../../screens/Welcome';
import SignUp from '../../screens/SignUp';
import SignIn from '../../screens/SignIn';
import DrawerStack from '../DrawerStack';

const RootStack = () => {
  const loggedIn = true;
  const Stack = createStackNavigator<RootParamsList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!loggedIn ? (
        <Fragment>
          <Stack.Screen name="welcome" component={Welcome} />
          <Stack.Screen name="signup" component={SignUp} />
          <Stack.Screen name="signin" component={SignIn} />
        </Fragment>
      ) : (
        <Stack.Screen name="App" component={DrawerStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootStack;
