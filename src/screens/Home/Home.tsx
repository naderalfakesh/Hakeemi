import React, { FC, Fragment, useState } from 'react';
import { StatusBar, View } from 'react-native';
import Text from '../../components/Text';
import SearchField from '../../components/SearchField';
import HomeCard from '../../components/Card';
import CardDoctor from '../../../assets/CardDoctor.svg';
import RecentDoctors from '../../components/RecentList';
import MedicalServices from './MedicalServices';
import styles from './styles';
import { ScrollView } from 'react-native-gesture-handler';
import { Trans, useTranslation } from 'react-i18next';

const ITEMS = [
  { id: '1', url: 'https://images2.imgbox.com/f7/bb/7HJeSokt_o.png' },
  { id: '2', url: 'https://images2.imgbox.com/5d/c9/sqb7cQMS_o.png' },
  { id: '3', url: 'https://images2.imgbox.com/19/80/QQZwXNbP_o.png' },
  { id: '4', url: 'https://images2.imgbox.com/4b/fe/k8H0shP2_o.png' },
  { id: '5', url: 'https://imgbox.com/k8H0shP2' },
  { id: '6', url: 'https://imgbox.com/lRBBYcMj' },
  { id: '7', url: 'https://imgbox.com/h79FIvf2' },
];

const Home: FC = () => {
  const { t } = useTranslation('home');
  const [term, setTerm] = useState<string>('');
  const [showCard, setShowCard] = useState<boolean>(true);
  const findDoctors = (services: Array<string>) => {
    console.log(services);
  };
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <View style={styles.title}>
          <Text color="black" size="head-30">
            <Trans
              i18nKey="home:header"
              values={{ name: 'Nader' }}
              components={{
                b: <Text color="black" size="head-30" level="500" />,
              }}
            />
          </Text>
        </View>
        <View style={styles.search}>
          <SearchField
            placeholder={t('search.placeholder')}
            value={term}
            onChangeText={setTerm}
            handleClear={() => setTerm('')}
          />
        </View>
        <View style={styles.card}>
          {showCard && (
            <HomeCard
              onClose={() => setShowCard(false)}
              title={t('card.title')}
              subtitle={t('card.subtitle')}
              rightNode={<CardDoctor style={styles.doctorIcon} />}
            />
          )}
        </View>
        <View style={styles.recent}>
          <Text color="black" size="head-24" level="600">
            {t('doctors.title')}
          </Text>
          <Text color="dark" size="body-14">
            {t('doctors.subtitle', { count: 12 })}
          </Text>
          <RecentDoctors
            style={styles.innerContainer}
            imageList={ITEMS}
            onPress={console.log}
          />
        </View>
        <View>
          <Text color="black" size="head-24" level="600">
            {t('services.title')}
          </Text>
          <Text color="dark" size="body-14">
            {t('services.subtitle')}
          </Text>
          <MedicalServices
            style={styles.innerContainer}
            onPress={findDoctors}
          />
        </View>
      </ScrollView>
    </Fragment>
  );
};

export default Home;
