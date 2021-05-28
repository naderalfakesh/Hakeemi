import { StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.primary,
  },
  paper: {
    backgroundColor: 'white',
    height: '100%',
    flexGrow: 1,
    marginTop: 200,
    borderTopRightRadius: spacing.big2,
    borderTopLeftRadius: spacing.big2,
    paddingTop: spacing.medium2,
  },
  pattern: {
    position: 'absolute',
  },
  back: { position: 'absolute', top: 60, left: 25, zIndex: 1, color: 'white' },
  button: {
    marginVertical: spacing.big1,
    marginHorizontal: spacing.medium3,
  },
});
