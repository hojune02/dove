import { useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Fonts } from '@/constants/theme';
import { quotes } from '@/constants/quotes';
import { getUserData, saveUserData, UserData } from '@/lib/storage';

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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_SHORT_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function padTwo(n: number) {
  return n.toString().padStart(2, '0');
}

export default function PrayerScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState<UserData>({});

  const openProfile = async () => {
    const data = await getUserData();
    setUserData(data);
    setProfileVisible(true);
  };

  // Alarm sheet state
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [alarmTime, setAlarmTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [alarmDays, setAlarmDays] = useState<boolean[]>([
    false, true, true, true, true, true, false,
  ]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const openAlarm = async () => {
    const data = await getUserData();
    if (data.reminder) {
      const [h, m] = data.reminder.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setAlarmTime(d);
      setAlarmDays(data.reminder.days);
    }
    setShowTimePicker(false);
    setAlarmVisible(true);
  };

  const toggleAlarmDay = (index: number) => {
    setAlarmDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const onAlarmTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setAlarmTime(selectedDate);
    }
  };

  const handleSaveAlarm = async () => {
    const timeStr = `${padTwo(alarmTime.getHours())}:${padTwo(alarmTime.getMinutes())}`;
    await saveUserData({ reminder: { time: timeStr, days: alarmDays } });
    setAlarmVisible(false);
  };

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

          <Pressable style={styles.tabButtonSquare} onPress={openAlarm}>
            <Ionicons name="alarm-outline" size={22} color={colors.textPrimary} />
          </Pressable>

          <Pressable style={styles.tabButtonSquare} onPress={openProfile}>
            <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Profile Bottom Sheet */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.profileOverlay}>
          <Pressable style={styles.profileBackdrop} onPress={() => setProfileVisible(false)} />
          <View style={styles.profileSheet}>
            {/* Header row */}
            <View style={styles.profileHeader}>
              <Pressable onPress={() => setProfileVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </Pressable>
            </View>

            <Text style={styles.profileTitle}>Profile</Text>

            <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
              {userData.name && (
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>Name: </Text>
                    {userData.name}
                  </Text>
                </View>
              )}
              {userData.faithPractice && (
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>Faith Practice: </Text>
                    {userData.faithPractice}
                  </Text>
                </View>
              )}
              {userData.topics && userData.topics.length > 0 && (
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>Topics: </Text>
                    {userData.topics.join(', ')}
                  </Text>
                </View>
              )}
              {userData.goals && (
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>Goals: </Text>
                    {userData.goals}
                  </Text>
                </View>
              )}
              {userData.reminder && (
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bulletLabel}>Reminder: </Text>
                    {userData.reminder.time} on{' '}
                    {userData.reminder.days
                      .map((on, i) => (on ? DAY_LABELS[i] : null))
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              )}
              {!userData.name &&
                !userData.faithPractice &&
                !userData.topics?.length &&
                !userData.goals &&
                !userData.reminder && (
                  <Text style={styles.emptyText}>No profile data yet.</Text>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alarm Bottom Sheet */}
      <Modal
        visible={alarmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAlarmVisible(false)}
      >
        <View style={styles.profileOverlay}>
          <Pressable style={styles.profileBackdrop} onPress={() => setAlarmVisible(false)} />
          <View style={styles.profileSheet}>
            {/* Header row */}
            <View style={styles.profileHeader}>
              <Pressable onPress={() => setAlarmVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </Pressable>
            </View>

            <Text style={styles.profileTitle}>Set the alarm</Text>

            <View style={styles.alarmCard}>
              <Pressable
                style={styles.alarmTimeRow}
                onPress={() => setShowTimePicker((v) => !v)}
              >
                <Text style={styles.alarmLabel}>Time</Text>
                <View style={styles.alarmTimeBadge}>
                  <Text style={styles.alarmTimeText}>
                    {padTwo(alarmTime.getHours())}:{padTwo(alarmTime.getMinutes())}
                  </Text>
                </View>
              </Pressable>

              {showTimePicker && (
                <DateTimePicker
                  value={alarmTime}
                  mode="time"
                  display="spinner"
                  onChange={onAlarmTimeChange}
                  style={styles.alarmPicker}
                />
              )}

              <View style={styles.alarmDivider} />

              <View style={styles.alarmRepeatSection}>
                <Text style={styles.alarmLabel}>Repeat</Text>
                <View style={styles.alarmDaysRow}>
                  {DAY_SHORT_LABELS.map((label, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.alarmDayButton,
                        alarmDays[index] && styles.alarmDayButtonSelected,
                      ]}
                      onPress={() => toggleAlarmDay(index)}
                    >
                      <Text
                        style={[
                          styles.alarmDayText,
                          alarmDays[index] && styles.alarmDayTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.alarmSaveButton,
                pressed && styles.alarmSaveButtonPressed,
              ]}
              onPress={handleSaveAlarm}
            >
              <Text style={styles.alarmSaveButtonText}>Set alarm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  /* Profile Sheet */
  profileOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  profileSheet: {
    height: SCREEN_HEIGHT * 0.88,
    backgroundColor: '#EDEAE5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  profileTitle: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: '#1A1A1A',
    marginBottom: 28,
  },
  profileContent: {
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bulletDot: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    color: '#1A1A1A',
    marginRight: 10,
    lineHeight: 24,
  },
  bulletText: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: '#1A1A1A',
    lineHeight: 24,
    flex: 1,
  },
  bulletLabel: {
    fontFamily: Fonts.sansSemiBold,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 40,
  },

  /* Alarm Sheet */
  alarmCard: {
    backgroundColor: '#E5E2DC',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  alarmTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmLabel: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: '#1A1A1A',
  },
  alarmTimeBadge: {
    backgroundColor: '#D5D0C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alarmTimeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#1A1A1A',
  },
  alarmPicker: {
    height: 150,
    marginTop: 4,
    alignSelf: 'center',
  },
  alarmDivider: {
    height: 1,
    backgroundColor: '#D5D0C8',
    marginVertical: 14,
  },
  alarmRepeatSection: {
    gap: 14,
  },
  alarmDaysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  alarmDayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D5D0C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmDayButtonSelected: {
    backgroundColor: '#2C2C2C',
  },
  alarmDayText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: '#1A1A1A',
  },
  alarmDayTextSelected: {
    color: '#FFFFFF',
  },
  alarmSaveButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  alarmSaveButtonPressed: {
    opacity: 0.8,
  },
  alarmSaveButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
