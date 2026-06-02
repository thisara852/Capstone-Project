import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/theme';
import OfflineBanner from '../components/OfflineBanner';

export default function RootLayout() {
  LogBox.ignoreLogs(['BloomFilter error']);
  const { user, profile, isInitializing } = useUserStore();
  const initializeAuth = useUserStore((s) => s.initializeAuth);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Removed the useEffect redirect here to prevent "navigating before mounting" crashes.
  // We rely exclusively on app/index.tsx to handle role-based redirection on boot.

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDark }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bgDark },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(organizer)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(settings)/edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="article/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="branch/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
