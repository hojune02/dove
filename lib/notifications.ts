import * as Notifications from 'expo-notifications';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions. Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Cancel all previously scheduled reminder notifications, then schedule
 * new weekly notifications for each selected day at the given time.
 */
export async function scheduleReminder(
  time: string,
  days: boolean[],
): Promise<void> {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hour, minute] = time.split(':').map(Number);

  // Schedule one weekly trigger per selected day
  // days index: 0=Sun, 1=Mon, ... 6=Sat
  // expo-notifications weekday: 1=Sun, 2=Mon, ... 7=Sat
  for (let i = 0; i < days.length; i++) {
    if (!days[i]) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to pray 🕊️',
        body: 'Take a moment for your daily prayer.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: i + 1, // 1=Sunday ... 7=Saturday
        hour,
        minute,
      },
    });
  }
}
