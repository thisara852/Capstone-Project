import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
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

  const renderOrganizer = ({ item }: { item: UserProfile }) => {
    const logoUrl = item.photoURL || item.verificationDocuments?.logo;
    const hasProofDoc = !!(item.verificationDocuments?.appointmentLetter || item.verificationDocuments?.idDocument || item.verificationDocuments?.ieeeProof);
    const name = item.displayName || item.organizationName || item.email || 'Organizer Application';
    const orgName = (item.organizationName && item.organizationName !== item.displayName) ? item.organizationName : undefined;
    const phone = item.contactNumber || item.phoneNumber;
    const positionAndType = [item.committeePosition, item.organizationType].filter(Boolean).join(' • ');

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedOrganizer(item)}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.avatarImage} resizeMode="contain" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.cardMainInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
              {!!orgName && (
                <Text style={styles.cardOrgSubtitle} numberOfLines={1}>🏢 {orgName}</Text>
              )}
              {!!positionAndType && (
                <Text style={styles.cardPositionText} numberOfLines={1}>👤 {positionAndType}</Text>
              )}
              <Text style={styles.cardEmail} numberOfLines={1}>✉️ {item.email}</Text>
            </View>
          </View>

          {/* Badges / Details Box */}
          <View style={styles.detailsBox}>
            {!!item.ieeeSection && (
              <View style={styles.detailPill}>
                <Ionicons name="globe-outline" size={13} color="#2563EB" />
                <Text style={styles.detailPillText}>Section: {item.ieeeSection}</Text>
              </View>
            )}
            {!!(item.university || item.branch) && (
              <View style={styles.detailPill}>
                <Ionicons name="school-outline" size={13} color="#7C3AED" />
                <Text style={styles.detailPillText}>{item.university || item.branch}</Text>
              </View>
            )}
            {!!phone && (
              <View style={styles.detailPill}>
                <Ionicons name="call-outline" size={13} color="#059669" />
                <Text style={styles.detailPillText}>{phone}</Text>
              </View>
            )}
            {hasProofDoc ? (
              <View style={[styles.detailPill, styles.proofPill]}>
                <Ionicons name="document-text" size={13} color="#0284C7" />
                <Text style={styles.proofPillText}>Proof Attached</Text>
              </View>
            ) : (
              <View style={[styles.detailPill, styles.noProofPill]}>
                <Ionicons name="alert-circle-outline" size={13} color="#D97706" />
                <Text style={styles.noProofPillText}>No Proof File</Text>
              </View>
            )}
          </View>

          {!!(item.organizationDescription || item.bio) && (
            <View style={styles.descBox}>
              <Text style={styles.descText} numberOfLines={2}>
                "{item.organizationDescription || item.bio}"
              </Text>
            </View>
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            {item.verificationStatus !== 'rejected' && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleOrganizerAction(item, 'rejected')}
              >
                <Ionicons name="close" size={18} color="#DC2626" />
                <Text style={styles.rejectBtnText}>
                  {item.verificationStatus === 'verified' ? 'Remove' : 'Reject'}
                </Text>
              </TouchableOpacity>
            )}
            {item.verificationStatus !== 'verified' && (
              <TouchableOpacity 
                style={styles.approveBtnContainer}
                onPress={() => handleOrganizerAction(item, 'verified')}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.approveBtnGradient}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

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
            onPress={() => router.push('/(admin)/history')} 
            style={[styles.logoutBtn, { backgroundColor: Colors.primary + '22' }]}
          >
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
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
              
              {selectedOrganizer && (() => {
                const logoUrl = selectedOrganizer.photoURL || selectedOrganizer.verificationDocuments?.logo;
                const proofUrl = selectedOrganizer.verificationDocuments?.appointmentLetter || 
                                 selectedOrganizer.verificationDocuments?.idDocument || 
                                 selectedOrganizer.verificationDocuments?.ieeeProof;
                const phone = selectedOrganizer.contactNumber || selectedOrganizer.phoneNumber;

                return (
                  <ScrollView contentContainerStyle={styles.modalScroll}>
                    <View style={styles.modalAvatarContainer}>
                      {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.modalAvatarImage} />
                      ) : (
                        <View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40 }]}>
                          <Text style={[styles.avatarText, { fontSize: 32 }]}>
                            {selectedOrganizer.displayName?.charAt(0).toUpperCase() || 'O'}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.modalName}>{selectedOrganizer.displayName}</Text>
                      {!!selectedOrganizer.organizationName && (
                        <Text style={styles.modalOrgName}>{selectedOrganizer.organizationName}</Text>
                      )}
                      <View style={styles.modalStatusBadge}>
                        <Text style={[
                          styles.modalRole,
                          { color: selectedOrganizer.verificationStatus === 'verified' ? Colors.success : (selectedOrganizer.verificationStatus === 'rejected' ? Colors.error : Colors.warning) }
                        ]}>
                          {selectedOrganizer.verificationStatus === 'verified' ? 'Verified Organizer' : (selectedOrganizer.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification')}
                        </Text>
                      </View>
                    </View>

                    {/* Verification Documents Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>📄 Verification Documents</Text>
                      
                      {proofUrl ? (
                        <View style={styles.docCard}>
                          <View style={styles.docCardHeader}>
                            <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docTitle}>Appointment Letter / Proof</Text>
                              <Text style={styles.docSubtitle}>Uploaded document for admin verification</Text>
                            </View>
                          </View>

                          <TouchableOpacity 
                            style={styles.viewDocBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (proofUrl) {
                                Linking.openURL(proofUrl).catch(() => {
                                  Alert.alert('Error', 'Unable to open document URL.');
                                });
                              }
                            }}
                          >
                            <Ionicons name="open-outline" size={18} color="#fff" />
                            <Text style={styles.viewDocBtnText}>View / Download Document</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.noDocContainer}>
                          <Ionicons name="alert-circle-outline" size={20} color={Colors.textMuted} />
                          <Text style={styles.noDocText}>No appointment letter or proof document attached.</Text>
                        </View>
                      )}

                      {logoUrl ? (
                        <View style={[styles.docCard, { marginTop: Spacing.md }]}>
                          <View style={styles.docCardHeader}>
                            <Ionicons name="image-outline" size={24} color={Colors.primary} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docTitle}>Organization Logo</Text>
                              <Text style={styles.docSubtitle}>Uploaded logo media</Text>
                            </View>
                          </View>
                          <Image source={{ uri: logoUrl }} style={styles.logoPreviewImage} resizeMode="contain" />
                        </View>
                      ) : null}
                    </View>

                    {/* Organization Details Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>🏢 Organization Details</Text>
                      {!!selectedOrganizer.organizationName && (
                        <View style={styles.modalFieldRow}>
                          <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
                          <Text style={styles.modalFieldValue}>{selectedOrganizer.organizationName}</Text>
                        </View>
                      )}
                      {!!selectedOrganizer.organizationType && (
                        <View style={styles.modalFieldRow}>
                          <Ionicons name="layers-outline" size={20} color={Colors.textSecondary} />
                          <Text style={styles.modalFieldValue}>Type: {selectedOrganizer.organizationType}</Text>
                        </View>
                      )}
                      {!!selectedOrganizer.committeePosition && (
                        <View style={styles.modalFieldRow}>
                          <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
                          <Text style={styles.modalFieldValue}>Position: {selectedOrganizer.committeePosition}</Text>
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
                          <Text style={styles.modalFieldValue}>University/Branch: {selectedOrganizer.university || selectedOrganizer.branch}</Text>
                        </View>
                      )}
                      {!!(selectedOrganizer.organizationDescription || selectedOrganizer.bio) && (
                        <View style={{ marginTop: Spacing.xs }}>
                          <Text style={{ fontSize: FontSize.xs, fontWeight: 'bold', color: Colors.textMuted, marginBottom: 4 }}>DESCRIPTION</Text>
                          <Text style={[styles.modalFieldValue, { color: Colors.textSecondary, fontStyle: 'italic' }]}>
                            "{selectedOrganizer.organizationDescription || selectedOrganizer.bio}"
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Contact Information Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>📞 Contact Information</Text>
                      <View style={styles.modalFieldRow}>
                        <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.modalFieldValue}>{selectedOrganizer.email}</Text>
                      </View>
                      {!!phone && (
                        <View style={styles.modalFieldRow}>
                          <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                          <Text style={styles.modalFieldValue}>{phone}</Text>
                        </View>
                      )}
                      {!!selectedOrganizer.website && (
                        <TouchableOpacity 
                          style={styles.modalFieldRow}
                          onPress={() => {
                            let url = selectedOrganizer.website!;
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                              url = 'https://' + url;
                            }
                            Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open website'));
                          }}
                        >
                          <Ionicons name="globe-outline" size={20} color={Colors.primary} />
                          <Text style={[styles.modalFieldValue, { color: Colors.primary, textDecorationLine: 'underline' }]}>
                            {selectedOrganizer.website}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Actions */}
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
                );
              })()}
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
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  orgName: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#FCA5A5' },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.md },
  statBox: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: Spacing.md, 
    borderRadius: BorderRadius.xl, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statNum: { fontSize: 26, fontWeight: '800', color: '#2563EB' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.md },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'center' },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  
  // Card styles
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  approveBtn: { backgroundColor: '#10B981', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  card: { 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardGradient: { padding: Spacing.lg },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#93C5FD' },
  avatarImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#3B82F6' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#1D4ED8' },
  cardMainInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 4 },
  cardOrgSubtitle: { fontSize: 13, fontWeight: '600', color: '#2563EB', marginTop: 2 },
  cardPositionText: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 2 },
  cardEmail: { fontSize: 12, color: '#64748B', marginTop: 3 },
  
  detailsBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  detailPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, gap: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  detailPillText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  proofPill: { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
  proofPillText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
  noProofPill: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  noProofPillText: { fontSize: 11, fontWeight: '600', color: '#D97706' },

  descBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: BorderRadius.md, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  descText: { fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: BorderRadius.md, gap: 6 },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  rejectBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
  approveBtnContainer: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  approveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 6 },
  approveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  
  eventDesc: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 22 },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionText: { fontSize: FontSize.md, fontWeight: 'bold' },
  center: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  statusText: { fontSize: FontSize.xs, fontWeight: 'bold', marginTop: 4, opacity: 0.8 },
  badge: { backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  modalContent: { width: '100%', maxHeight: '90%', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary },
  modalScroll: { paddingBottom: Spacing.xl },
  modalAvatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  modalAvatarImage: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.bgSurface, borderWidth: 2, borderColor: Colors.primary },
  modalName: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md, textAlign: 'center' },
  modalOrgName: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  modalStatusBadge: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSurface },
  modalRole: { fontSize: FontSize.xs, fontWeight: 'bold', letterSpacing: 0.5 },
  modalSection: { backgroundColor: Colors.bgSurface, padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  modalSectionTitle: { fontSize: FontSize.sm, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  modalFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  modalFieldValue: { fontSize: FontSize.md, color: Colors.textSecondary, flex: 1 },
  modalActions: { gap: Spacing.md, marginTop: Spacing.md },

  // Document Styles
  docCard: { backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  docCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  docTitle: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textPrimary },
  docSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  viewDocBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, gap: 8, marginTop: Spacing.xs },
  viewDocBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: 'bold' },
  noDocContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm },
  noDocText: { color: Colors.textMuted, fontSize: FontSize.sm, fontStyle: 'italic' },
  logoPreviewImage: { width: '100%', height: 120, marginTop: Spacing.xs, borderRadius: BorderRadius.sm },
});
