import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ModalStack from '../ModalStack';

const Drawer = createDrawerNavigator();

const MyDrawer = () => {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home" component={ModalStack} />
    </Drawer.Navigator>
  );
};

export default MyDrawer;
