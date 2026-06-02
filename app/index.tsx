import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/theme';

export default function Index() {
  const { user, profile } = useUserStore();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Immediately redirect to tabs, profile will load in background
  // This prevents the loading screen and allows faster navigation
  if (profile?.role === 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  // Both Organizers and Students default to the main tab interface
  // Don't wait for profile - redirect immediately and load data in background
  return <Redirect href="/(tabs)" />;
}
