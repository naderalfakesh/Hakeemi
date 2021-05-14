import { StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.medium2,
    paddingHorizontal: spacing.medium2,
    backgroundColor: colors.white,
  },
  card: {
    flexDirection: 'row',
    marginBottom: spacing.small4,
    borderRadius: spacing.small3,
    overflow: 'hidden',
  },
  avatar: {
    height: 140,
    width: 134,
    backgroundColor: 'rgba(214, 250, 255, 1)',
    justifyContent: 'flex-end',
  },
  cardContent: {
    backgroundColor: 'rgba(251, 251, 251, 1)',
    justifyContent: 'center',
    paddingHorizontal: spacing.small3,
    flexShrink: 1,
  },
  bio: { marginTop: spacing.mini3 },
  listHeader: { marginBottom: spacing.medium2 },
});
