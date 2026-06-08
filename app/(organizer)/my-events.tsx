import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { Post } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function MyEventsScreen() {
  const { profile } = useUserStore();
  const { myCompetitions, fetchMyCompetitions, deleteCompetition, isLoading, cleanup } = useCompetitionStore();
  const { filter } = useLocalSearchParams<{ filter?: string }>();

  useEffect(() => {
    if (profile?.uid) {
      fetchMyCompetitions(profile.uid);
    }
    return () => {
      cleanup();
    };
  }, [profile?.uid]);

  // Apply filter
  const displayedEvents = filter === 'upcoming'
    ? myCompetitions.filter(c => c.eventStatus === 'upcoming')
    : myCompetitions;

  const totalParticipants = myCompetitions.reduce((sum, c) => sum + (c.registeredCount || 0), 0);

  const screenTitle = filter === 'upcoming'
    ? 'Upcoming Events'
    : filter === 'participants'
    ? 'Participants Overview'
    : 'My Events';

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Competition',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCompetition(id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Post }) => {
    let statusColor = Colors.warning;
    let statusIcon = 'time-outline';
    let statusText = 'Pending Approval';

    if (item.status === 'approved') {
      statusColor = Colors.success;
      statusIcon = 'checkmark-circle-outline';
      statusText = 'Approved';
    } else if (item.status === 'rejected') {
      statusColor = Colors.error;
      statusIcon = 'close-circle-outline';
      statusText = 'Rejected';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(organizer)/edit-event', params: { id: item.id } })} style={[styles.iconButton, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={[styles.iconButton, { backgroundColor: Colors.error + '15' }]}>
              <Ionicons name="trash" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.content}</Text>
        
        {/* Participants count highlight */}
        {filter === 'participants' && (
          <View style={styles.participantHighlight}>
            <Ionicons name="people" size={16} color={Colors.primary} />
            <Text style={styles.participantHighlightText}>
              {item.registeredCount || 0} registered
              {item.participantLimit ? ` / ${item.participantLimit} max` : ''}
            </Text>
            {item.participantLimit && (
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${Math.min(100, ((item.registeredCount || 0) / item.participantLimit) * 100)}%` as any }
                ]} />
              </View>
            )}
          </View>
        )}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Ionicons name={statusIcon as any} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: Colors.accent + '15' }]}
              onPress={() => router.push({ pathname: '/(organizer)/event/[id]/analytics', params: { id: item.id } })}
            >
              <Ionicons name="bar-chart" size={18} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.participantsBtn}
              onPress={() => router.push({ pathname: '/(organizer)/event/[id]/participants', params: { id: item.id } })}
            >
              <Ionicons name="people" size={16} color="#fff" />
              <Text style={styles.participantsBtnText}>Manage ({item.registeredCount || 0})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {/* Dynamic Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{screenTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Participants summary banner */}
      {filter === 'participants' && (
        <View style={styles.summaryBanner}>
          <Ionicons name="people-circle" size={28} color={Colors.primary} />
          <View style={{ marginLeft: Spacing.md }}>
            <Text style={styles.summaryValue}>{totalParticipants}</Text>
            <Text style={styles.summaryLabel}>Total Participants Across All Events</Text>
          </View>
        </View>
      )}

      {isLoading && myCompetitions.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptyText}>
                {filter === 'upcoming' ? 'You have no upcoming events.' : 'You haven\'t created any events yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  listContainer: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tagBadge: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginLeft: -4,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    maxWidth: 150,
  },
  participantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  participantsBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  participantHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  participantHighlightText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    minWidth: 60,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

