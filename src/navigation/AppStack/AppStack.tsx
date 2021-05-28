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
import Avatar from '../../components/Avatar';
import { Image } from 'react-native';

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
          headerRight: () => (
            <Avatar shape="circular" size={32}>
              <Image
                width={32}
                height={32}
                source={{
                  uri:
                    'https://firebasestorage.googleapis.com/v0/b/hakeemi.appspot.com/o/person.png?alt=media&token=f5613d3f-58a2-4755-8152-1fc484537705',
                  width: 32,
                  height: 32,
                }}
              />
            </Avatar>
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
          headerRight: () => (
            <Avatar shape="circular" size={32}>
              <Image
                width={32}
                height={32}
                source={{
                  uri:
                    'https://firebasestorage.googleapis.com/v0/b/hakeemi.appspot.com/o/person.png?alt=media&token=f5613d3f-58a2-4755-8152-1fc484537705',
                  width: 32,
                  height: 32,
                }}
              />
            </Avatar>
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
