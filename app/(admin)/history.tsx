import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, UserProfile } from '../../store/userStore';
import { useAdminStore } from '../../store/adminStore';
import { Post } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Tab = 'organizers' | 'events';

export default function AdminHistory() {
  const { profile, logout } = useUserStore();
  const {
    organizers,
    events,
    isLoading,
    error,
    fetchOrganizers,
    fetchEvents,
    updateOrganizerStatus,
    updateEventStatus,
    deleteOrganizer,
    deleteEvent,
    cleanup
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<Tab>('organizers');

  const historyOrganizers = organizers.filter(o => o.verificationStatus !== 'pending');
  const historyEvents = events.filter(e => e.status !== 'pending');

  useEffect(() => {
    fetchOrganizers();
    fetchEvents();
    return () => {
      cleanup();
    };
  }, []);

  const handleOrganizerStatus = (user: UserProfile, status: 'verified' | 'rejected') => {
    const actionText = status === 'verified' ? 'Approve' : 'Remove';
    Alert.alert(
      `${actionText} Organizer`,
      `Are you sure you want to ${actionText.toLowerCase()} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: status === 'verified' ? 'default' : 'destructive',
          onPress: () => updateOrganizerStatus(user.uid, status)
        }
      ]
    );
  };

  const handleDeleteOrganizer = (user: UserProfile) => {
    Alert.alert(
      `Delete Organizer`,
      `Are you sure you want to completely delete ${user.displayName} from the database? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteOrganizer(user.uid)
        }
      ]
    );
  };

  const handleEventAction = (event: Post) => {
    Alert.alert(
      `Delete Event`,
      `Are you sure you want to completely delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id)
        }
      ]
    );
  };

  const getOrganizerName = (authorId: string, fallbackName: string) => {
    const org = organizers.find((o) => o.uid === authorId);
    return org?.displayName || org?.organizationName || fallbackName;
  };

  const renderOrganizer = ({ item }: { item: UserProfile }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.displayName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>{item.displayName}</Text>
            <Text style={styles.cardSubtitle}>{item.email}</Text>
            <Text style={[
              styles.statusText,
              { color: item.verificationStatus === 'verified' ? Colors.success : (item.verificationStatus === 'rejected' ? Colors.error : Colors.warning) }
            ]}>
              {item.verificationStatus?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <Text style={styles.detailText}>🏢 {item.organizationName}</Text>
        <Text style={styles.detailText}>🌐 Section: {item.ieeeSection}</Text>
        {item.bio ? <Text style={styles.detailText} numberOfLines={2}>📝 {item.bio}</Text> : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { flex: 0.3, backgroundColor: Colors.error + '22', borderColor: Colors.error + '44', borderWidth: 1 }]}
          onPress={() => handleDeleteOrganizer(item)}
        >
          <Ionicons name="trash" size={20} color={Colors.error} />
        </TouchableOpacity>

        {item.verificationStatus === 'verified' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleOrganizerStatus(item, 'rejected')}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Remove Access</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleOrganizerStatus(item, 'verified')}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEvent = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, { marginTop: 4, fontWeight: '500' }]}>
            <Ionicons name="business" size={12} color={Colors.textMuted} /> Organizer: {getOrganizerName(item.authorId, item.author)}
          </Text>
          <Text style={[
            styles.statusText,
            { color: item.status === 'approved' ? Colors.success : (item.status === 'rejected' ? Colors.error : Colors.warning) }
          ]}>
            {item.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>

      <Text style={styles.eventDesc} numberOfLines={3}>{item.content}</Text>

      <View style={styles.detailsBox}>
        {item.eventDate && <Text style={styles.detailText}>📅 {new Date(item.eventDate).toLocaleDateString()}</Text>}
        {item.eventLocation && <Text style={styles.detailText}>📍 {item.eventLocation}</Text>}
        {item.tags && item.tags.length > 0 && (
          <Text style={styles.detailText}>🏷️ {item.tags.join(', ')}</Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleEventAction(item)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>
            Delete Event
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.greeting}>History & Records</Text>
          <Text style={styles.orgName}>Past approved and rejected items</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{historyOrganizers.length}</Text>
          <Text style={styles.statLabel}>Total Organizers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{historyEvents.length}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'organizers' && styles.tabActive]}
          onPress={() => setActiveTab('organizers')}
        >
          <Text style={[styles.tabText, activeTab === 'organizers' && styles.tabTextActive]}>
            Organizers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.tabActive]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ padding: Spacing.lg, backgroundColor: Colors.error + '22', margin: Spacing.lg, borderRadius: BorderRadius.md }}>
          <Text style={{ color: Colors.error }}>{error}</Text>
        </View>
      ) : null}

      {isLoading && historyOrganizers.length === 0 && historyEvents.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'organizers' ? (
        <FlatList
          data={historyOrganizers}
          keyExtractor={(item) => item.uid}
          renderItem={renderOrganizer}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.success} />
              <Text style={styles.emptyTitle}>No past organizers</Text>
              <Text style={styles.emptyText}>No organizer history found.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={historyEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.success} />
              <Text style={styles.emptyTitle}>No past events</Text>
              <Text style={styles.emptyText}>No event history found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.primary },
  orgName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  backBtn: { padding: 8, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statNum: { fontSize: FontSize.xxl, fontWeight: 'bold', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.md },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '33', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.primary },
  cardTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  eventDesc: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 22 },
  detailsBox: { backgroundColor: Colors.bgSurface, padding: Spacing.md, borderRadius: BorderRadius.md, gap: 6, marginBottom: Spacing.lg },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: 8 },
  rejectBtn: { backgroundColor: Colors.error + '11', borderWidth: 1, borderColor: Colors.error + '44' },
  approveBtn: { backgroundColor: Colors.success },
  actionText: { fontSize: FontSize.md, fontWeight: 'bold' },
  center: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  statusText: { fontSize: FontSize.xs, fontWeight: 'bold', marginTop: 4, opacity: 0.8 },
});
