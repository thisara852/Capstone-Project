import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '../constants/theme';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? true);
    };
    
    // Check immediately, then poll every 3 seconds
    checkNetwork();
    const interval = setInterval(checkNetwork, 3000);
    return () => clearInterval(interval);
  }, []);

  // If we don't know the state yet, or it's connected, show nothing
  if (isConnected !== false) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
      <View style={styles.banner}>
        <Ionicons name="cloud-offline" size={16} color="#fff" style={styles.icon} />
        <Text style={styles.text}>No internet connection. Operating in Offline Mode.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error,
    width: '100%',
    zIndex: 9999, // Ensure it sits on top of everything
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.error, // Red to grab attention
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
