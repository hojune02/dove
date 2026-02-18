import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
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

const colors = {
  textPrimary: '#1A1A1A',
  textSecondary: '#3A3A3A',
  iconColor: '#2C2C2C',
  tabBackground: 'rgba(255, 255, 255, 0.45)',
};

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
  const [profilePage, setProfilePage] = useState<'menu' | 'name' | 'goals' | 'topics' | 'faith' | 'liked'>('menu');
  const [editName, setEditName] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [editFaith, setEditFaith] = useState<string | null>(null);
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  const [editShowOnlyLiked, setEditShowOnlyLiked] = useState(false);

  // Load persisted liked quotes and preferences on mount
  useEffect(() => {
    getUserData().then((data) => {
      if (data.likedQuotes && data.likedQuotes.length > 0) {
        setFavorites(new Set(data.likedQuotes));
      }
      if (data.showOnlyLiked) {
        setShowOnlyLiked(true);
      }
    });
  }, []);

  const openProfile = async () => {
    const data = await getUserData();
    setUserData(data);
    setProfilePage('menu');
    setProfileVisible(true);
  };

  const closeProfile = () => {
    setProfileVisible(false);
    setProfilePage('menu');
  };

  const openEditPage = (page: 'name' | 'goals' | 'topics' | 'faith' | 'liked') => {
    if (page === 'name') setEditName(userData.name || '');
    if (page === 'goals') setEditGoals(userData.goals || '');
    if (page === 'topics') setEditTopics(userData.topics || []);
    if (page === 'faith') setEditFaith(userData.faithPractice || null);
    if (page === 'liked') setEditShowOnlyLiked(favorites.size > 0 ? showOnlyLiked : false);
    setProfilePage(page);
  };

  const handleSaveEdit = async () => {
    if (profilePage === 'name') {
      if (editName.trim() === (userData.name || '')) return;
      await saveUserData({ name: editName.trim() });
      setUserData((prev) => ({ ...prev, name: editName.trim() }));
    } else if (profilePage === 'goals') {
      if (editGoals.trim() === (userData.goals || '')) return;
      await saveUserData({ goals: editGoals.trim() });
      setUserData((prev) => ({ ...prev, goals: editGoals.trim() }));
    } else if (profilePage === 'topics') {
      const orig = userData.topics || [];
      if (JSON.stringify([...editTopics].sort()) === JSON.stringify([...orig].sort())) return;
      await saveUserData({ topics: editTopics });
      setUserData((prev) => ({ ...prev, topics: editTopics }));
    } else if (profilePage === 'faith') {
      if (editFaith === (userData.faithPractice || null)) return;
      if (!editFaith) return;
      await saveUserData({ faithPractice: editFaith });
      setUserData((prev) => ({ ...prev, faithPractice: editFaith }));
    } else if (profilePage === 'liked') {
      if (editShowOnlyLiked === showOnlyLiked) return;
      await saveUserData({ showOnlyLiked: editShowOnlyLiked });
      setShowOnlyLiked(editShowOnlyLiked);
      if (editShowOnlyLiked && favorites.size > 0) {
        const sorted = [...favorites].sort((a, b) => a - b);
        setCurrentIndex(sorted[0]);
      }
    }
    setProfilePage('menu');
  };

  const hasEditChanged = () => {
    if (profilePage === 'name') return editName.trim() !== (userData.name || '');
    if (profilePage === 'goals') return editGoals.trim() !== (userData.goals || '');
    if (profilePage === 'topics') {
      const orig = userData.topics || [];
      return JSON.stringify([...editTopics].sort()) !== JSON.stringify([...orig].sort());
    }
    if (profilePage === 'faith') return editFaith !== (userData.faithPractice || null);
    if (profilePage === 'liked') return editShowOnlyLiked !== showOnlyLiked;
    return false;
  };

  const FAITH_OPTIONS = [
    'Actively practicing',
    'Exploring',
    'Lapsed',
    'Spiritual but not religious',
    'Other',
  ];

  const ALL_TOPICS = [
    'Hope', 'Uplifting', 'Healing', 'Mental Health',
    'Faith', 'Affirmations', 'Quotes', 'God',
  ];

  const toggleEditTopic = (topic: string) => {
    setEditTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
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
    const indices = showOnlyLiked ? [...favorites].sort((a, b) => a - b) : null;
    setCurrentIndex((prev) => {
      if (indices && indices.length > 0) {
        const currentPos = indices.indexOf(prev);
        const nextPos = (currentPos + 1) % indices.length;
        return indices[nextPos];
      }
      return (prev + 1) % quotes.length;
    });
    // Fade new quote in after React has committed
    quoteOpacity.value = withDelay(
      50,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }, () => {
        isAnimating.value = false;
      }),
    );
  }, [quoteOpacity, isAnimating, showOnlyLiked, favorites]);

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

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const wasLiked = next.has(currentIndex);
      if (wasLiked) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }

      // If in liked-only mode and we just un-liked the last quote
      if (showOnlyLiked && wasLiked && next.size === 0) {
        setShowOnlyLiked(false);
        saveUserData({ likedQuotes: [], showOnlyLiked: false });
      } else if (showOnlyLiked && wasLiked && next.size > 0) {
        saveUserData({ likedQuotes: [...next] });
        const remaining = [...next].sort((a, b) => a - b);
        const nextIdx = remaining.find((i) => i > currentIndex) ?? remaining[0];
        setCurrentIndex(nextIdx);
      } else {
        saveUserData({ likedQuotes: [...next] });
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

  return (
    <LinearGradient
      colors={['#C4A8D0', '#D4A0C8', '#D8929E', '#E0A090']}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
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
        onRequestClose={closeProfile}
      >
        <View style={styles.profileOverlay}>
          <Pressable style={styles.profileBackdrop} onPress={closeProfile} />
          <View style={styles.profileSheet}>
            {/* Header row */}
            <View style={styles.profileHeader}>
              <Pressable
                onPress={profilePage === 'menu' ? closeProfile : () => setProfilePage('menu')}
                hitSlop={12}
              >
                <Ionicons
                  name={profilePage === 'menu' ? 'close' : 'chevron-back'}
                  size={28}
                  color="#1A1A1A"
                />
              </Pressable>
            </View>

            {profilePage === 'menu' && (
              <>
                <Text style={styles.profileTitle}>Profile</Text>
                <View style={styles.profileMenuList}>
                  <Pressable style={styles.profileMenuButton} onPress={() => openEditPage('name')}>
                    <Ionicons name="person-outline" size={24} color="#1A1A1A" />
                    <Text style={styles.profileMenuLabel}>Name</Text>
                    <View style={styles.profileMenuSpacer} />
                    <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
                  </Pressable>

                  <Pressable style={styles.profileMenuButton} onPress={() => openEditPage('faith')}>
                    <MaterialCommunityIcons name="hands-pray" size={24} color="#1A1A1A" />
                    <Text style={styles.profileMenuLabel}>Faith Practice</Text>
                    <View style={styles.profileMenuSpacer} />
                    <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
                  </Pressable>

                  <Pressable style={styles.profileMenuButton} onPress={() => openEditPage('topics')}>
                    <Ionicons name="pricetags-outline" size={24} color="#1A1A1A" />
                    <Text style={styles.profileMenuLabel}>Topics</Text>
                    <View style={styles.profileMenuSpacer} />
                    <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
                  </Pressable>

                  <Pressable style={styles.profileMenuButton} onPress={() => openEditPage('goals')}>
                    <Ionicons name="flag-outline" size={24} color="#1A1A1A" />
                    <Text style={styles.profileMenuLabel}>Goals</Text>
                    <View style={styles.profileMenuSpacer} />
                    <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
                  </Pressable>

                  <Pressable style={styles.profileMenuButton} onPress={() => openEditPage('liked')}>
                    <Ionicons name="heart" size={24} color="#1A1A1A" />
                    <Text style={styles.profileMenuLabel}>Liked Quotes</Text>
                    <View style={styles.profileMenuSpacer} />
                    <Ionicons name="chevron-forward" size={22} color="#8A8A8A" />
                  </Pressable>
                </View>
              </>
            )}

            {profilePage === 'name' && (
              <KeyboardAvoidingView
                style={styles.editContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Math.round(SCREEN_HEIGHT * 0.12) + 5}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.editInner}>
                    <Text style={styles.profileTitle}>Edit Name</Text>
                    <TextInput
                      style={styles.editInput}
                      placeholder="Your name"
                      placeholderTextColor="#C4C4C4"
                      value={editName}
                      onChangeText={setEditName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </TouchableWithoutFeedback>
                <Pressable
                  style={[styles.editSaveButton, !hasEditChanged() && styles.editSaveButtonDim]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </KeyboardAvoidingView>
            )}

            {profilePage === 'goals' && (
              <KeyboardAvoidingView
                style={styles.editContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Math.round(SCREEN_HEIGHT * 0.12) + 5}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.editInner}>
                    <Text style={styles.profileTitle}>Edit Goals</Text>
                    <TextInput
                      style={[styles.editInput, styles.editInputMultiline]}
                      placeholder="I want to..."
                      placeholderTextColor="#C4C4C4"
                      value={editGoals}
                      onChangeText={setEditGoals}
                      multiline
                      scrollEnabled
                      textAlignVertical="top"
                    />
                  </View>
                </TouchableWithoutFeedback>
                <Pressable
                  style={[styles.editSaveButton, !hasEditChanged() && styles.editSaveButtonDim]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </KeyboardAvoidingView>
            )}

            {profilePage === 'topics' && (
              <View style={styles.editContainer}>
                <Text style={styles.profileTitle}>Edit Topics</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.editBadges}>
                    {ALL_TOPICS.map((topic) => {
                      const isSelected = editTopics.includes(topic);
                      return (
                        <Pressable
                          key={topic}
                          style={[styles.editBadge, isSelected && styles.editBadgeSelected]}
                          onPress={() => toggleEditTopic(topic)}
                        >
                          <Text style={[styles.editBadgeText, isSelected && styles.editBadgeTextSelected]}>
                            +{'  '}{topic}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                <Pressable
                  style={[styles.editSaveButton, !hasEditChanged() && styles.editSaveButtonDim]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            )}

            {profilePage === 'faith' && (
              <View style={styles.editContainer}>
                <Text style={styles.profileTitle}>Edit Faith Practice</Text>
                <View style={styles.editFaithOptions}>
                  {FAITH_OPTIONS.map((option) => {
                    const isSelected = editFaith === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.editFaithCard, isSelected && styles.editFaithCardSelected]}
                        onPress={() => setEditFaith(option)}
                      >
                        <Text style={styles.editFaithCardText}>{option}</Text>
                        <View style={[styles.editRadio, isSelected && styles.editRadioSelected]}>
                          {isSelected && <View style={styles.editRadioDot} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.editSaveButton, !hasEditChanged() && styles.editSaveButtonDim]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            )}

            {profilePage === 'liked' && (
              <View style={styles.editContainer}>
                <Text style={styles.profileTitle}>Only Show Liked Quotes?</Text>
                <View style={styles.editFaithOptions}>
                  {['Yes', 'No'].map((option) => {
                    const isSelected = option === 'Yes' ? editShowOnlyLiked : !editShowOnlyLiked;
                    const isDisabled = option === 'Yes' && favorites.size === 0;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.editFaithCard,
                          isSelected && !isDisabled && styles.editFaithCardSelected,
                          isDisabled && { opacity: 0.7 },
                        ]}
                        onPress={() => {
                          if (isDisabled) return;
                          setEditShowOnlyLiked(option === 'Yes');
                        }}
                      >
                        <Text style={styles.editFaithCardText}>{option}</Text>
                        <View style={[styles.editRadio, isSelected && !isDisabled && styles.editRadioSelected]}>
                          {isSelected && !isDisabled && <View style={styles.editRadioDot} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.editSaveButton, !hasEditChanged() && styles.editSaveButtonDim]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            )}
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
  profileMenuList: {
    gap: 12,
  },
  profileMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2DED8',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  profileMenuLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#1A1A1A',
  },
  profileMenuSpacer: {
    flex: 1,
  },

  /* Edit screens inside profile */
  editContainer: {
    flex: 1,
  },
  editInner: {
    flex: 1,
  },
  editInput: {
    backgroundColor: '#E2DED8',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: Fonts.sans,
    color: '#1A1A1A',
  },
  editInputMultiline: {
    height: 180,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  editSaveButton: {
    marginTop: 'auto',
    marginBottom: 20,
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  editSaveButtonDim: {
    opacity: 0.7,
  },
  editSaveButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  editBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  editBadge: {
    borderWidth: 1,
    borderColor: '#D4C5A9',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editBadgeSelected: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  editBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: '#1A1A1A',
  },
  editBadgeTextSelected: {
    color: '#FFFFFF',
  },
  editFaithOptions: {
    gap: 12,
  },
  editFaithCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E0D0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  editFaithCardSelected: {
    backgroundColor: '#E8E0D0',
    borderColor: '#2C2C2C',
    borderWidth: 2,
  },
  editFaithCardText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: '#1A1A1A',
  },
  editRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D4C5A9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRadioSelected: {
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
  },
  editRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
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
