import { useCallback, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { quotes } from '@/constants/quotes';

const SWIPE_THRESHOLD = 80;
const EXIT_DISTANCE = 350;
const MAX_FAVORITES = 5;

const colors = {
  textPrimary: '#1A1A1A',
  textSecondary: '#3A3A3A',
  iconColor: '#2C2C2C',
  pillBackground: 'rgba(255, 255, 255, 0.7)',
  progressTrack: 'rgba(0, 0, 0, 0.15)',
  progressFill: '#2C2C2C',
  tabBackground: 'rgba(255, 255, 255, 0.45)',
  badgeBackground: '#E85D5D',
  badgeText: '#FFFFFF',
};

export default function PrayerScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const translateY = useSharedValue(0);
  const swapPhase = useSharedValue(0); // 1 = layers hidden during index swap

  const nextIndex = (currentIndex + 1) % quotes.length;

  const completeTransition = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
    // Double rAF ensures React has committed & painted the new text
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Smooth fade-in instead of instant reveal
        swapPhase.value = withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        });
      });
    });
  }, [swapPhase]);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      // Follow finger 1:1 on upward swipe
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      } else {
        translateY.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationY < -SWIPE_THRESHOLD) {
        // Faster flick → much slower animation so the next quote rises gradually
        const velocity = Math.abs(e.velocityY);
        const duration = Math.min(1800, Math.max(800, velocity * 0.6));

        translateY.value = withTiming(
          -EXIT_DISTANCE,
          { duration, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) {
              swapPhase.value = 1; // hide layers during swap
              translateY.value = 0; // reset position on UI thread while hidden
              runOnJS(completeTransition)();
            }
          },
        );
      } else {
        // Snap back smoothly
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 400,
        });
      }
    });

  // Current quote: exits upward, fades out gradually, scales down
  const currentQuoteStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      {
        scale: interpolate(
          translateY.value,
          [-EXIT_DISTANCE, 0],
          [0.85, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity:
      (1 - swapPhase.value) *
      interpolate(
        translateY.value,
        [-EXIT_DISTANCE, -EXIT_DISTANCE * 0.6, -EXIT_DISTANCE * 0.15, 0],
        [0, 0.15, 0.85, 1],
        Extrapolation.CLAMP,
      ),
  }));

  // Next quote: rises from below, fades in gradually, scales up
  const nextQuoteStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          translateY.value,
          [-EXIT_DISTANCE, 0],
          [0, EXIT_DISTANCE * 0.6],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          translateY.value,
          [-EXIT_DISTANCE, 0],
          [1, 0.9],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity:
      (1 - swapPhase.value) *
      interpolate(
        translateY.value,
        [-EXIT_DISTANCE, -EXIT_DISTANCE * 0.5, -EXIT_DISTANCE * 0.15, 0],
        [1, 0.7, 0.1, 0],
        Extrapolation.CLAMP,
      ),
  }));

  const isFavorited = favorites.has(currentIndex);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const handleShare = async () => {
    const q = quotes[currentIndex];
    try {
      await Share.share({
        message: `\u201C${q.text}\u201D\n\n\u2014 ${q.ref}`,
      });
    } catch {
      // user cancelled
    }
  };

  const quote = quotes[currentIndex];
  const nextQuote = quotes[nextIndex];
  const favoriteCount = Math.min(favorites.size, MAX_FAVORITES);
  const progressWidth = (favoriteCount / MAX_FAVORITES) * 100;

  return (
    <LinearGradient
      colors={['#8399B5', '#A8A0AE', '#C8A89C', '#D8BB9A']}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Progress Pill */}
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Ionicons name="heart-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.pillText}>
              {favoriteCount}/{MAX_FAVORITES}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
            </View>
          </View>
        </View>

        {/* Quote Area — two layers for interactive crossfade */}
        <GestureDetector gesture={gesture}>
          <Animated.View style={styles.quoteArea}>
            {/* Next quote (behind, rises from below) */}
            <Animated.View style={[styles.quoteAbsolute, nextQuoteStyle]}>
              <Text style={styles.quoteText}>{nextQuote.text}</Text>
              <Text style={styles.quoteRef}>{'\u2014'}{nextQuote.ref}</Text>
            </Animated.View>

            {/* Current quote (front, exits upward) */}
            <Animated.View style={[styles.quoteAbsolute, currentQuoteStyle]}>
              <Text style={styles.quoteText}>{quote.text}</Text>
              <Text style={styles.quoteRef}>{'\u2014'}{quote.ref}</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable hitSlop={12} style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={28} color={colors.iconColor} />
          </Pressable>
          <Pressable hitSlop={12} style={styles.actionButton} onPress={toggleFavorite}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={28}
              color={colors.iconColor}
            />
          </Pressable>
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable style={styles.tabButtonWide}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <Ionicons name="grid-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.tabLabel}>General</Text>
          </Pressable>

          <View style={styles.tabSpacer} />

          <Pressable style={styles.tabButtonSquare}>
            <Ionicons name="key-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          <Pressable style={styles.tabButtonSquare}>
            <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  /* Progress Pill */
  pillRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pillBackground,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  progressTrack: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.progressFill,
  },

  /* Quote Area */
  quoteArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  quoteAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  quoteText: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 44,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quoteRef: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 24,
  },
  actionButton: {
    padding: 4,
  },

  /* Bottom Tab Bar */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  tabButtonWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tabBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  newBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    backgroundColor: colors.badgeBackground,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: colors.badgeText,
  },
  tabSpacer: {
    flex: 1,
  },
  tabButtonSquare: {
    backgroundColor: colors.tabBackground,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
