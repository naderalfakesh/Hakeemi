import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParams, AppStackRouteName } from '../types';
import Home from '../../screens/Home';
import Icon from '../../components/Icon';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DoctorProfile from '../../screens/DoctorProfile';
import ScheduleDialog from '../../screens/ScheduleDialog';
import Doctors from '../../screens/Doctors';

const Stack = createStackNavigator<AppStackParams>();
export interface AppStackProps<R extends AppStackRouteName> {
  initialRouteName: R;
  initialParams: AppStackParams[R];
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
        name="Home"
        component={Home}
        options={{
          title: t('home:title'),
          headerLeft: () => (
            <Icon name="nav-menu" size={20} onPress={openDrawer} />
          ),
        }}
      />
      <Stack.Screen
        name="Doctors"
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
      <Stack.Screen
        name="ScheduleDialog"
        component={ScheduleDialog}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
