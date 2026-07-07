import { Redirect } from 'expo-router';
import { useUserStore } from '../../store/userStore';

export default function DashboardTab() {
  const { profile } = useUserStore();
  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin';
  
  if (isOrganizer) {
    return <Redirect href="/(organizer)/dashboard" />;
  }
  
  return <Redirect href="/(tabs)" />;
}
