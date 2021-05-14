import React, { FC } from 'react';
import { Pressable, ViewStyle, PressableProps } from 'react-native';
import Icon, { IconName } from '../Icon';
import Text, { Props as TextProps } from '../Text';
import styles, {
  pressedStyle,
  Sizes,
  Themes,
  themeStyle,
  sizeStyle,
  iconColor,
} from './styles';

interface Props extends PressableProps {
  style?: ViewStyle;
  theme?: Themes;
  size?: Sizes;
  iconName?: IconName;
  highlight?: boolean;
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
    case 'squareIcon':
      return { size: 'button-8', level: '400' };
    case 'inlineIcon':
      return { size: 'body-16', level: '400' };
  }
};

const Button: FC<Props> = ({
  children,
  style,
  size = 'medium',
  theme = 'primary',
  iconName,
  onPress,
  highlight = true,
  ...otherProps
}) => {
  return (
    <Pressable
      testID="Button"
      style={({ pressed }) => [
        styles.base,
        themeStyle[theme],
        sizeStyle[size],
        pressed && highlight && pressedStyle[theme],
        size === 'inlineIcon' && styles.inlineIcon,
        style,
      ]}
      onPress={onPress && onPress}
      {...otherProps}>
      {iconName && (
        <Icon
          style={styles.icon}
          name={iconName}
          size={24}
          color={iconColor[theme].color}
        />
      )}
      <Text color={mapTextColor(theme)} {...mapTextSize(size)}>
        {children}
      </Text>
    </Pressable>
  );
};

export default Button;
