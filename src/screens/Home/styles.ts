import { StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.medium2,
  },
  doctorIcon: { marginBottom: -1 }, // A fix for extra space in svg
  title: { marginVertical: spacing.small1 },
  search: { marginBottom: spacing.mini3 },
  card: { marginBottom: spacing.medium2 },
  recent: { marginBottom: spacing.medium2 },
  innerContainer: { marginTop: spacing.small3 },
});
