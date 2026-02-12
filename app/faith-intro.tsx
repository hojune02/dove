import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  skip: '#8A8A8A',
  buttonBackground: '#C9A96E',
  buttonBackgroundPressed: '#D4BE8A',
  buttonText: '#1A1A1A',
};

export default function FaithIntroScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/faith-practice');
  };

  const handleSkip = () => {
    router.push('/free-trial');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={handleSkip} hitSlop={16}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.heading}>
            Let's talk about your{'\n'}faith and your{'\n'}personal goals
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleContinue}>
            {({ pressed }) => (
              <LinearGradient
                colors={['#E8D5A8', '#C9A96E']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.button, pressed && styles.buttonPressed]}
              >
                <Text style={styles.buttonText}>Continue</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  skipText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: colors.skip,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    lineHeight: 48,
    color: colors.heading,
    textAlign: 'center',
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
