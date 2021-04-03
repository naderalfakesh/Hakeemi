import React, { FC } from 'react';
import { View } from 'react-native';
import styles, { DOCTOR_ILLUSTRATION_HEIGHT } from './styles';
import HomeDoctor from '../../../assets/homeDoctor.svg';
import HomeBgPattern from '../../../assets/homeBgPattern.svg';
import Text from '../../components/Text';
import Button from '../../components/Button';

const Welcome: FC = () => {
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
          onPress={() => console.log('Navigate to sign up')}>
          Get Started For Free
        </Button>
        <Text style={styles.loginText} size="body-16" color="white">
          {'Already Have An Account? '}
          <Text
            style={styles.loginUnderline}
            size="body-16"
            color="white"
            onPress={() => console.log('Navigate to Login')}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default Welcome;
