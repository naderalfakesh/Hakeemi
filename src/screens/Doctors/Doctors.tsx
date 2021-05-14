import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import Text from '../../components/Text';
import styles from './styles';
import DoctorCard from './DoctorCard';

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  image: string;
};

const DATA: Array<Doctor> = [
  {
    id: '1',
    name: 'Afreen Khan',
    specialization: 'Heart Specialist - Surgeon',
    bio:
      'Dr. Afreen Khan is a cardiologist and nationally recognized pioneer in women’s heart health.',
    image: 'https://images2.imgbox.com/5f/04/DMMRtfvg_o.png',
  },
  {
    id: '2',
    name: 'Salman Khan',
    specialization: 'Heart Specialist - Surgeon',
    bio:
      'Dr. Salman Khan is a cardiologist and nationally recognized pioneer in women’s heart health.',
    image: 'https://images2.imgbox.com/38/46/lRBBYcMj_o.png',
  },
  {
    id: '3',
    name: 'Shambhaviv',
    specialization: 'Heart Specialist - Surgeon',
    bio:
      'Dr. Shambhavi Mishra is a cardiologist and nationally recognized pioneer in women’s heart health.',
    image: 'https://images2.imgbox.com/19/8d/h79FIvf2_o.png',
  },
];

const ListHeader = () => {
  const { t } = useTranslation('doctors');
  return (
    <>
      <Text color="black" size="head-24" level="600">
        {t('title')}
      </Text>
      <Text color="dark" size="body-14">
        {t('subtitle')}
      </Text>
    </>
  );
};
const Doctors: FC = () => {
  return (
    <FlatList
      style={styles.container}
      data={DATA}
      ListHeaderComponent={ListHeader}
      ListHeaderComponentStyle={styles.listHeader}
      renderItem={({ item }) => <DoctorCard item={item} />}
      keyExtractor={item => item.id}
    />
  );
};

export default Doctors;
