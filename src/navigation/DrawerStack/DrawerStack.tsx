import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppStack from '../AppStack';

const Drawer = createDrawerNavigator();

const MyDrawer = () => {
  return (
    <Drawer.Navigator initialRouteName="Home">
      <Drawer.Screen name="Home">
        {() => <AppStack initialRouteName="home" />}
      </Drawer.Screen>
      <Drawer.Screen name="Doctors">
        {() => <AppStack initialRouteName="doctors" />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

export default MyDrawer;
