import { Redirect } from 'expo-router';
import { useUserStore } from '../../store/userStore';

export default function AdminTab() {
  const { profile } = useUserStore();

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
}
