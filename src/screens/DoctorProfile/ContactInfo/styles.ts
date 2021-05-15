import { StyleSheet } from 'react-native';
import { palette } from '../../../theme/colors';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: palette.grey.base,
    marginTop: 16,
  },
  textContainer: { flex: 1, padding: 40 },
  divider: {
    height: '100%',
    borderRightWidth: 1,
    borderColor: palette.grey.base,
  },
});
