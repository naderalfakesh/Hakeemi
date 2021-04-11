import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootParamsList } from './params';
import Home from '../../screens/Home';
import Icon from '../../components/Icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const RootStack = () => {
  const { dispatch } = useNavigation();
  const openDrawer = () => dispatch(DrawerActions.openDrawer());
  const Stack = createStackNavigator<RootParamsList>();
  return (
    <Stack.Navigator
      initialRouteName="home"
      screenOptions={{
        headerLeftContainerStyle: { paddingLeft: 24 },
        headerRightContainerStyle: { paddingRight: 24 },
      }}>
      <Stack.Screen
        name="home"
        component={Home}
        options={{
          title: 'Home',
          headerLeft: () => (
            <Icon name="nav-1" size={20} onPress={openDrawer} />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default RootStack;
