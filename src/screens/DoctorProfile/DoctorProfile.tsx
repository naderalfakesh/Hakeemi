import { useNavigation } from '@react-navigation/native';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, StatusBar } from 'react-native';
import BgPattern from '../../../assets/homeBgPattern.svg';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import colors from '../../theme/colors';
import Appointments from './Appointments';
import ContactInfo from './ContactInfo';
import Description from './Description';
import DoctorHeader from './DoctorHeader';
import styles from './styles';
const DoctorProfile = () => {
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation('doctorProfile');

  return (
    <Fragment>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={true}
      />

      <ScrollView bounces={false} contentContainerStyle={styles.container}>
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
          <DoctorHeader
            title="Dr. Afreen Khan"
            subtitle="Heart Specialist - Surgeon"
            imagURL="https://images2.imgbox.com/5f/04/DMMRtfvg_o.png"
          />
          <ContactInfo
            address="8502 Preston Rd. Inglewood, Maine 98380"
            phone="(405) 555-0128"
            email=" info@drafreen.com"
          />
          <Description
            title={t('description.title')}
            details="Dr. Afreen Khan is a cardiologist and nationally recognized pioneer in women’s heart health and her New York City practice Total Heart Care is focused primarily to care for women."
          />
          <Appointments
            title={t('appointments.title')}
            dateList={[
              new Date(2021, 5, 3, 9, 15),
              new Date(2021, 5, 4, 10, 55),
            ]}
          />
          <Button
            style={styles.button}
            size="big"
            onPress={() => navigate('ScheduleDialog')}>
            {t('button.text')}
          </Button>
        </View>
      </ScrollView>
    </Fragment>
  );
};

export default DoctorProfile;
