import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootParamsList } from './params';
import Home from '../../screens/Home';
import Icon from '../../components/Icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const RootStack = () => {
  const { dispatch } = useNavigation();
  const { t } = useTranslation();
  const openDrawer = () => dispatch(DrawerActions.openDrawer());
  const Stack = createStackNavigator<RootParamsList>();
  return (
    <Stack.Navigator
      initialRouteName="home"
      screenOptions={{
        headerLeftContainerStyle: { paddingLeft: 24 },
        headerRightContainerStyle: { paddingRight: 24 },
        headerStyle: { shadowColor: 'transparent' },
      }}>
      <Stack.Screen
        name="home"
        component={Home}
        options={{
          title: t('home:title'),
          headerLeft: () => (
            <Icon name="nav-menu" size={20} onPress={openDrawer} />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default RootStack;
