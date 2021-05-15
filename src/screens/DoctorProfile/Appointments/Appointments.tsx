import React from 'react';
import { View } from 'react-native';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import styles from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  dateList: Array<Date>;
}
const Appointments = ({ title, dateList }: Props) => {
  const { t } = useTranslation('doctorProfile');
  return (
    <View style={styles.container}>
      <Text color="black" size="head-24" style={styles.title}>
        {title}
      </Text>
      <View style={styles.listContainer}>
        {dateList.map((date, index) => (
          <Button
            style={styles.button}
            key={index}
            highlight={false}
            theme="tertiary"
            subtitle={t('dateFormat', { date })}>
            {t('timeFormat', { date })}
          </Button>
        ))}
      </View>
    </View>
  );
};

export default Appointments;
