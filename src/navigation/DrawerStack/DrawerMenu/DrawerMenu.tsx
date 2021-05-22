import React from 'react';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

const DrawerMenu = (props: DrawerContentComponentProps) => {
  return (
    <DrawerContentScrollView>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

export default DrawerMenu;
