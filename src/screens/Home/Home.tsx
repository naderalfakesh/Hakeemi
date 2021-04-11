import React, { FC, Fragment } from 'react';
import { StatusBar, View } from 'react-native';
import styles from './styles';

const Home: FC = () => {
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}></View>
    </Fragment>
  );
};

export default Home;
