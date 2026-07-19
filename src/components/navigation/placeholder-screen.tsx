import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlaceholderScreenProps = {
  description: string;
  title: string;
};

export function PlaceholderScreen({ description, title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#102A2A',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  description: {
    color: '#4D6564',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 8,
    maxWidth: 480,
  },
});
