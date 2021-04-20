import React from 'react';
import { View, StyleSheet } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import RecentList from './RecentList';

const ITEMS = [
  { id: '1', url: 'https://images2.imgbox.com/f7/bb/7HJeSokt_o.png' },
  { id: '2', url: 'https://images2.imgbox.com/5d/c9/sqb7cQMS_o.png' },
  { id: '3', url: 'https://images2.imgbox.com/19/80/QQZwXNbP_o.png' },
  { id: '4', url: 'https://images2.imgbox.com/4b/fe/k8H0shP2_o.png' },
  { id: '5', url: 'https://imgbox.com/k8H0shP2' },
  { id: '6', url: 'https://imgbox.com/lRBBYcMj' },
  { id: '7', url: 'https://imgbox.com/h79FIvf2' },
];

const Container = (storyFn: any) => (
  <View style={styles.container}>{storyFn()}</View>
);

const RecentListDemo = () => (
  <RecentList
    imageList={ITEMS}
    onPress={id => console.log(id)}
    onExtraPress={() => console.log('extra pressed')}
  />
);

storiesOf('Recent list', module)
  .addDecorator(Container)
  .add('default', () => <RecentListDemo />);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(251, 251, 251, 1)',
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
});
