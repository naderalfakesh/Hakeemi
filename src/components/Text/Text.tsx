import React, { FC } from 'react';
import { TextStyle, Text as TextBase, StyleSheet } from 'react-native';
import styles, { Color, colorTheme, Size, sizeTheme } from './styles';

export interface Props {
  style?: TextStyle;
  size?: Size;
  color?: Color;
  onPress?: () => void;
}

const Text: FC<Props> = ({
  children,
  style,
  size = 'body-16',
  color = 'primary',
  onPress,
  ...otherProps
}) => {
  const flatStyle = StyleSheet.flatten([
    styles.base,
    colorTheme[color],
    sizeTheme[size],
    style,
  ]);

  return (
    <TextBase style={flatStyle} onPress={onPress} {...otherProps}>
      {children}
    </TextBase>
  );
};

export default Text;
