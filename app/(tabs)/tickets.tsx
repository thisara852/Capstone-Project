import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { useRegistrationStore, Registration } from '../../store/registrationStore';
import { useUserStore } from '../../store/userStore';
import { useFeedStore } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function MyTicketsScreen() {
  const { user } = useUserStore();
  const { userTickets, fetchUserTickets, isLoading } = useRegistrationStore();
  const { posts } = useFeedStore();

  useEffect(() => {
    if (user?.uid) {
      fetchUserTickets(user.uid);
    }
  }, [user?.uid]);

  const ticketsWithEvents = userTickets
    .filter(reg => reg.status === 'approved' || reg.status === 'checked-in')
    .map(reg => {
      const event = posts.find(p => p.id === reg.eventId);
      return {
        ...reg,
        eventTitle: event?.title || 'Event Ticket'
      };
    });

  const renderTicket = ({ item }: { item: Registration & { eventTitle: string } }) => {
    const isApproved = item.status === 'approved' || item.status === 'checked-in';
    const isPending = item.status === 'pending';
    
    let statusColor = Colors.warning;
    let statusText = 'Pending Approval';
    let statusIcon = 'time-outline';

    if (item.status === 'approved') {
      statusColor = Colors.success;
      statusText = 'Approved';
      statusIcon = 'checkmark-circle';
    } else if (item.status === 'checked-in') {
      statusColor = Colors.primary;
      statusText = 'Checked In';
      statusIcon = 'scan-circle';
    } else if (item.status === 'rejected') {
      statusColor = Colors.error;
      statusText = 'Rejected';
      statusIcon = 'close-circle';
    }

    return (
      <TouchableOpacity 
        style={styles.ticketCard}
        onPress={() => router.push(`/ticket/${item.eventId}`)}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventTitle || 'Event Ticket'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.ticketBody}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.dateText}>
              Registered on {format(new Date(item.registeredAt), 'MMM dd, yyyy')}
            </Text>
          </View>

          {isApproved && item.participantNumber ? (
            <View style={styles.ticketIdsContainer}>
              <View style={styles.numberBox}>
                <Text style={styles.numberLabel}>PARTICIPANT NO.</Text>
                <Text style={styles.numberValue}>{item.participantNumber}</Text>
              </View>
              {item.ticketId ? (
                <View style={styles.idBox}>
                  <Text style={styles.idLabel}>TICKET ID</Text>
                  <Text style={styles.idValue}>{item.ticketId}</Text>
                </View>
              ) : null}
            </View>
          ) : isPending ? (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>Your registration is under review by the organizer.</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <Text style={styles.headerSubtitle}>Manage your event registrations</Text>
      </View>

      {isLoading && ticketsWithEvents.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching your tickets...</Text>
        </View>
      ) : ticketsWithEvents.length === 0 ? (
        <View style={styles.center}>
          {userTickets.length > 0 ? (
            <>
              <Ionicons name="time-outline" size={64} color={Colors.warning} />
              <Text style={styles.emptyTitle}>Pending Approval</Text>
              <Text style={styles.emptySubtitle}>Your event registrations are currently under review by the organizers.</Text>
            </>
          ) : (
            <>
              <Ionicons name="ticket-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Tickets Yet</Text>
              <Text style={styles.emptySubtitle}>You haven't registered for any events.</Text>
            </>
          )}
          <TouchableOpacity 
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.exploreBtnText}>Explore Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ticketsWithEvents}
          keyExtractor={(item) => item.eventId}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  ticketCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  eventTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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
  },
  ticketBody: {
    gap: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  ticketIdsContainer: {
    gap: Spacing.sm,
  },
  numberBox: {
    backgroundColor: Colors.primary + '11',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  numberLabel: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  numberValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    letterSpacing: 2,
  },
  idBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  idLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  idValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  pendingBox: {
    backgroundColor: Colors.bgSurface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  pendingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
});
