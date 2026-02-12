import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  subtitle: '#8A8A8A',
  cardBackground: '#FFFFFF',
  cardBorder: '#E8E0D0',
  timelineTitle: '#1A1A1A',
  timelineDescription: '#8A8A8A',
  timelineDot: '#2C2C2C',
  timelineLine: '#E8E0D0',
  buttonBackground: '#C9A96E',
  buttonBackgroundPressed: '#D4BE8A',
  buttonText: '#1A1A1A',
};

const timelineItems = [
  {
    title: 'Install the app',
    description: 'Set it up for your goals',
  },
  {
    title: 'Free trial starts',
    description: 'Enjoy full access, totally free for your first 3 days',
  },
  {
    title: 'Trial reminder',
    description: 'To let you know it\'s ending soon',
  },
  {
    title: 'Become member',
    description: 'Your trial ends unless cancelled',
  },
];

export default function FreeTrialScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/prayer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.heading}>Claim your free trial</Text>
          <Text style={styles.subtitle}>
            You won't be charged anything today
          </Text>

          <View style={styles.card}>
            {timelineItems.map((item, index) => (
              <View key={item.title} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot} />
                  {index < timelineItems.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleStart}>
            {({ pressed }) => (
              <LinearGradient
                colors={['#E8D5A8', '#C9A96E']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.button, pressed && styles.buttonPressed]}
              >
                <Text style={styles.buttonText}>Start your free trial now</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 42,
    color: colors.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: colors.subtitle,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.timelineDot,
    marginTop: 4,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.timelineLine,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: colors.timelineTitle,
  },
  timelineDescription: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: colors.timelineDescription,
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: colors.buttonText,
  },
});
