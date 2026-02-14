import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Fonts } from '@/constants/theme';
import { saveUserData } from '@/lib/storage';
import { requestPermissions, scheduleReminder } from '@/lib/notifications';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  skip: '#8A8A8A',
  cardBackground: '#EEEBE5',
  cardText: '#1A1A1A',
  cardSecondary: '#1A1A1A',
  dayDefault: '#D5D0C8',
  dayDefaultText: '#1A1A1A',
  daySelected: '#2C2C2C',
  daySelectedText: '#FFFFFF',
  buttonBackground: '#2C2C2C',
  buttonText: '#FFFFFF',
  divider: '#D5D0C8',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function padTwo(n: number) {
  return n.toString().padStart(2, '0');
}

export default function ReminderScreen() {
  const router = useRouter();
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [days, setDays] = useState<boolean[]>([
    false,
    true,
    true,
    true,
    true,
    true,
    false,
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const toggleDay = (index: number) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const handleSetAlarm = async () => {
    if (!days.some(Boolean)) return;
    const granted = await requestPermissions();
    const timeStr = `${padTwo(time.getHours())}:${padTwo(time.getMinutes())}`;
    await saveUserData({ reminder: { time: timeStr, days } });
    if (granted) {
      await scheduleReminder(timeStr, days);
    }
    router.push('/free-trial');
  };

  const handleSkip = () => {
    router.push('/free-trial');
  };

  const timeDisplay = `${padTwo(time.getHours())}:${padTwo(time.getMinutes())}`;

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
            Set an alarm and{'\n'}create a daily habit
          </Text>

          <View style={styles.iconContainer}>
            <Ionicons name="alarm-outline" size={140} color="#8A8A8A" />
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.card}>
            <Pressable
              style={styles.timeRow}
              onPress={() => setShowPicker((v) => !v)}
            >
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{timeDisplay}</Text>
              </View>
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={styles.picker}
              />
            )}

            <View style={styles.divider} />

            <View style={styles.repeatSection}>
              <Text style={styles.label}>Repeat</Text>
              <View style={styles.daysRow}>
                {DAY_LABELS.map((label, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.dayButton,
                      days[index] && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        days[index] && styles.dayTextSelected,
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
              styles.button,
              pressed && styles.buttonPressed,
              !days.some(Boolean) && styles.buttonDim,
            ]}
            onPress={handleSetAlarm}
          >
            <Text style={styles.buttonText}>Set alarm</Text>
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
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 44,
    color: colors.heading,
    textAlign: 'center',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: colors.cardText,
  },
  timeBadge: {
    backgroundColor: '#D5D0C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: colors.cardSecondary,
  },
  picker: {
    height: 150,
    marginTop: 4,
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  repeatSection: {
    gap: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dayDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.daySelected,
  },
  dayText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: colors.dayDefaultText,
  },
  dayTextSelected: {
    color: colors.daySelectedText,
  },
  button: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDim: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: colors.buttonText,
  },
});
