import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [selectedOrganizer, setSelectedOrganizer] = useState<UserProfile | null>(null);

  const historyOrganizers = organizers
    .filter(o => o.verificationStatus === 'verified' || o.verificationStatus === 'rejected')
    .sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });

  const historyEvents = events
    .filter(e => e.status === 'approved' || e.status === 'rejected')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  useEffect(() => {
    fetchOrganizers();
    fetchEvents();
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
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => setSelectedOrganizer(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.displayName?.charAt(0).toUpperCase() || 'O'}</Text>
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
        {!!(item.organizationType || item.ieeeSection) && (
          <Text style={styles.detailText}>🌐 {item.organizationType ? `${item.organizationType} • ` : ''}{item.ieeeSection || ''}</Text>
        )}
        {!!(item.university || item.branch) && (
          <Text style={styles.detailText}>🎓 {item.university || item.branch}</Text>
        )}
        {!!item.committeePosition && (
          <Text style={styles.detailText}>👤 Position: {item.committeePosition}</Text>
        )}
        {!!(item.contactNumber || item.phoneNumber) && (
          <Text style={styles.detailText}>📞 {item.contactNumber || item.phoneNumber}</Text>
        )}
        {!!(item.organizationDescription || item.bio) && (
          <Text style={styles.detailText} numberOfLines={2}>📝 {item.organizationDescription || item.bio}</Text>
        )}
        {!!(item.verificationDocuments?.appointmentLetter || item.verificationDocuments?.logo) && (
          <Text style={[styles.detailText, { color: Colors.primary, fontWeight: '600', marginTop: 2 }]}>
            📎 Verification Document Attached (Tap to view)
          </Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, { flex: 0.3, backgroundColor: Colors.error + '22', borderColor: Colors.error + '44', borderWidth: 1 }]}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteOrganizer(item);
          }}
        >
          <Ionicons name="trash" size={20} color={Colors.error} />
        </TouchableOpacity>
        
        {item.verificationStatus === 'verified' ? (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={(e) => {
              e.stopPropagation();
              handleOrganizerStatus(item, 'rejected');
            }}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Remove Access</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={(e) => {
              e.stopPropagation();
              handleOrganizerStatus(item, 'verified');
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={[styles.actionText, { color: '#fff' }]}>Re-Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
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
                      {selectedOrganizer.verificationStatus === 'verified' ? 'Verified Organizer' : 'Rejected / Inactive Organizer'}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Contact Information</Text>
                    <View style={styles.modalFieldRow}>
                      <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.modalFieldValue}>{selectedOrganizer.email}</Text>
                    </View>
                    {!!(selectedOrganizer.contactNumber || selectedOrganizer.phoneNumber) && (
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>{selectedOrganizer.contactNumber || selectedOrganizer.phoneNumber}</Text>
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
                    {!!selectedOrganizer.organizationType && (
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="pricetag-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>Type: {selectedOrganizer.organizationType}</Text>
                      </View>
                    )}
                    {!!selectedOrganizer.ieeeSection && (
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>Section: {selectedOrganizer.ieeeSection}</Text>
                      </View>
                    )}
                    {!!(selectedOrganizer.university || selectedOrganizer.branch) && (
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="school-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>University / Branch: {selectedOrganizer.university || selectedOrganizer.branch}</Text>
                      </View>
                    )}
                    {!!selectedOrganizer.committeePosition && (
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>Position: {selectedOrganizer.committeePosition}</Text>
                      </View>
                    )}
                    {!!(selectedOrganizer.organizationDescription || selectedOrganizer.bio) && (
                      <View style={{ marginTop: Spacing.sm }}>
                        <Text style={[styles.modalFieldValue, { color: Colors.textSecondary, fontStyle: 'italic' }]}>
                          "{selectedOrganizer.organizationDescription || selectedOrganizer.bio}"
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Verification Documents */}
                  {!!(selectedOrganizer.verificationDocuments?.appointmentLetter || selectedOrganizer.verificationDocuments?.logo || selectedOrganizer.photoURL) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Verification Documents</Text>
                      {!!selectedOrganizer.verificationDocuments?.appointmentLetter && (
                        <TouchableOpacity 
                          style={[styles.modalFieldRow, { backgroundColor: Colors.primary + '15', padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.xs }]}
                          onPress={() => Linking.openURL(selectedOrganizer.verificationDocuments!.appointmentLetter!)}
                        >
                          <Ionicons name="document-attach" size={22} color={Colors.primary} />
                          <Text style={[styles.modalFieldValue, { color: Colors.primary, fontWeight: '700', marginLeft: 8 }]}>
                            View Appointment Letter ↗
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!!(selectedOrganizer.verificationDocuments?.logo || selectedOrganizer.photoURL) && (
                        <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
                          <Image 
                            source={{ uri: selectedOrganizer.verificationDocuments?.logo || selectedOrganizer.photoURL }} 
                            style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}
                            resizeMode="contain"
                          />
                          <Text style={[styles.detailText, { marginTop: 4, color: Colors.textSecondary }]}>Organization Logo</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { flex: 0.35, backgroundColor: Colors.error + '22', borderColor: Colors.error + '44', borderWidth: 1, paddingVertical: Spacing.lg }]}
                      onPress={() => {
                        const org = selectedOrganizer;
                        setSelectedOrganizer(null);
                        handleDeleteOrganizer(org);
                      }}
                    >
                      <Ionicons name="trash" size={22} color={Colors.error} />
                    </TouchableOpacity>
                    {selectedOrganizer.verificationStatus === 'verified' ? (
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn, { paddingVertical: Spacing.lg }]}
                        onPress={() => {
                          const org = selectedOrganizer;
                          setSelectedOrganizer(null);
                          handleOrganizerStatus(org, 'rejected');
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={22} color={Colors.error} />
                        <Text style={[styles.actionText, { color: Colors.error }]}>Remove Access</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.approveBtn, { paddingVertical: Spacing.lg }]}
                        onPress={() => {
                          const org = selectedOrganizer;
                          setSelectedOrganizer(null);
                          handleOrganizerStatus(org, 'verified');
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                        <Text style={[styles.actionText, { color: '#fff' }]}>Re-Approve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: '88%', borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary },
  modalScroll: { paddingBottom: Spacing.xxl },
  modalAvatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  modalName: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md },
  modalRole: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  modalSection: { marginBottom: Spacing.xl, backgroundColor: Colors.bgSurface, padding: Spacing.lg, borderRadius: BorderRadius.lg },
  modalSectionTitle: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  modalFieldValue: { fontSize: FontSize.md, color: Colors.textPrimary, flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
});
