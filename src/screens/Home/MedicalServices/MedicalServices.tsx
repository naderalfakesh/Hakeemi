import React, { Fragment, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import Button from '../../../components/Button';
import { IconName } from '../../../components/Icon';
import styles from './styles';

const SERVICES: {
  id: string;
  iconName: IconName;
  text: string;
}[] = [
  { id: '1', iconName: 'diagnose', text: 'Diagnosis' },
  { id: '2', iconName: 'badge', text: 'Bandage' },
  { id: '3', iconName: 'shot', text: 'Shots' },
  { id: '4', iconName: 'ambulance', text: 'Ambulance' },
  { id: '5', iconName: 'heart-beat', text: 'Heartbeats' },
  { id: '6', iconName: 'checkup', text: 'Checkup' },
  { id: '7', iconName: 'pill', text: 'Medicines' },
  { id: '8', iconName: 'heart-plus', text: 'Advice' },
];

interface Props {
  style?: ViewStyle;
  onPress?: (services: Array<string>) => void;
}

const MedicalServices = ({ style, onPress }: Props) => {
  const [selected, setSelected] = useState<Array<string>>([]);

  return (
    <Fragment>
      <View style={[styles.base, style]}>
        {SERVICES.map(({ id, iconName, text }, index) => (
          <Button
            style={(index + 1) % 4 ? styles.button : undefined}
            theme={selected.includes(id) ? 'primary' : 'grey'}
            size="squareIcon"
            iconName={iconName}
            onPress={() =>
              selected.includes(id)
                ? setSelected(selected.filter(item => item !== id))
                : setSelected([...selected, id])
            }>
            {text}
          </Button>
        ))}
      </View>
      <Button
        testID="search-button"
        onPress={() => onPress && onPress(selected)}>
        Available doctors
      </Button>
    </Fragment>
  );
};

export default MedicalServices;
