import { StyleSheet } from 'react-native';
import colors, { palette } from '../../theme/colors';
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
    backgroundColor: palette.primary.lighter,
    justifyContent: 'flex-end',
  },
  cardContent: {
    backgroundColor: palette.secondary.light,
    justifyContent: 'center',
    paddingHorizontal: spacing.small3,
    flexShrink: 1,
  },
  bio: { marginTop: spacing.mini3 },
  listHeader: { marginBottom: spacing.medium2 },
});
