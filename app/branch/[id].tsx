import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IEEE_BRANCHES } from '../../config/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const BRANCH_ACTIVITIES: Record<string, { icon: string; title: string; count: number }[]> = {
  sliit: [
    { icon: '🤖', title: 'AI Workshops', count: 12 },
    { icon: '🏆', title: 'Hackathons', count: 3 },
    { icon: '📚', title: 'Study Groups', count: 8 },
  ],
  mrt: [
    { icon: '⚡', title: 'Tech Talks', count: 20 },
    { icon: '🔬', title: 'Research Projects', count: 5 },
    { icon: '🤝', title: 'Industry Connect', count: 14 },
  ],
  default: [
    { icon: '📡', title: 'Events', count: 6 },
    { icon: '👥', title: 'Members', count: 200 },
    { icon: '🏅', title: 'Awards', count: 2 },
  ],
};

const BRANCH_LEADERS: Record<string, { name: string; role: string }[]> = {
  default: [
    { name: 'Dr. Samantha P.', role: 'Branch Advisor' },
    { name: 'Kavindra J.', role: 'Chair' },
    { name: 'Dewmi R.', role: 'Vice Chair' },
    { name: 'Tharindu M.', role: 'Secretary' },
  ],
};

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const branch = IEEE_BRANCHES.find((b) => b.id === id);

  if (!branch) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.centered}><Text style={styles.notFound}>Branch not found</Text></View>
      </SafeAreaView>
    );
  }

  const activities = BRANCH_ACTIVITIES[id] || BRANCH_ACTIVITIES.default;
  const leaders = BRANCH_LEADERS[id] || BRANCH_LEADERS.default;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Hero */}
        <LinearGradient
          colors={[Colors.bgCardAlt, Colors.bgDark]}
          style={styles.hero}
        >
          <View style={styles.branchAvatar}>
            <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{branch.name[0]}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.branchName}>{branch.university}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.error} />
            <Text style={styles.city}>{branch.city}, Sri Lanka</Text>
          </View>
          <View style={styles.ieeeTag}>
            <Text style={styles.ieeeTagText}>IEEE Student Branch</Text>
          </View>
        </LinearGradient>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch Activities</Text>
          <View style={styles.activitiesRow}>
            {activities.map((act) => (
              <View key={act.title} style={styles.actCard}>
                <Text style={styles.actIcon}>{act.icon}</Text>
                <Text style={styles.actCount}>{act.count}</Text>
                <Text style={styles.actTitle}>{act.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leadership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leadership</Text>
          <View style={styles.leadersList}>
            {leaders.map((leader) => (
              <View key={leader.name} style={styles.leaderCard}>
                <View style={styles.leaderAvatar}>
                  <Text style={styles.leaderInitial}>{leader.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.leaderName}>{leader.name}</Text>
                  <Text style={styles.leaderRole}>{leader.role}</Text>
                </View>
                <TouchableOpacity style={styles.msgBtn}>
                  <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Connect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect</Text>
          <View style={styles.connectRow}>
            {[
              { icon: 'logo-linkedin', label: 'LinkedIn', color: '#0077B5', url: 'https://linkedin.com/company/ieee' },
              { icon: 'logo-facebook', label: 'Facebook', color: '#1877F2', url: 'https://facebook.com/ieee' },
              { icon: 'mail', label: 'Email', color: Colors.accent, url: `mailto:branch-${id}@ieee.org` },
            ].map((s) => (
              <TouchableOpacity 
                key={s.label} 
                style={[styles.socialBtn, { borderColor: s.color + '44' }]}
                onPress={async () => {
                  try {
                    const supported = await Linking.canOpenURL(s.url);
                    if (supported) {
                      await Linking.openURL(s.url);
                    } else {
                      Alert.alert('Error', `Cannot open ${s.label} link`);
                    }
                  } catch (e) {
                    Alert.alert('Error', 'An error occurred while trying to open the link');
                  }
                }}
              >
                <Ionicons name={s.icon as any} size={20} color={s.color} />
                <Text style={[styles.socialLabel, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.followBtn}>
          <LinearGradient
            colors={Colors.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.followGradient}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.followText}>Follow {branch.name} Branch</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  container: { paddingBottom: 80 },
  backBtn: { padding: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: Colors.textMuted, fontSize: FontSize.lg },
  hero: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: 8 },
  branchAvatar: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', marginBottom: 4 },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40, fontWeight: FontWeight.bold, color: '#fff' },
  branchName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { color: Colors.textSecondary, fontSize: FontSize.md },
  ieeeTag: { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '44' },
  ieeeTagText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  activitiesRow: { flexDirection: 'row', gap: 10 },
  actCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  actIcon: { fontSize: 24 },
  actCount: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary },
  actTitle: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  leadersList: { gap: 10 },
  leaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  leaderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSurface, justifyContent: 'center', alignItems: 'center' },
  leaderInitial: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  leaderName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold },
  leaderRole: { color: Colors.textMuted, fontSize: FontSize.sm },
  msgBtn: { marginLeft: 'auto' },
  connectRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 12, borderWidth: 1 },
  socialLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  followBtn: { marginHorizontal: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden' },
  followGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  followText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
