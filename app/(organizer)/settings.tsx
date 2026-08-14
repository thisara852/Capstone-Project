import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizerSettings() {
  const { logout, profile } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
        } }
      ]
    );
  };

  const dummyAction = (title: string) => {
    Alert.alert(title, 'This feature is coming soon!');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(organizer)/dashboard');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileSection}>
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile?.displayName?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.organizationName || profile?.displayName}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <SettingItem icon="person-outline" title="Edit Profile" onPress={() => router.push('/(settings)/edit-profile')} />
          <View style={styles.divider} />
          <SettingItem icon="business-outline" title="Organization Details" onPress={() => router.push('/(settings)/edit-profile')} />
          <View style={styles.divider} />
          <SettingItem icon="lock-closed-outline" title="Change Password" onPress={() => dummyAction('Change Password')} />
        </View>

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <SettingItem icon="notifications-outline" title="Notifications" onPress={() => dummyAction('Notifications')} />
          <View style={styles.divider} />
          <SettingItem icon="moon-outline" title="Dark Mode" onPress={() => dummyAction('Theme')} hasSwitch />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, title, onPress, hasSwitch = false }: { icon: any, title: string, onPress: () => void, hasSwitch?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={Colors.textSecondary} />
        <Text style={styles.settingItemTitle}>{title}</Text>
      </View>
      <Ionicons name={hasSwitch ? "toggle" : "chevron-forward"} size={22} color={hasSwitch ? Colors.primary : Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  container: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  backButton: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.sm },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '22', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md },
  avatarText: { fontSize: 32, fontWeight: FontWeight.bold, color: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  email: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  sectionHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingItemTitle: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 46 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.error + '11', padding: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.error + '44' },
  logoutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xl },
});
