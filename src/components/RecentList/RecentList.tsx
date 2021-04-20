import React, { FC } from 'react';
import { View, ViewStyle, Image } from 'react-native';
import styles from './styles';
import Avatar from '../Avatar';
import Button from '../Button';

const AVATAR_SIZE = 50;
const ITEM_COUNT_TO_SHOW = 4;

type item = {
  id: string;
  url: string;
};
interface Props {
  style?: ViewStyle;
  imageList: Array<item>;
  onPress?: (id: string) => void;
  onExtraPress?: () => void;
}

const RecentList: FC<Props> = ({ style, imageList, onPress, onExtraPress }) => {
  return (
    <View testID="list" style={[styles.base, style]}>
      <View style={styles.list}>
        {imageList && imageList.length
          ? imageList.slice(0, ITEM_COUNT_TO_SHOW).map(image => (
              <Avatar
                key={image.id}
                theme="secondary"
                style={styles.avatar}
                onPress={() => onPress && onPress(image.id)}
                size={AVATAR_SIZE}
                shape="rounded"
                roundness={0.4}>
                <Image
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  source={{
                    uri: image.url,
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                  }}
                />
              </Avatar>
            ))
          : undefined}
      </View>
      {imageList.length > ITEM_COUNT_TO_SHOW && (
        <Button
          style={styles.extraButton}
          onPress={() => onExtraPress && onExtraPress()}>
          {`+ ${imageList.length - ITEM_COUNT_TO_SHOW}`}
        </Button>
      )}
    </View>
  );
};

export default RecentList;
