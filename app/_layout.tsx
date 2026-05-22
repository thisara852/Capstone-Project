import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const { user, isLoading } = useUserStore();
  const initializeAuth = useUserStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Show loading while checking auth state
  if (isLoading) {
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
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bgDark },
            animation: 'fade',
          }}
        >
          {user ? (
            // User logged in → show main app
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="branch/[id]" options={{ presentation: 'card' }} />
            </>
          ) : (
            // User not logged in → show auth flow
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          )}
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
