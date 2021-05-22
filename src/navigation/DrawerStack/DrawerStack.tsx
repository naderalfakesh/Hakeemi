import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ModalStack from '../ModalStack';
import DoctorsStack from '../DoctorsStack';
import DrawerMenu from './DrawerMenu';
import { DrawerStackParams } from '../types';

const Drawer = createDrawerNavigator<DrawerStackParams>();

const MyDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="HomeDrawer"
      drawerContent={props => <DrawerMenu {...props} />}>
      <Drawer.Screen
        name="HomeDrawer"
        component={ModalStack}
        options={{ drawerLabel: 'Home' }}
      />
      <Drawer.Screen
        name="DoctorsDrawer"
        component={DoctorsStack}
        options={{ drawerLabel: 'Doctors' }}
      />
    </Drawer.Navigator>
  );
};

export default MyDrawer;
