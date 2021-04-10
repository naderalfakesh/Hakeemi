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
const mapTextSize = (size: Sizes): TextProps['size'] => {
  switch (size) {
    case 'small':
      return 'body-16';
    case 'medium':
      return 'body-16';
    case 'big':
      return 'button-22';
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
      <Text size={mapTextSize(size)} color={mapTextColor(theme)}>
        {children}
      </Text>
    </Pressable>
  );
};

export default Button;
