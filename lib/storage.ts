import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dove_user_data';

export interface UserData {
  name?: string;
  faithPractice?: string;
  topics?: string[];
  goals?: string;
  reminder?: {
    time: string; // HH:mm format
    days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  };
  likedQuotes?: number[]; // indices of liked quotes
  showOnlyLiked?: boolean; // only show liked quotes
}

export async function getUserData(): Promise<UserData> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : {};
}

export async function saveUserData(partial: Partial<UserData>): Promise<void> {
  const existing = await getUserData();
  const updated = { ...existing, ...partial };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
