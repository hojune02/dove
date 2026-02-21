import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';

export default function FreeTrialScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={() => router.replace('/prayer')}
        onRestoreCompleted={() => router.replace('/prayer')}
        onDismiss={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
