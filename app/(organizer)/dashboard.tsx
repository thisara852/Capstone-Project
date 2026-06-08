import React, { useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'info'>('overview');

  useEffect(() => {
    if (user?.uid && profile?.verificationStatus === 'verified') {
      fetchMyCompetitions(user.uid);
    }
  }, [user?.uid, profile?.verificationStatus]);

  const totalEvents = myCompetitions.length;
  const upcomingEvents = myCompetitions.filter(c => c.eventStatus === 'upcoming').length;
  const ongoingEvents = myCompetitions.filter(c => c.eventStatus === 'ongoing').length;
  const totalParticipants = myCompetitions.reduce((sum, c) => sum + (c.registeredCount || 0), 0);

  const renderRecentEvents = () => {
    if (myCompetitions.length === 0) {
      return (
        <View style={styles.emptyRecent}>
          <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyRecentText}>No events created yet.</Text>
          <TouchableOpacity
            style={styles.createEventBtn}
            onPress={() => router.push('/(organizer)/create-event')}
          >
            <Text style={styles.createEventBtnText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.recentList}>
        {myCompetitions.slice(0, 3).map((event) => {
          const progress = Math.min((event.registeredCount || 0) / 100, 1);
          return (
            <TouchableOpacity
              key={event.id}
              style={styles.performanceItem}
              activeOpacity={0.7}
              onPress={() => router.push('/(organizer)/my-events')}
            >
              <View style={styles.performanceItemHeader}>
                <View style={styles.performanceItemTitleRow}>
                  <Text style={styles.performanceItemTitle} numberOfLines={1}>{event.title}</Text>
                  <View style={[
                    styles.miniStatusBadge,
                    { backgroundColor: event.eventStatus === 'upcoming' ? Colors.warning + '15' : Colors.success + '15' }
                  ]}>
                    <Text style={[
                      styles.miniStatusText,
                      { color: event.eventStatus === 'upcoming' ? Colors.warning : Colors.success }
                    ]}>
                      {event.eventStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.performanceItemCount}>{event.registeredCount || 0} Joined</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </View>

              <View style={styles.performanceItemFooter}>
                <Text style={styles.performanceItemDate}>{event.eventDate || 'No date set'}</Text>
                <Text style={styles.performanceTargetText}>Target: 100</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Performance Header with pulsing green dot */}
      <View style={styles.performanceHeader}>
        <View style={styles.statusPulseRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.pulseText}>Live Portal Analytics</Text>
        </View>
        <Text style={styles.performanceTitle}>Overview Insights</Text>
      </View>

      {/* Stripe-style Minimal Stat Strip */}
      <View style={styles.statStrip}>
        <View style={styles.statStripItem}>
          <Text style={styles.statStripLabel}>Total Reach</Text>
          <Text style={styles.statStripValue}>{totalParticipants}</Text>
        </View>
        <View style={styles.statStripDivider} />
        <View style={styles.statStripItem}>
          <Text style={styles.statStripLabel}>Upcoming</Text>
          <Text style={styles.statStripValue}>{upcomingEvents}</Text>
        </View>
        <View style={styles.statStripDivider} />
        <View style={styles.statStripItem}>
          <Text style={styles.statStripLabel}>Active Listings</Text>
          <Text style={styles.statStripValue}>{totalEvents}</Text>
        </View>
      </View>

      {/* Recent Events Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Listing Performance</Text>
          {totalEvents > 3 && (
            <TouchableOpacity onPress={() => router.push('/(organizer)/my-events')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading && myCompetitions.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
        ) : (
          renderRecentEvents()
        )}
      </View>
    </View>
  );


  const renderActionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabHeaderTitle}>Portal Management</Text>
      <Text style={styles.tabHeaderSub}>Quick access shortcuts to handle your events and publications.</Text>
      <View style={styles.grid}>
        {[
          { title: 'Create Event', desc: 'Host a new competition', icon: 'calendar-clear', color: Colors.primary, route: '/(organizer)/create-event' },
          { title: 'My Events', desc: 'Manage your listings', icon: 'list', color: Colors.accent, route: '/(organizer)/my-events' },
          { title: 'Create Article', desc: 'Publish an article', icon: 'newspaper', color: Colors.success, route: '/(organizer)/create-article' },
          { title: 'Settings', desc: 'Account preferences', icon: 'settings', color: '#64748B', route: '/(organizer)/settings' },
        ].map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => action.route && router.push(action.route as any)}
          >
            <View style={styles.actionCardInner}>
              <View style={[styles.iconBox, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInfoTab = () => (
    <ScrollView contentContainerStyle={styles.infoScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabHeaderTitle}>Organizer Handbook</Text>
      <Text style={styles.tabHeaderSub}>Best practices for organizing high-quality events and sharing information.</Text>

      <View style={styles.guideCard}>
        <View style={styles.guideCardHeader}>
          <Ionicons name="bulb" size={20} color={Colors.accentGold} />
          <Text style={styles.guideCardTitle}>Successful Listing Checklist</Text>
        </View>
        <View style={styles.guideContent}>
          <Text style={styles.guideItem}>• <Text style={styles.boldText}>Clear Timeline</Text>: Detail registration end dates, stages, and results announcements.</Text>
          <Text style={styles.guideItem}>• <Text style={styles.boldText}>Comprehensive Rules</Text>: Describe eligibility criteria and submission guidelines explicitly.</Text>
          <Text style={styles.guideItem}>• <Text style={styles.boldText}>Visuals & Media</Text>: Add high-quality banner images to make listings stand out in the feed.</Text>
        </View>
      </View>

      <View style={styles.guideCard}>
        <View style={styles.guideCardHeader}>
          <Ionicons name="document-text" size={20} color={Colors.primary} />
          <Text style={styles.guideCardTitle}>Publishing Articles & News</Text>
        </View>
        <View style={styles.guideContent}>
          <Text style={styles.guideItem}>• <Text style={styles.boldText}>Announcements</Text>: Use articles to broadcast branch announcements or highlight contest winners.</Text>
          <Text style={styles.guideItem}>• <Text style={styles.boldText}>Format</Text>: Use lists and headings to make your content easy to read and digest for members.</Text>
        </View>
      </View>

      <View style={styles.guideCard}>
        <View style={styles.guideCardHeader}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={styles.guideCardTitle}>Verification Policy</Text>
        </View>
        <Text style={styles.guideText}>
          Your account is fully verified. If you need to update your organization name or credentials, please contact the IEEE branch administrator.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Dashboard</Text>
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
        {profile?.verificationStatus !== 'verified' ? (
          <LinearGradient
            colors={['#FFF3E0', '#FFE0B2']} // Subtle orange gradient for pending
            style={styles.statusCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={styles.statusTitle}>Account Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: Colors.warning + '22' }]}>
                <Ionicons name="shield-half" size={14} color={Colors.warning} />
                <Text style={[styles.statusText, { color: Colors.warning }]}>Reviewing</Text>
              </View>
            </View>
            <Text style={styles.statusNote}>
              Your organizer account is being verified. Full dashboard access will unlock shortly.
            </Text>
          </LinearGradient>
        ) : (
          <>
            {/* Pill Tab Bar */}
            <View style={styles.tabBar}>
              {[
                { id: 'overview', label: 'Overview', icon: 'bar-chart' },
                { id: 'actions', label: 'Actions', icon: 'flash' },
                { id: 'info', label: 'Guides', icon: 'information-circle' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    activeTab === tab.id && styles.activeTabItem
                  ]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.id ? '#FFFFFF' : Colors.textMuted}
                  />
                  <Text style={[
                    styles.tabLabel,
                    activeTab === tab.id ? styles.activeTabLabel : { color: Colors.textMuted }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Contents */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'actions' && renderActionsTab()}
            {activeTab === 'info' && renderInfoTab()}
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
    paddingBottom: 40,
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
    backgroundColor: Colors.bgCard,
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
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  activeTabItem: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  tabContent: {
    gap: Spacing.lg,
  },
  tabHeaderTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  tabHeaderSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  performanceHeader: {
    marginBottom: Spacing.sm,
  },
  statusPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  pulseText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  performanceTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statStripItem: {
    flex: 1,
    alignItems: 'center',
  },
  statStripLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statStripValue: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textSecondary,
  },
  statStripDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  recentSection: {
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  recentList: {
    gap: Spacing.sm,
  },
  performanceItem: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  performanceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  performanceItemTitle: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    flex: 1,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  performanceItemCount: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  performanceItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceItemDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  performanceTargetText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  emptyRecent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  emptyRecentText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  createEventBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  createEventBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: FontSize.sm,
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
  },
  infoScrollContent: {
    gap: Spacing.lg,
    paddingBottom: 20,
  },
  guideCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  guideCardTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  guideContent: {
    gap: Spacing.xs,
  },
  guideItem: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  guideText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
});
