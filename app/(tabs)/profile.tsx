import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const ACHIEVEMENT_BADGES = [
  { icon: '⚡', title: 'Early Adopter', desc: 'Joined CompConnect on launch' },
  { icon: '🏆', title: 'Event Champion', desc: 'Registered for 5+ events' },
  { icon: '🤝', title: 'Team Player', desc: 'Member of 3+ groups' },
];

export default function ProfileScreen() {
  const { profile, user, logout } = useUserStore();
  const [showInterests, setShowInterests] = useState(false);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Dewmi';
  const email = profile?.email || user?.email || 'user@ieee.org';
  const branch = profile?.branch || 'sliit';
  const university = profile?.university || 'Sri Lanka Institute of IT';
  const memberType = profile?.membershipType || 'Student';
  const interests = profile?.interests || ['AI', 'Machine Learning', 'IoT'];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#1A2035', Colors.bgDark]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="ribbon" size={14} color={Colors.accentGold} />
            <Text style={styles.memberBadgeText}>IEEE {memberType} Member</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Events', value: '12' },
            { label: 'Groups', value: '3' },
            { label: 'Posts', value: '28' },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Branch Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IEEE Branch</Text>
          <View style={styles.card}>
            <Ionicons name="school" size={20} color={Colors.primary} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{university}</Text>
              <Text style={styles.cardSubtitle}>Branch: {branch.toUpperCase()}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Interests</Text>
            <TouchableOpacity onPress={() => setShowInterests(!showInterests)}>
              <Ionicons name={showInterests ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {(showInterests || interests.length <= 4) && (
            <View style={styles.interestsGrid}>
              {interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.addInterestChip}>
                <Ionicons name="add" size={14} color={Colors.primary} />
                <Text style={styles.addInterestText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesRow}>
            {ACHIEVEMENT_BADGES.map((badge) => (
              <View key={badge.title} style={styles.badge}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { icon: 'person-outline', label: 'Edit Profile', action: () => {} },
            { icon: 'shield-outline', label: 'Privacy & Security', action: () => {} },
            { icon: 'notifications-outline', label: 'Notifications', action: () => {} },
            { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
            { icon: 'information-circle-outline', label: 'About IEEE CompConnect', action: () => {} },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>IEEE CompConnect v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  container: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl, gap: 8 },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: FontWeight.bold, color: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.bgCard, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  displayName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  email: { color: Colors.textSecondary, fontSize: FontSize.md },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentGold + '22', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accentGold + '44' },
  memberBadgeText: { color: Colors.accentGold, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardContent: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold },
  cardSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '44' },
  interestText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  addInterestChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.borderLight },
  addInterestText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  badgesRow: { flexDirection: 'row', gap: 10 },
  badge: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  badgeIcon: { fontSize: 24 },
  badgeTitle: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  badgeDesc: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '22', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.error + '11', borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.error + '33' },
  logoutText: { color: Colors.error, fontSize: FontSize.base, fontWeight: FontWeight.semiBold },
  versionText: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.sm },
});
