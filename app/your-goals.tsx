import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { saveUserData } from '@/lib/storage';

const colors = {
  background: '#FAF7F2',
  heading: '#1A1A1A',
  skip: '#8A8A8A',
  inputBackground: '#E8E0D0',
  placeholder: '#C4C4C4',
  buttonBackground: '#2C2C2C',
  buttonText: '#FFFFFF',
};

export default function YourGoalsScreen() {
  const [goals, setGoals] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    if (goals.trim()) {
      await saveUserData({ goals: goals.trim() });
    }
    router.push('/reminder');
  };

  const handleSkip = () => {
    router.push('/reminder');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={handleSkip} hitSlop={16}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.heading}>
            What are your goals{'\n'}right now?
          </Text>

          <TextInput
            style={[styles.input, { wordBreak: 'break-all' } as any]}
            placeholder="I want to..."
            placeholderTextColor={colors.placeholder}
            value={goals}
            onChangeText={setGoals}
            multiline
            scrollEnabled
            textAlignVertical="top"
          />
        </View>

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
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    flex: 1,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 42,
    color: colors.heading,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.sans,
    color: colors.heading,
    height: 180,
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
