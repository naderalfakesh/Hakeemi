import React, { FC } from 'react';
import { ColorValue, StyleSheet } from 'react-native';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import { IconProps as BaseIconProps } from 'react-native-vector-icons/Icon';
import * as config from './config.json';
const BaseIcon = createIconSetFromFontello(config);

export type IconName =
  | 'advice'
  | 'ambulance'
  | 'badge'
  | 'checkup'
  | 'close'
  | 'diagnos'
  | 'heart-beat'
  | 'heart-fill'
  | 'heart'
  | 'left-arrow'
  | 'nav-1'
  | 'pill'
  | 'search'
  | 'shot';

export interface IconProps extends Omit<BaseIconProps, 'color'> {
  name: IconName;
  color?: ColorValue;
}

const Icon: FC<IconProps> = ({ style, size = 24, color, ...otherProps }) => (
  <BaseIcon
    style={StyleSheet.compose({ lineHeight: size, textAlign: 'center' }, style)}
    size={size}
    color={color as string}
    {...otherProps}
  />
);

export default Icon;
