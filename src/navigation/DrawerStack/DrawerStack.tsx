import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppStack from '../AppStack';

const Drawer = createDrawerNavigator();

const MyDrawer = () => {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={AppStack} />
    </Drawer.Navigator>
  );
};

export default MyDrawer;
