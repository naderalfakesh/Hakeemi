import { StyleSheet } from 'react-native';
import colors, { palette } from '../../theme/colors';
import spacing from '../../theme/spacing';

export default StyleSheet.create({
  base: {
    backgroundColor: palette.grey.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium1,
    paddingVertical: spacing.medium1,
    borderRadius: 30,
  },
  input: {
    color: colors.black,
    fontSize: 18,
    lineHeight: 24,
    flexGrow: 1,
  },
  icon: {
    padding: spacing.tiny,
    marginRight: 10,
  },
});
