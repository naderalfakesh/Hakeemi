import React from 'react';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import useAuth from '../../../services/useAuth';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import VersionInfo from 'react-native-version-info';
import Text from '../../../components/Text';

const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { logout } = useAuth();
  const { t } = useTranslation('common');

  return (
    <DrawerContentScrollView
      bounces={false}
      contentContainerStyle={styles.container}>
      <View>
        <DrawerItemList {...props} />
      </View>
      <View>
        <DrawerItem label={t('drawer.signOut')} onPress={logout} />
        <Text style={styles.version} color="secondary">
          Version: {VersionInfo.appVersion} ({VersionInfo.buildVersion})
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  version: {
    alignSelf: 'flex-end',
    marginRight: 20,
  },
});

export default DrawerMenu;
