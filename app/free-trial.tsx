import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import { saveUserData } from '@/lib/storage';

async function completeOnboarding(router: ReturnType<typeof useRouter>) {
  await saveUserData({ onboardingComplete: true });
  router.replace('/prayer');
}

export default function FreeTrialScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={() => completeOnboarding(router)}
        onRestoreCompleted={() => completeOnboarding(router)}
        onDismiss={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
