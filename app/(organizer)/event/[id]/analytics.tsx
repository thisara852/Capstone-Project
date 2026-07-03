import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRegistrationStore } from '../../../../store/registrationStore';
import { useFeedStore } from '../../../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../../constants/theme';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function EventAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts } = useFeedStore();
  const { registrations, fetchEventRegistrations, isLoading } = useRegistrationStore();
  
  const [event, setEvent] = useState(posts.find(p => p.id === id));

  useEffect(() => {
    if (id) {
      fetchEventRegistrations(id);
    }
  }, [id]);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate Metrics
  const totalRegistered = registrations.length;
  const approvedCount = registrations.filter(r => r.status === 'approved' || r.status === 'checked-in').length;
  const checkedInCount = registrations.filter(r => r.status === 'checked-in').length;
  const attendanceRate = approvedCount > 0 ? Math.round((checkedInCount / approvedCount) * 100) : 0;
  
  const capacity = event.participantLimit || 100;
  const capacityFillRate = capacity > 0 ? Math.round((totalRegistered / capacity) * 100) : 0;

  // Demographics (University Breakdown)
  const universityCounts: Record<string, number> = {};
  registrations.forEach(r => {
    const uni = r.userUniversity || 'Unknown';
    universityCounts[uni] = (universityCounts[uni] || 0) + 1;
  });

  const sortedUniversities = Object.entries(universityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  const generateReport = async () => {
    const reportStr = `
📊 Post-Event Report: ${event.title}
Date: ${event.eventDate ? format(new Date(event.eventDate), 'PPP') : 'N/A'}
Organizer: ${event.author}

👥 Attendance Summary:
- Total Registrations: ${totalRegistered}
- Approved Participants: ${approvedCount}
- Checked-In Attendees: ${checkedInCount}
- Attendance Rate: ${attendanceRate}%

🏫 Top Universities Represented:
${sortedUniversities.map(([uni, count]) => `- ${uni}: ${count} attendees`).join('\n')}

Generated via IEEE CompConnect
    `.trim();

    await Clipboard.setStringAsync(reportStr);
    Alert.alert('Report Copied!', 'The event summary has been copied to your clipboard. You can now paste it into your official vTools report.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Analytics</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={generateReport}>
          <Ionicons name="copy-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>
            {event.eventDate ? format(new Date(event.eventDate), 'MMMM do, yyyy') : 'No date set'}
          </Text>

          {/* Key Metrics Grid */}
          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '22' }]}>
                <Ionicons name="people" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.metricValue}>{totalRegistered}</Text>
              <Text style={styles.metricLabel}>Total Registrations</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: Colors.success + '22' }]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              </View>
              <Text style={styles.metricValue}>{checkedInCount}</Text>
              <Text style={styles.metricLabel}>Checked In</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: Colors.accent + '22' }]}>
                <Ionicons name="pie-chart" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.metricValue}>{attendanceRate}%</Text>
              <Text style={styles.metricLabel}>Attendance Rate</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: Colors.warning + '22' }]}>
                <Ionicons name="ticket" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.metricValue}>{capacity > 0 ? `${capacityFillRate}%` : 'N/A'}</Text>
              <Text style={styles.metricLabel}>Capacity Filled</Text>
            </View>
          </View>

          {/* Progress Visualizer */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Check-in Progress</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(attendanceRate, 100)}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{checkedInCount} Checked In</Text>
              <Text style={styles.progressText}>{approvedCount} Expected</Text>
            </View>
          </View>

          {/* Demographics */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Audience Demographics</Text>
            <Text style={styles.chartSubtitle}>Top Universities / Sections</Text>
            
            {sortedUniversities.length > 0 ? (
              <View style={styles.demographicsList}>
                {sortedUniversities.map(([uni, count], idx) => {
                  const percentage = Math.round((count / totalRegistered) * 100);
                  return (
                    <View key={uni} style={styles.demoRow}>
                      <View style={styles.demoInfo}>
                        <Text style={styles.demoRank}>#{idx + 1}</Text>
                        <Text style={styles.demoName} numberOfLines={1}>{uni}</Text>
                      </View>
                      <View style={styles.demoStats}>
                        <View style={styles.miniBarBg}>
                          <View style={[styles.miniBarFill, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.demoCount}>{count}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyDemo}>
                <Ionicons name="school-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyDemoText}>No demographic data available yet.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm },
  exportBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '22',
    borderRadius: BorderRadius.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  eventTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chartTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: -8,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: Colors.bgDark,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  demographicsList: {
    gap: Spacing.md,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: Spacing.md,
  },
  demoRank: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: 'bold',
    width: 24,
  },
  demoName: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  demoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 100,
    justifyContent: 'flex-end',
  },
  miniBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  demoCount: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    width: 20,
    textAlign: 'right',
  },
  emptyDemo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyDemoText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  }
});
