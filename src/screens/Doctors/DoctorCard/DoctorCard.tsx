import { useNavigation } from '@react-navigation/native';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, TouchableOpacity, View } from 'react-native';
import Text from '../../../components/Text';
import { Doctor } from '../Doctors';
import styles from '../styles';

interface Props {
  item: Doctor;
}
const Card: FC<Props> = ({ item }) => {
  const { t } = useTranslation('doctors');
  const { navigate } = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigate('DoctorProfileModal', { id: item.id })}
      style={styles.card}>
      <View style={styles.avatar}>
        <Image source={{ uri: item.image, height: 134, width: 134 }} />
      </View>
      <View style={styles.cardContent}>
        <Text color="black" size="head-20">
          {t('doctorName', { name: item.name })}
        </Text>
        <Text color="black" size="body-14">
          {item.specialization}
        </Text>
        <Text style={styles.bio} color="dark" size="body-12">
          {item.bio}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Card;
