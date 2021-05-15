import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParams } from './params';
import Home from '../../screens/Home';
import Doctors from '../../screens/Doctors';
import Icon from '../../components/Icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DoctorProfile from '../../screens/DoctorProfile';

const Stack = createStackNavigator<AppStackParams>();
type AppStackRouteName = keyof AppStackParams;
export interface AppStackProps<R extends AppStackRouteName> {
  initialRouteName: R;
  initialParams: AppStackParams[R];
  modal?: boolean;
}
const AppStack = <R extends AppStackRouteName>({
  initialRouteName,
}: AppStackProps<R>) => {
  const { dispatch } = useNavigation();
  const { t } = useTranslation();
  const openDrawer = () => dispatch(DrawerActions.openDrawer());
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
      <Stack.Screen
        name="doctors"
        component={Doctors}
        options={{
          title: '',
          headerLeft: () => (
            <Icon name="nav-menu" size={20} onPress={openDrawer} />
          ),
        }}
      />
      <Stack.Screen
        name="DoctorProfile"
        component={DoctorProfile}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
