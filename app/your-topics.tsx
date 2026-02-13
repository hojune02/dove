import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { saveUserData } from '@/lib/storage';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  skip: '#8A8A8A',
  badgeBackground: 'transparent',
  badgeBorder: '#D4C5A9',
  badgeText: '#1A1A1A',
  badgeSelectedBackground: '#2C2C2C',
  badgeSelectedBorder: '#2C2C2C',
  badgeSelectedText: '#FFFFFF',
  buttonBackground: '#2C2C2C',
  buttonText: '#FFFFFF',
};

const topics = [
  'Hope',
  'Uplifting',
  'Healing',
  'Mental Health',
  'Faith',
  'Affirmations',
  'Quotes',
  'God',
];

export default function YourTopicsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const toggleTopic = (topic: string) => {
    setSelected((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleContinue = async () => {
    if (selected.length > 0) {
      await saveUserData({ topics: selected });
    }
    router.push('/your-goals');
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>
            Which topics are you{'\n'}interested in?
          </Text>

          <View style={styles.badges}>
            {topics.map((topic) => {
              const isSelected = selected.includes(topic);
              return (
                <Pressable
                  key={topic}
                  style={[styles.badge, isSelected && styles.badgeSelected]}
                  onPress={() => toggleTopic(topic)}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected && styles.badgeTextSelected,
                    ]}
                  >
                    +{'  '}{topic}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
  scrollContent: {
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  badgeSelected: {
    backgroundColor: colors.badgeSelectedBackground,
    borderColor: colors.badgeSelectedBorder,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: colors.badgeText,
  },
  badgeTextSelected: {
    color: colors.badgeSelectedText,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  buttonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: colors.buttonText,
  },
});
