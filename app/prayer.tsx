import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Fonts } from '@/constants/theme';
import { quotes } from '@/constants/quotes';
import { getUserData, saveUserData, UserData } from '@/lib/storage';
import { requestPermissions, scheduleReminder } from '@/lib/notifications';

const MAX_FAVORITES = 5;

const colors = {
  textPrimary: '#1A1A1A',
  textSecondary: '#3A3A3A',
  iconColor: '#2C2C2C',
  pillBackground: 'rgba(255, 255, 255, 0.7)',
  progressTrack: 'rgba(0, 0, 0, 0.15)',
  progressFill: '#2C2C2C',
  tabBackground: 'rgba(255, 255, 255, 0.45)',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_SHORT_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function padTwo(n: number) {
  return n.toString().padStart(2, '0');
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

export default function PrayerScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set()); // all-time liked quotes
  const [todayLikes, setTodayLikes] = useState<Set<number>>(new Set()); // today's likes (pill counter)
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationShownToday = useRef(false);

  const pillOpacity = useSharedValue(1);

  // Load persisted state on mount; reset daily pill if it's a new day
  const loadDailyState = useCallback(async () => {
    const data = await getUserData();
    const today = getToday();

    // Always restore all-time favorites
    if (data.likedQuotes && data.likedQuotes.length > 0) {
      setFavorites(new Set(data.likedQuotes));
    }

    // Daily pill state
    if (data.todayLikesDate === today && data.todayLikes && data.todayLikes.length > 0) {
      setTodayLikes(new Set(data.todayLikes));
      if (data.todayLikes.length >= MAX_FAVORITES) {
        pillOpacity.value = 0;
      } else {
        pillOpacity.value = 1;
      }
      if (data.celebrationShownDate === today) {
        celebrationShownToday.current = true;
      }
    } else {
      // New day — reset daily counter only
      setTodayLikes(new Set());
      pillOpacity.value = 1;
      celebrationShownToday.current = false;
      await saveUserData({ todayLikes: [], todayLikesDate: today });
    }
  }, []);

  useEffect(() => {
    loadDailyState();
  }, [loadDailyState]);

  // Re-check on app foreground (handles midnight crossover)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadDailyState();
      }
    });
    return () => sub.remove();
  }, [loadDailyState]);

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
    const granted = await requestPermissions();
    if (!granted) {
      setAlarmVisible(false);
      return;
    }
    const timeStr = `${padTwo(alarmTime.getHours())}:${padTwo(alarmTime.getMinutes())}`;
    await saveUserData({ reminder: { time: timeStr, days: alarmDays } });
    await scheduleReminder(timeStr, alarmDays);
    setAlarmVisible(false);
  };

  const quoteOpacity = useSharedValue(1);
  const isAnimating = useSharedValue(false);

  const advanceQuote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
    // Fade new quote in after React has committed
    quoteOpacity.value = withDelay(
      50,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }, () => {
        isAnimating.value = false;
      }),
    );
  }, [quoteOpacity, isAnimating]);

  const handleTapQuote = useCallback(() => {
    if (isAnimating.value) return;
    isAnimating.value = true;
    // Fade out current quote, then swap
    quoteOpacity.value = withTiming(0, {
      duration: 1000,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(advanceQuote)();
      }
    });
  }, [quoteOpacity, isAnimating, advanceQuote]);

  const quoteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
  }));

  const isFavorited = favorites.has(currentIndex);

  const triggerCelebration = useCallback(() => {
    setShowCelebration(true);
    celebrationShownToday.current = true;
    saveUserData({ celebrationShownDate: getToday() });
  }, []);

  const toggleFavorite = () => {
    const today = getToday();

    // Update all-time favorites
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      saveUserData({ likedQuotes: [...next] });
      return next;
    });

    // Update today's likes (for pill counter)
    setTodayLikes((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      saveUserData({ todayLikes: [...next], todayLikesDate: today });

      if (
        next.size >= MAX_FAVORITES &&
        prev.size < MAX_FAVORITES &&
        !celebrationShownToday.current
      ) {
        pillOpacity.value = withDelay(
          800,
          withTiming(0, { duration: 600 }, (finished) => {
            if (finished) {
              runOnJS(triggerCelebration)();
            }
          }),
        );
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
  const todayLikeCount = Math.min(todayLikes.size, MAX_FAVORITES);
  const progressWidth = (todayLikeCount / MAX_FAVORITES) * 100;

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  return (
    <LinearGradient
      colors={['#C4A8D0', '#D4A0C8', '#D8929E', '#E0A090']}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Progress Pill */}
        <Animated.View style={[styles.pillRow, pillAnimatedStyle]}>
          <View style={styles.pill}>
            <Ionicons name="heart-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.pillText}>
              {todayLikeCount}/{MAX_FAVORITES}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
            </View>
          </View>
        </Animated.View>

        {/* Quote Area — tap to fade to next */}
        <View style={styles.quoteArea}>
          <Pressable style={styles.quoteTouchable} onPress={handleTapQuote}>
            <Animated.View style={[styles.quoteContent, quoteAnimatedStyle]}>
              <Text style={styles.quoteText}>{quote.text}</Text>
              <Text style={styles.quoteRef}>{'\u2014'}{quote.ref}</Text>
            </Animated.View>
          </Pressable>
        </View>

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
          <Image
            source={require('@/assets/images/dove_transparency.png')}
            style={styles.doveMascot}
          />

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

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View entering={FadeIn.duration(1200)} style={styles.celebrationOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable
            style={styles.celebrationTouchable}
            onPress={() => setShowCelebration(false)}
          >
            <Animated.View entering={FadeIn.duration(1600).delay(400)} style={styles.celebrationContent}>
              <Image
                source={require('@/assets/images/dove_transparency.png')}
                style={styles.celebrationDove}
              />
              <Text style={styles.celebrationTitle}>
                You have liked 5 quotes today.
              </Text>
              <Text style={styles.celebrationBody}>
                You are now closer to God, and He will help you find peace.
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}

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
  },
  quoteTouchable: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  quoteContent: {
    alignItems: 'center',
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
  doveMascot: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
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

  /* Celebration Overlay */
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  celebrationTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  celebrationDove: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationBody: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
});
