import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

export default function AdminLayout() {
  const { profile } = useUserStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgSurface },
        headerTintColor: Colors.textPrimary,
        contentStyle: { backgroundColor: Colors.bgDark },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="support-inbox"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
