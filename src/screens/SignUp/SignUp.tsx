import React, { FC, useState } from 'react';
import { View } from 'react-native';
import styles from './styles';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/core';
import HomeBgPattern from '../../../assets/homeBgPattern.svg';
import Text from '../../components/Text';

const SignUp: FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const { goBack } = useNavigation();
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
          Sign Up
        </Text>
        <Text
          size="body-22"
          color="black"
          align="center"
          style={styles.subtitle}>
          Sign up now to make new appointments.
        </Text>
        <View style={styles.fields}>
          <TextField
            style={styles.field}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
          />
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
        <Button
          style={styles.button}
          theme="primary"
          size="big"
          onPress={() => goBack()}>
          Create A Free Account
        </Button>
      </View>
      <Text size="body-20" align="center" color="white">
        {'Already have an account? '}
        <Text
          style={styles.underline}
          size="body-20"
          level="700"
          color="white"
          onPress={() => console.log('Navigate to Sign In')}>
          Sign In
        </Text>
      </Text>
    </View>
  );
};

export default SignUp;
