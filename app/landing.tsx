import { useEffect } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  // Two phase-offset drivers for layered wavering
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const phase3 = useSharedValue(0);

  useEffect(() => {
    // Layer 1: slow primary cycle
    phase1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // Layer 2: offset medium cycle
    phase2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    // Layer 3: faster accent cycle
    phase3.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [phase1, phase2, phase3]);

  // Cool blue-dominant gradient — fades in/out with phase1
  const coolStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase1.value, [0, 0.5, 1], [0.2, 1, 0.2]),
  }));

  // Warm pink/red-dominant gradient — counter-phase to cool
  const warmStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase1.value, [0, 0.5, 1], [1, 0.15, 1]),
  }));

  // Mid-tone purple accent — offset timing for organic feel
  const accentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase2.value, [0, 0.5, 1], [0.6, 0, 0.6]),
  }));

  // Deep saturated burst for extra drama
  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase3.value, [0, 0.4, 0.6, 1], [0, 0.7, 0.7, 0]),
  }));

  const handleGetStarted = () => {
    router.push('/name-input');
  };

  return (
    <View style={styles.root}>
      {/* Base gradient — always visible */}
      <LinearGradient
        colors={['#6A9FCC', '#9A8FB0', '#D07070']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Cool layer — strong blue sky */}
      <Animated.View style={[StyleSheet.absoluteFill, coolStyle]}>
        <LinearGradient
          colors={['#4A88C4', '#7AAAD8', '#B898B0']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Warm layer — strong pink/red sunset */}
      <Animated.View style={[StyleSheet.absoluteFill, warmStyle]}>
        <LinearGradient
          colors={['#9090C0', '#D87090', '#E85858']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Accent layer — purple mid-tones */}
      <Animated.View style={[StyleSheet.absoluteFill, accentStyle]}>
        <LinearGradient
          colors={['#7090C8', '#B078B8', '#D08888']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Burst layer — saturated drama */}
      <Animated.View style={[StyleSheet.absoluteFill, burstStyle]}>
        <LinearGradient
          colors={['#5888D0', '#C870A0', '#F06060']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <SafeAreaView style={styles.container}>
        {/* Dove Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/dove_transparency.png')}
            style={styles.doveImage}
            resizeMode="contain"
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Dove</Text>
          <Text style={styles.subtitle}>
            Find peace through{'\n'}stronger connection with God.
          </Text>
        </View>

        {/* Get Started Button */}
        <View style={styles.footer}>
          <Pressable onPress={handleGetStarted}>
            {({ pressed }) => (
              <View style={[styles.button, pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>Get Started</Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  doveImage: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 48,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});