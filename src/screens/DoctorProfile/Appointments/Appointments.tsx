import React from 'react';
import { View } from 'react-native';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import styles from './styles';
import { format } from 'date-fns';

interface Props {
  title: string;
  dateList: Array<Date>;
}
const Appointments = ({ title, dateList }: Props) => {
  return (
    <View style={styles.container}>
      <Text color="black" size="head-24" style={styles.title}>
        {title}
      </Text>
      <View style={styles.listContainer}>
        {dateList.map((item, index) => (
          <Button
            style={styles.button}
            key={index}
            highlight={false}
            theme="tertiary"
            subtitle={format(item, 'do MMM')}>
            {format(item, 'h:mm a')}
          </Button>
        ))}
      </View>
    </View>
  );
};

export default Appointments;
