import React from 'react';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import useAuth from '../../../services/useAuth';

const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { logout } = useAuth();
  return (
    <DrawerContentScrollView>
      <DrawerItemList {...props} />
      <DrawerItem label="Sign off" onPress={logout} />
    </DrawerContentScrollView>
  );
};

export default DrawerMenu;
