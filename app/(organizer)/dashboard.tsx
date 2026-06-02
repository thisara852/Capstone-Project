import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../store/userStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function OrganizerDashboard() {
  const { profile, user } = useUserStore();
  const { myCompetitions, fetchMyCompetitions, isLoading } = useCompetitionStore();

  useEffect(() => {
    if (user?.uid && profile?.verificationStatus === 'verified') {
      fetchMyCompetitions(user.uid);
    }
  }, [user?.uid, profile?.verificationStatus]);

  const totalEvents = myCompetitions.length;
  const upcomingEvents = myCompetitions.filter(c => c.eventStatus === 'upcoming').length;
  const ongoingEvents = myCompetitions.filter(c => c.eventStatus === 'ongoing').length;
  const totalParticipants = myCompetitions.reduce((sum, c) => sum + (c.registeredCount || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Organizer Portal</Text>
            <Text style={styles.orgName}>{profile?.displayName} • {profile?.organizationName}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)')} 
            style={styles.homeBtn}
          >
            <Ionicons name="apps" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Verification Status Card */}
        <LinearGradient
          colors={profile?.verificationStatus === 'verified' 
            ? ['#1a2a22', '#0d1813'] // Subtle green/dark gradient for verified
            : ['#2a2015', '#1a130c']} // Subtle orange/dark for pending
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={styles.statusTitle}>Account Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: profile?.verificationStatus === 'verified' ? Colors.success + '22' : Colors.warning + '22' }]}>
              <Ionicons 
                name={profile?.verificationStatus === 'verified' ? 'shield-checkmark' : 'shield-half'} 
                size={14} 
                color={profile?.verificationStatus === 'verified' ? Colors.success : Colors.warning} 
              />
              <Text style={[
                styles.statusText, 
                { color: profile?.verificationStatus === 'verified' ? Colors.success : Colors.warning }
              ]}>
                {profile?.verificationStatus === 'verified' ? 'Verified' : 'Reviewing'}
              </Text>
            </View>
          </View>
          {profile?.verificationStatus !== 'verified' ? (
            <Text style={styles.statusNote}>
              Your organizer account is being verified. Full dashboard access will unlock shortly.
            </Text>
          ) : (
            <Text style={styles.statusNote}>
              Your account is verified and fully active. Manage your events and participants below.
            </Text>
          )}
        </LinearGradient>

        {profile?.verificationStatus === 'verified' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview Insights</Text>
            </View>
            
            {isLoading && myCompetitions.length === 0 ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <View style={styles.statsRow}>
                  {/* Total Participants Stat */}
                  <TouchableOpacity 
                    style={styles.statBoxWrapper}
                    onPress={() => router.push({ pathname: '/(organizer)/my-events', params: { filter: 'participants' } })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#1a1f33', '#101426']}
                      style={styles.statBoxGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.statIconWrapper, { backgroundColor: Colors.primary + '22' }]}>
                        <Ionicons name="people" size={24} color={Colors.primary} />
                      </View>
                      <Text style={[styles.statValue, { color: Colors.primary }]}>{totalParticipants}</Text>
                      <Text style={styles.statLabel}>Total Participants</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Upcoming Events Stat */}
                  <TouchableOpacity 
                    style={styles.statBoxWrapper}
                    onPress={() => router.push({ pathname: '/(organizer)/my-events', params: { filter: 'upcoming' } })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#332414', '#1f150b']}
                      style={styles.statBoxGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.statIconWrapper, { backgroundColor: Colors.accentGold + '22' }]}>
                        <Ionicons name="calendar" size={24} color={Colors.accentGold} />
                      </View>
                      <Text style={[styles.statValue, { color: Colors.accentGold }]}>{upcomingEvents}</Text>
                      <Text style={styles.statLabel}>Upcoming Events</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Ongoing Events Stat */}
                  <View style={styles.statBoxWrapper}>
                    <LinearGradient
                      colors={['#2e1533', '#1b0d1e']}
                      style={styles.statBoxGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.statIconWrapper, { backgroundColor: Colors.accent + '22' }]}>
                        <Ionicons name="flash" size={24} color={Colors.accent} />
                      </View>
                      <Text style={[styles.statValue, { color: Colors.accent }]}>{ongoingEvents}</Text>
                      <Text style={styles.statLabel}>Ongoing Events</Text>
                    </LinearGradient>
                  </View>

                  {/* Total Events Stat */}
                  <View style={styles.statBoxWrapper}>
                    <LinearGradient
                      colors={['#142e23', '#0b1913']}
                      style={styles.statBoxGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <View style={[styles.statIconWrapper, { backgroundColor: Colors.success + '22' }]}>
                        <Ionicons name="albums" size={24} color={Colors.success} />
                      </View>
                      <Text style={[styles.statValue, { color: Colors.success }]}>{totalEvents}</Text>
                      <Text style={styles.statLabel}>Total Events</Text>
                    </LinearGradient>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Management Actions</Text>
            </View>
            
            <View style={styles.grid}>
              {[
                { title: 'Create Event', desc: 'Host a new competition', icon: 'calendar-clear', color: Colors.primary, route: '/(organizer)/create-event' },
                { title: 'My Events', desc: 'Manage your listings', icon: 'list', color: Colors.accent, route: '/(organizer)/my-events' },
                { title: 'Create Article', desc: 'Publish an article', icon: 'newspaper', color: Colors.success, route: '/(organizer)/create-article' },
                { title: 'Settings', desc: 'Account preferences', icon: 'settings', color: '#8b949e', route: '/(organizer)/settings' },
              ].map((action, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={() => action.route && router.push(action.route as any)}
                >
                  <View style={styles.actionCardInner}>
                    <View style={[styles.iconBox, { backgroundColor: action.color + '15' }]}>
                      <Ionicons name={action.icon as any} size={28} color={action.color} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDesc}>{action.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  orgName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  homeBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  statusTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  statsScroll: {
    marginBottom: Spacing.xxl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  statBoxWrapper: {
    width: 150,
  },
  statBoxGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 160,
    justifyContent: 'space-between',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: Spacing.md,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.sm,
  },
  actionCardInner: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    height: 160,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  }
});
