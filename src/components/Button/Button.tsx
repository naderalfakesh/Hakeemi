import React, { FC } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Text, { Props as TextProps } from '../Text';
import styles, {
  pressedStyle,
  Sizes,
  Themes,
  themeStyle,
  sizeStyle,
} from './styles';

interface Props {
  style?: ViewStyle;
  theme?: Themes;
  size?: Sizes;
  onPress?: () => void;
}

const mapTextColor = (theme: Themes): TextProps['color'] => {
  switch (theme) {
    case 'primary':
      return 'white';
    case 'secondary':
      return 'secondary';
    case 'grey':
      return 'black';
  }
};

type sizeProps = {
  size: TextProps['size'];
  level: TextProps['level'];
};
const mapTextSize = (size: Sizes): sizeProps => {
  switch (size) {
    case 'small':
      return { size: 'body-16', level: '600' };
    case 'medium':
      return { size: 'body-16', level: '600' };
    case 'big':
      return { size: 'button-22', level: '600' };
  }
};

const Button: FC<Props> = ({
  children,
  style,
  size = 'medium',
  theme = 'primary',
  onPress,
  ...otherProps
}) => {
  return (
    <Pressable
      testID="Button"
      style={({ pressed }) => [
        styles.base,
        themeStyle[theme],
        sizeStyle[size],
        pressed && pressedStyle[theme],
        style,
      ]}
      onPress={onPress && onPress}
      {...otherProps}>
      <Text color={mapTextColor(theme)} {...mapTextSize(size)}>
        {children}
      </Text>
    </Pressable>
  );
};

export default Button;
