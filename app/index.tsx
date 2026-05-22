import { Redirect } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function Index() {
  const user = useUserStore((s) => s.user);
  // Redirect to auth or tabs depending on auth state
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
