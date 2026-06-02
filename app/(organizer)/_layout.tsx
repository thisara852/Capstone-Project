import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

export default function OrganizerLayout() {
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
          title: 'Organizer Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create-event"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit-event"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create-article"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="my-events"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event/[id]/analytics"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event/[id]/participants"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event/[id]/announce"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
