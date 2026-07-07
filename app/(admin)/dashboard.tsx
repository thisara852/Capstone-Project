import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore, UserProfile } from '../../store/userStore';
import { useAdminStore } from '../../store/adminStore';
import { Post } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Tab = 'organizers' | 'events';

export default function AdminDashboard() {
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
    deleteEvent,
    cleanup
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<Tab>('organizers');
  const [selectedOrganizer, setSelectedOrganizer] = useState<UserProfile | null>(null);

  const pendingOrganizers = organizers.filter(o => o.verificationStatus === 'pending');
  const pendingEvents = events.filter(e => e.status === 'pending');

  useEffect(() => {
    fetchOrganizers();
    fetchEvents();
    return () => {
      cleanup();
    };
  }, []);

  const handleOrganizerAction = (user: UserProfile, status: 'verified' | 'rejected') => {
    const actionText = status === 'verified' ? 'Approve' : (user.verificationStatus === 'verified' ? 'Remove' : 'Reject');
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

  const handleEventAction = (event: Post, action: 'approve' | 'remove') => {
    const actionText = action === 'approve' ? 'Approve' : 'Remove';
    Alert.alert(
      `${actionText} Content`,
      `Are you sure you want to ${actionText.toLowerCase()} "${event.title}"? ${action === 'remove' ? 'This will permanently delete it for everyone.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionText, 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: () => action === 'approve' ? updateEventStatus(event.id, 'approved') : deleteEvent(event.id)
        }
      ]
    );
  };

  const getOrganizerName = (authorId: string, fallbackName: string) => {
    const org = organizers.find((o) => o.uid === authorId);
    return org?.displayName || org?.organizationName || fallbackName;
  };

  const renderOrganizer = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => setSelectedOrganizer(item)}
    >
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
        {!!item.organizationName && <Text style={styles.detailText}>🏢 {item.organizationName}</Text>}
        {!!item.ieeeSection && <Text style={styles.detailText}>🌐 Section: {item.ieeeSection}</Text>}
        {!!item.bio && <Text style={styles.detailText} numberOfLines={2}>📝 {item.bio}</Text>}
      </View>

      <View style={styles.actionRow}>
        {item.verificationStatus !== 'rejected' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleOrganizerAction(item, 'rejected')}
          >
            <Ionicons name="close" size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>
              {item.verificationStatus === 'verified' ? 'Remove' : 'Reject'}
            </Text>
          </TouchableOpacity>
        )}
        {item.verificationStatus !== 'verified' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleOrganizerAction(item, 'verified')}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEvent = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        if (item.type === 'article') {
          router.push(`/article/${item.id}`);
        } else {
          router.push(`/post/${item.id}`);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="document-text" size={12} color={Colors.textMuted} />
            <Text style={[styles.cardSubtitle, { fontWeight: '500', marginLeft: 4 }]}>
              {item.type === 'article' ? 'Article' : 'Event'} • By {getOrganizerName(item.authorId, item.author)}
            </Text>
          </View>
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
        {!!item.eventDate && <Text style={styles.detailText}>📅 {new Date(item.eventDate).toLocaleDateString()}</Text>}
        {!!item.eventLocation && <Text style={styles.detailText}>📍 {item.eventLocation}</Text>}
        {!!item.tags && item.tags.length > 0 ? (
          <Text style={styles.detailText}>🏷️ {item.tags.join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleEventAction(item, 'remove')}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>
            Remove
          </Text>
        </TouchableOpacity>
        
        {item.status !== 'approved' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleEventAction(item, 'approve')}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Portal</Text>
          <Text style={styles.orgName}>{profile?.displayName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)')} 
            style={[styles.logoutBtn, { backgroundColor: Colors.bgSurface }]}
          >
            <Ionicons name="home-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }} 
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pendingOrganizers.length}</Text>
          <Text style={styles.statLabel}>Pending Organizers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pendingEvents.length}</Text>
          <Text style={styles.statLabel}>Pending Posts</Text>
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
          {pendingOrganizers.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{pendingOrganizers.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'events' && styles.tabActive]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
            Posts
          </Text>
          {pendingEvents.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{pendingEvents.length}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ padding: Spacing.lg, backgroundColor: Colors.error + '22', margin: Spacing.lg, borderRadius: BorderRadius.md }}>
          <Text style={{ color: Colors.error }}>{error}</Text>
        </View>
      ) : null}

      {/* Organizer Details Modal */}
      <Modal
        visible={!!selectedOrganizer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedOrganizer(null)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={[Colors.bgCard, Colors.bgCardAlt]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Organizer Details</Text>
                <TouchableOpacity onPress={() => setSelectedOrganizer(null)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              {selectedOrganizer && (
                <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalAvatarContainer}>
                <View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40 }]}>
                  <Text style={[styles.avatarText, { fontSize: 32 }]}>
                    {selectedOrganizer.displayName?.charAt(0).toUpperCase() || 'O'}
                  </Text>
                </View>
                <Text style={styles.modalName}>{selectedOrganizer.displayName}</Text>
                <Text style={styles.modalRole}>
                  {selectedOrganizer.verificationStatus === 'verified' ? 'Verified Organizer' : 'Pending Organizer'}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Contact Information</Text>
                <View style={styles.modalFieldRow}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.modalFieldValue}>{selectedOrganizer.email}</Text>
                </View>
                {!!selectedOrganizer.phoneNumber && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedOrganizer.phoneNumber}</Text>
                  </View>
                )}
                {!!selectedOrganizer.website && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedOrganizer.website}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Organization Details</Text>
                {!!selectedOrganizer.organizationName && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedOrganizer.organizationName}</Text>
                  </View>
                )}
                {!!selectedOrganizer.ieeeSection && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>Section: {selectedOrganizer.ieeeSection}</Text>
                  </View>
                )}
                {!!selectedOrganizer.branch && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="school-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>Branch: {selectedOrganizer.branch}</Text>
                  </View>
                )}
                {!!selectedOrganizer.bio && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={[styles.modalFieldValue, { color: Colors.textSecondary, fontStyle: 'italic' }]}>"{selectedOrganizer.bio}"</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                {selectedOrganizer.verificationStatus !== 'rejected' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtn, { paddingVertical: Spacing.lg }]}
                    onPress={() => {
                      setSelectedOrganizer(null);
                      handleOrganizerAction(selectedOrganizer, 'rejected');
                    }}
                  >
                    <Ionicons name="close" size={22} color={Colors.error} />
                    <Text style={[styles.actionText, { color: Colors.error }]}>
                      {selectedOrganizer.verificationStatus === 'verified' ? 'Remove Access' : 'Reject Organizer'}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedOrganizer.verificationStatus !== 'verified' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn, { paddingVertical: Spacing.lg }]}
                    onPress={() => {
                      setSelectedOrganizer(null);
                      handleOrganizerAction(selectedOrganizer, 'verified');
                    }}
                  >
                    <Ionicons name="checkmark" size={22} color="#fff" />
                    <Text style={[styles.actionText, { color: '#fff' }]}>Approve Organizer</Text>
                  </TouchableOpacity>
                )}
              </View>
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isLoading && pendingOrganizers.length === 0 && pendingEvents.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'organizers' ? (
        <FlatList
          data={pendingOrganizers}
          keyExtractor={(item) => item.uid}
          renderItem={renderOrganizer}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.success} />
              <Text style={styles.emptyTitle}>No pending organizers</Text>
              <Text style={styles.emptyText}>All organizers are verified.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.success} />
              <Text style={styles.emptyTitle}>No pending events</Text>
              <Text style={styles.emptyText}>All events are reviewed.</Text>
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
  orgName: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  logoutBtn: { padding: 8, backgroundColor: Colors.error + '22', borderRadius: BorderRadius.full },
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
  badge: { backgroundColor: Colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  modalContent: { width: '100%', maxHeight: '90%', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary },
  modalScroll: { paddingBottom: Spacing.xl },
  modalAvatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  modalName: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md, textAlign: 'center' },
  modalRole: { fontSize: FontSize.md, color: Colors.primary, marginTop: 4 },
  modalSection: { backgroundColor: Colors.bgSurface, padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  modalSectionTitle: { fontSize: FontSize.sm, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  modalFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  modalFieldValue: { fontSize: FontSize.md, color: Colors.textSecondary, flex: 1 },
  modalActions: { gap: Spacing.md, marginTop: Spacing.md },
});
