import React, { FC, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import styles from './styles';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/core';
import HomeBgPattern from '../../../assets/homeBgPattern.svg';
import Text from '../../components/Text';

const SignUp: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { navigate, goBack } = useNavigation();
  return (
    <View style={styles.container}>
      <HomeBgPattern
        style={styles.background}
        height="100%"
        width="100%"
        preserveAspectRatio="xMinYMin slice"
      />
      <View style={styles.paper}>
        <Text size="head-30" color="black" align="center" style={styles.title}>
          Sign In
        </Text>
        <Text
          size="body-22"
          color="black"
          align="center"
          style={styles.subtitle}>
          Welcome again!
        </Text>
        <View style={styles.fields}>
          <TextField
            style={styles.field}
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
          />
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={true}
          />
        </View>
        <Text
          size="body-16"
          align="right"
          color="primary"
          onPress={() => navigate('signup')}
          style={StyleSheet.flatten([styles.forgotPass, styles.underline])}>
          Forgot Password
        </Text>
        <Button
          style={styles.button}
          theme="primary"
          size="big"
          onPress={() => goBack()}>
          Secure Login
        </Button>
      </View>
      <Text size="body-22" align="center" color="white">
        {'Don’t have an account? '}
        <Text
          style={styles.underline}
          size="body-22"
          level="600"
          color="white"
          onPress={() => navigate('signup')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

export default SignUp;
