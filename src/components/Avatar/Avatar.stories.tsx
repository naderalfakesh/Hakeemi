import React, { Fragment } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import Avatar, { Props } from './Avatar';

const Container = (storyFn: any) => (
  <View style={styles.container}>{storyFn()}</View>
);

const ImageDemo = () => (
  <Image
    source={{
      uri: 'https://i.ibb.co/4WGLRjs/person.png',
      width: 50,
      height: 50,
    }}
  />
);

const AvatarDemo = ({ theme }: { theme: Props['theme'] }) => (
  <Fragment>
    <Avatar size={50} theme={theme} shape="straight">
      <ImageDemo />
    </Avatar>
    <Avatar size={50} theme={theme} shape="rounded">
      <ImageDemo />
    </Avatar>
    <Avatar size={50} theme={theme} shape="circular">
      <ImageDemo />
    </Avatar>
  </Fragment>
);

storiesOf('Avatar', module)
  .addDecorator(Container)
  .add('primary', () => <AvatarDemo theme="primary" />)
  .add('secondary', () => <AvatarDemo theme="secondary" />);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
});
