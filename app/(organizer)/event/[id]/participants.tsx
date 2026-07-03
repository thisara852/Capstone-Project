import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRegistrationStore, Registration } from '../../../../store/registrationStore';
import { useCompetitionStore } from '../../../../store/competitionStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../../constants/theme';
import { format } from 'date-fns';

export default function ParticipantManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myCompetitions } = useCompetitionStore();
  const { registrations, fetchEventRegistrations, updateRegistrationStatus, isLoading, cleanup } = useRegistrationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);

  const event = myCompetitions.find(c => c.id === id);

  useEffect(() => {
    if (id) {
      fetchEventRegistrations(id as string);
    }
    return () => {
      cleanup();
    };
  }, [id]);

  const handleStatusChange = (userId: string, currentStatus: string, newStatus: Registration['status'], displayName: string) => {
    Alert.alert(
      `Update Status`,
      `Are you sure you want to change ${displayName}'s status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => updateRegistrationStatus(id as string, userId, newStatus)
        }
      ]
    );
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter || (filter === 'approved' && r.status === 'checked-in');
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      r.userDisplayName.toLowerCase().includes(searchLower) ||
      (r.fullName && r.fullName.toLowerCase().includes(searchLower)) ||
      (r.studentId && r.studentId.toLowerCase().includes(searchLower)) ||
      (r.university && r.university.toLowerCase().includes(searchLower)) ||
      (r.participantNumber && r.participantNumber.toLowerCase().includes(searchLower));
      
    return matchesFilter && matchesSearch;
  });

  const renderItem = ({ item }: { item: Registration }) => {
    let statusColor = Colors.warning;
    let statusIcon = 'time';
    
    if (item.status === 'approved') {
      statusColor = Colors.success;
      statusIcon = 'checkmark-circle';
    } else if (item.status === 'rejected') {
      statusColor = Colors.error;
      statusIcon = 'close-circle';
    } else if (item.status === 'checked-in') {
      statusColor = Colors.primary;
      statusIcon = 'scan-circle';
    }

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedParticipant(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            {item.participantNumber && (
              <View style={styles.idRow}>
                <Text style={styles.participantNumber}>{item.participantNumber}</Text>
                {item.ticketId ? (
                  <Text style={styles.ticketId}> • {item.ticketId}</Text>
                ) : null}
              </View>
            )}
            <Text style={styles.name}>{item.fullName || item.userDisplayName}</Text>
            {item.university && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="school-outline" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.universityText} numberOfLines={1}>{item.university}</Text>
              </View>
            )}
            <View style={styles.emailRow}>
              <Text style={styles.email}>{item.userEmail}</Text>
              {item.studentId ? (
                <Text style={styles.studentId}> • ID: {item.studentId}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.date}>Registered on {format(new Date(item.registeredAt), 'MMM dd, yyyy')}</Text>

        <View style={styles.actionRow}>
          {item.status !== 'approved' && item.status !== 'checked-in' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: Colors.success }]}
              onPress={() => handleStatusChange(item.userId, item.status, 'approved', item.userDisplayName)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
          )}

          {item.status === 'approved' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => handleStatusChange(item.userId, item.status, 'checked-in', item.userDisplayName)}
            >
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Mark Present</Text>
            </TouchableOpacity>
          )}

          {item.status !== 'rejected' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: Colors.error }]}
              onPress={() => handleStatusChange(item.userId, item.status, 'rejected', item.userDisplayName)}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{event?.title || 'Participants'}</Text>
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(organizer)/event/[id]/announce', params: { id } })}
          style={styles.backBtn}
        >
          <Ionicons name="megaphone-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {registrations.filter(r => r.status === 'approved' || r.status === 'checked-in').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>
            {registrations.filter(r => r.status === 'checked-in').length}
          </Text>
          <Text style={styles.statLabel}>Checked-In</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or ticket number..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading && registrations.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRegistrations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Participants Found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filter settings.</Text>
            </View>
          }
        />
      )}

      {/* Participant Details Modal */}
      <Modal
        visible={!!selectedParticipant}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedParticipant(null)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={[Colors.bgCard, '#1A1F30']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Participant Details</Text>
                <TouchableOpacity onPress={() => setSelectedParticipant(null)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              {selectedParticipant && (
                <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalAvatarContainer}>
                <View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '22', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
                  {selectedParticipant.userAvatar ? (
                    <Image source={{ uri: selectedParticipant.userAvatar }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={[styles.avatarText, { fontSize: 32, color: Colors.primary, fontWeight: 'bold' }]}>
                      {selectedParticipant.userDisplayName?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  )}
                </View>
                <Text style={styles.modalName}>{selectedParticipant.fullName || selectedParticipant.userDisplayName}</Text>
                {selectedParticipant.participantNumber && (
                  <Text style={styles.modalRole}>
                    ID: {selectedParticipant.participantNumber}
                  </Text>
                )}
                <View style={[styles.statusBadge, { 
                  backgroundColor: (selectedParticipant.status === 'approved' || selectedParticipant.status === 'checked-in' ? Colors.success : 
                                   selectedParticipant.status === 'rejected' ? Colors.error : Colors.warning) + '22',
                  marginTop: Spacing.sm 
                }]}>
                  <Text style={[styles.statusText, { 
                    color: selectedParticipant.status === 'approved' || selectedParticipant.status === 'checked-in' ? Colors.success : 
                           selectedParticipant.status === 'rejected' ? Colors.error : Colors.warning 
                  }]}>{selectedParticipant.status}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Registration Info</Text>
                <View style={styles.modalFieldRow}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.modalFieldValue}>{selectedParticipant.userEmail}</Text>
                </View>
                {!!selectedParticipant.phoneNumber && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedParticipant.phoneNumber}</Text>
                  </View>
                )}
                {!!selectedParticipant.studentId && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="id-card-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>Student ID: {selectedParticipant.studentId}</Text>
                  </View>
                )}
                {!!selectedParticipant.university && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="school-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedParticipant.university}</Text>
                  </View>
                )}
                {!!selectedParticipant.department && (
                  <View style={styles.modalFieldRow}>
                    <Ionicons name="book-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalFieldValue}>{selectedParticipant.department}</Text>
                  </View>
                )}
              </View>

              {(!!selectedParticipant.experienceLevel || !!selectedParticipant.teamName || !!selectedParticipant.specialNotes) && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Event Specific Details</Text>
                  {!!selectedParticipant.experienceLevel && (
                    <View style={styles.modalFieldRow}>
                      <Ionicons name="star-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.modalFieldValue}>Experience: {selectedParticipant.experienceLevel}</Text>
                    </View>
                  )}
                  {!!selectedParticipant.teamName && (
                    <View style={styles.modalFieldRow}>
                      <Ionicons name="people-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.modalFieldValue}>Team: {selectedParticipant.teamName}</Text>
                    </View>
                  )}
                  {!!selectedParticipant.specialNotes && (
                    <View style={{ marginTop: Spacing.sm }}>
                      <Text style={styles.modalFieldLabel}>Special Notes:</Text>
                      <Text style={[styles.modalFieldValue, { color: Colors.textSecondary, fontStyle: 'italic', marginTop: 4 }]}>"{selectedParticipant.specialNotes}"</Text>
                    </View>
                  )}
                </View>
              )}

              {selectedParticipant.uploadedFiles && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Verification Documents</Text>
                  
                  {selectedParticipant.uploadedFiles.studentIdCard && (
                    <TouchableOpacity 
                      style={styles.documentBtn}
                      onPress={() => Linking.openURL(selectedParticipant.uploadedFiles!.studentIdCard!.url)}
                    >
                      <Ionicons name="id-card-outline" size={20} color={Colors.primary} />
                      <Text style={styles.documentBtnText}>View Student ID</Text>
                      <Ionicons name="open-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  {selectedParticipant.uploadedFiles.resume && (
                    <TouchableOpacity 
                      style={styles.documentBtn}
                      onPress={() => Linking.openURL(selectedParticipant.uploadedFiles!.resume!.url)}
                    >
                      <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                      <Text style={styles.documentBtnText}>View Resume / CV</Text>
                      <Ionicons name="open-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  {selectedParticipant.uploadedFiles.ieeeProof && (
                    <TouchableOpacity 
                      style={styles.documentBtn}
                      onPress={() => Linking.openURL(selectedParticipant.uploadedFiles!.ieeeProof!.url)}
                    >
                      <Ionicons name="ribbon-outline" size={20} color={Colors.primary} />
                      <Text style={styles.documentBtnText}>View IEEE Proof</Text>
                      <Ionicons name="open-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {selectedParticipant.registrationData && Object.keys(selectedParticipant.registrationData).length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Custom Answers</Text>
                  {Object.entries(selectedParticipant.registrationData).map(([q, a]) => (
                    <View key={q} style={{ marginTop: Spacing.sm, backgroundColor: Colors.bgDark, padding: Spacing.md, borderRadius: BorderRadius.md }}>
                      <Text style={styles.modalFieldLabel}>{q}</Text>
                      <Text style={[styles.modalFieldValue, { marginTop: 4 }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedParticipant.status !== 'approved' && selectedParticipant.status !== 'checked-in' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.success, justifyContent: 'center', paddingVertical: Spacing.md, flex: 1 }]}
                    onPress={() => {
                      setSelectedParticipant(null);
                      handleStatusChange(selectedParticipant.userId, selectedParticipant.status, 'approved', selectedParticipant.userDisplayName);
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>
                )}

                {selectedParticipant.status === 'approved' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.primary, justifyContent: 'center', paddingVertical: Spacing.md, flex: 1 }]}
                    onPress={() => {
                      setSelectedParticipant(null);
                      handleStatusChange(selectedParticipant.userId, selectedParticipant.status, 'checked-in', selectedParticipant.userDisplayName);
                    }}
                  >
                    <Ionicons name="location" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark Present</Text>
                  </TouchableOpacity>
                )}

                {selectedParticipant.status !== 'rejected' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.error, justifyContent: 'center', paddingVertical: Spacing.md, flex: 1 }]}
                    onPress={() => {
                      setSelectedParticipant(null);
                      handleStatusChange(selectedParticipant.userId, selectedParticipant.status, 'rejected', selectedParticipant.userDisplayName);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Reject</Text>
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
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  controlsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  nameContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantNumber: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  ticketId: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  universityText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  studentId: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary },
  modalScroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  modalAvatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff' },
  modalName: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: 4 },
  modalRole: { fontSize: FontSize.md, color: Colors.textSecondary },
  modalSection: { marginBottom: Spacing.xl, backgroundColor: Colors.bgDark, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  modalSectionTitle: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.md },
  modalFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  modalFieldValue: { flex: 1, marginLeft: Spacing.sm, color: Colors.textPrimary, fontSize: FontSize.md },
  modalFieldLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  documentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '11',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  documentBtnText: {
    flex: 1,
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
});
