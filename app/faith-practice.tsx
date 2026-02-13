import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { saveUserData } from '@/lib/storage';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  skip: '#8A8A8A',
  cardBackground: '#FFFFFF',
  cardBackgroundSelected: '#E8E0D0',
  cardBorder: '#E8E0D0',
  cardBorderSelected: '#2C2C2C',
  cardText: '#1A1A1A',
  radioEmpty: '#D4C5A9',
  radioFilled: '#2C2C2C',
  radioInnerDot: '#FFFFFF',
};

const options = [
  'Actively practicing',
  'Exploring',
  'Lapsed',
  'Spiritual but not religious',
  'Other',
];

export default function FaithPracticeScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  const hasNavigated = useRef(false);

  const handleSelect = (option: string) => {
    setSelected(option);
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    saveUserData({ faithPractice: option });
    setTimeout(() => {
      router.push('/your-topics');
    }, 400);
  };

  const handleSkip = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
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
            How would you describe{'\n'}your current faith{'\n'}practice?
          </Text>

          <View style={styles.options}>
            {options.map((option) => {
              const isSelected = selected === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={styles.cardText}>{option}</Text>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 42,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardSelected: {
    backgroundColor: colors.cardBackgroundSelected,
    borderColor: colors.cardBorderSelected,
    borderWidth: 2,
  },
  cardText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: colors.cardText,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.radioEmpty,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.radioFilled,
    borderColor: colors.radioFilled,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.radioInnerDot,
  },
});
