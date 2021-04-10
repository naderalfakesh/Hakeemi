import React, { FC } from 'react';
import { View } from 'react-native';
import styles, { DOCTOR_ILLUSTRATION_HEIGHT } from './styles';
import HomeDoctor from '../../../assets/homeDoctor.svg';
import HomeBgPattern from '../../../assets/homeBgPattern.svg';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/core';

const Welcome: FC = () => {
  const { navigate } = useNavigation();
  return (
    <View style={styles.container}>
      <HomeDoctor
        style={styles.doctorIllustration}
        height={DOCTOR_ILLUSTRATION_HEIGHT}
      />
      <View style={styles.getStartedContainer}>
        <HomeBgPattern
          style={styles.backgroundPattern}
          height={'100%'}
          width={'100%'}
          preserveAspectRatio="xMinYMin slice"
        />
        <Button
          style={styles.signUpBtn}
          theme="secondary"
          size="big"
          onPress={() => navigate('signup')}>
          Get Started For Free
        </Button>
        <Text
          style={styles.loginText}
          size="body-16"
          level="600"
          align="center"
          color="white">
          {'Already Have An Account? '}
          <Text
            style={styles.loginUnderline}
            size="body-16"
            level="600"
            color="white"
            onPress={() => navigate('signin')}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default Welcome;
