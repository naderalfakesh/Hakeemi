import React, { FC } from 'react';
import { View, ViewStyle, Image } from 'react-native';
import styles from './styles';
import Avatar from '../Avatar';
import Button from '../Button';
import { Doctor } from '../../services/api/types';

const AVATAR_SIZE = 50;
const ITEM_COUNT_TO_SHOW = 4;

interface Props {
  style?: ViewStyle;
  doctors: Array<Doctor>;
  onPress?: (id: string) => void;
  onExtraPress?: () => void;
  loading: boolean;
}

const RecentList: FC<Props> = ({
  style,
  doctors,
  onPress,
  onExtraPress,
  loading,
}) => {
  return (
    <View testID="list" style={[styles.base, style]}>
      <View style={styles.list}>
        {doctors && doctors.length
          ? doctors.slice(0, ITEM_COUNT_TO_SHOW).map(doctor => (
              <Avatar
                key={doctor.id}
                theme="secondary"
                style={styles.avatar}
                onPress={() => onPress && onPress(doctor.id)}
                size={AVATAR_SIZE}
                shape="rounded"
                roundness={0.4}>
                <Image
                  resizeMode="contain"
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  source={{
                    uri: doctor.avatar,
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                  }}
                />
              </Avatar>
            ))
          : undefined}
      </View>
      {doctors.length > ITEM_COUNT_TO_SHOW && (
        <Button
          loading={loading}
          style={styles.extraButton}
          onPress={() => onExtraPress && onExtraPress()}>
          {`+ ${doctors.length - ITEM_COUNT_TO_SHOW}`}
        </Button>
      )}
    </View>
  );
};

export default RecentList;
