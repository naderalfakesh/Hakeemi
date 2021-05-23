import { useNavigation } from '@react-navigation/native';
import { addMinutes, set } from 'date-fns';
import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, StatusBar } from 'react-native';
import BgPattern from '../../../assets/homeBgPattern.svg';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Text from '../../components/Text';
import styles from './styles';

const START = { hours: 10, minutes: 0 };
const DURATION = 60;
const APPOINTMENT_COUNT = 9;
const TAKEN = [3, 8];

const startTime = set(new Date(), START);
const TIMES: Array<Date> = [];
for (let index = 0; index < APPOINTMENT_COUNT; index++) {
  TIMES.push(addMinutes(startTime, index * DURATION));
}

const ScheduleDialog = () => {
  const { goBack } = useNavigation();
  const { t } = useTranslation('scheduleDialog');
  const [selected, setSelected] = useState<number | null>(null);
  const [taken, setTaken] = useState<number[]>([]);
  useEffect(() => {
    setTaken(TAKEN);
  }, []);

  return (
    <Fragment>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(0, 188, 212, 1)"
        translucent={true}
      />

      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <Icon
          style={styles.back}
          name="left-arrow"
          size={24}
          onPress={goBack}
        />
        <BgPattern
          style={styles.pattern}
          height="100%"
          width="100%"
          preserveAspectRatio="xMaxYMin slice"
        />
        <View style={styles.paper}>
          <View>
            <Text size="head-24" level="600" color="black">
              {t('description.title')}
            </Text>
            <Text size="body-16" color="dark" style={styles.subtitle}>
              {t('description.subtitle')}
            </Text>
          </View>
          <View style={styles.timesHeader}>
            <Text size="head-20" color="black">
              {t('appointments.title')}
            </Text>
            <Text size="body-16" color="dark" style={styles.subtitle}>
              {t('appointments.subtitle')}
            </Text>
          </View>
          <View style={styles.timesContainer}>
            {TIMES.map((time, index) => {
              const isSelected = selected === index;
              const isTaken = taken.includes(index);

              return (
                <Button
                  style={styles.timeButton}
                  key={index}
                  highlight={false}
                  theme={isTaken ? 'grey' : isSelected ? 'primary' : 'tertiary'}
                  onPress={() => (!isTaken ? setSelected(index) : undefined)}>
                  {t('timeFormat', { time })}
                </Button>
              );
            })}
          </View>
          <Button style={styles.button} size="big">
            {t('button.text')}
          </Button>
        </View>
      </ScrollView>
    </Fragment>
  );
};

export default ScheduleDialog;
