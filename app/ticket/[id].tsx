import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRegistrationStore } from '../../store/registrationStore';
import { useFeedStore } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { format } from 'date-fns';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userTickets } = useRegistrationStore();
  const { posts } = useFeedStore();
  const ticket = userTickets.find(r => r.eventId === id);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="warning" size={48} color={Colors.warning} />
          <Text style={styles.notFoundText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = ticket.status === 'approved' || ticket.status === 'checked-in';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.badgeContainer}>
          {/* Badge Header */}
          <View style={styles.badgeHeader}>
            <Ionicons name="hardware-chip" size={24} color="#fff" />
            <Text style={styles.badgeHeaderText}>IEEE EVENT PASS</Text>
          </View>

          {/* Badge Body */}
          <View style={styles.badgeBody}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{ticket.userDisplayName[0]}</Text>
            </View>

            <Text style={styles.userName} numberOfLines={2}>{ticket.userDisplayName}</Text>
            <Text style={styles.userEmail}>{ticket.userEmail}</Text>

            {ticket.studentId ? (
              <View style={styles.studentIdBox}>
                <Text style={styles.studentIdLabel}>STUDENT / IEEE ID</Text>
                <Text style={styles.studentIdValue}>{ticket.studentId}</Text>
              </View>
            ) : (
              <View style={{ height: Spacing.md }} />
            )}

            <View style={styles.divider} />

            <Text style={styles.eventLabel}>EVENT</Text>
            <Text style={styles.eventTitle}>{ticket.eventTitle || 'Event Ticket'}</Text>

            {/* Approval Info */}
            {isApproved && ticket.participantNumber ? (
              <View style={styles.numbersContainer}>
                <View style={styles.participantBox}>
                  <Text style={styles.participantLabel}>PARTICIPANT NO.</Text>
                  <Text style={styles.participantValue}>{ticket.participantNumber}</Text>
                </View>

                {ticket.ticketId ? (
                  <View style={styles.ticketIdBox}>
                    <Text style={styles.ticketIdLabel}>TICKET ID</Text>
                    <Text style={styles.ticketIdValue}>{ticket.ticketId}</Text>
                    <Text style={styles.barcodeFake}>|||| | || || | ||| || |</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.pendingBox}>
                <Ionicons name="time" size={32} color={Colors.warning} />
                <Text style={styles.pendingTitle}>Pending Approval</Text>
                <Text style={styles.pendingText}>Your digital pass numbers will appear here once the organizer approves your registration.</Text>
              </View>
            )}

          </View>

          {/* Badge Footer */}
          <View style={styles.badgeFooter}>
            <Text style={styles.footerDate}>
              Issued: {format(new Date(ticket.registeredAt), 'MMM dd, yyyy')}
            </Text>
            <View style={[
              styles.statusDot, 
              { backgroundColor: ticket.status === 'checked-in' ? Colors.primary : Colors.success }
            ]} />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewEventBtn}
          onPress={() => router.push(`/post/${ticket.eventId}`)}
        >
          <Text style={styles.viewEventText}>View Event Page</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {isApproved && (
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => router.push(`/chat/${ticket.eventId}`)}
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.chatBtnText}>Join Event Chat</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  badgeContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff', // White badge looks like a real physical pass
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeHeader: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badgeHeaderText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: 2,
  },
  badgeBody: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: Colors.bgSurface,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: '#666',
    marginBottom: Spacing.md,
  },
  studentIdBox: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  studentIdLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  studentIdValue: {
    fontSize: FontSize.md,
    color: '#1a1a2e',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e1e4e8',
    marginBottom: Spacing.lg,
  },
  eventLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  numbersContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  participantBox: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary + '0A',
  },
  participantLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  participantValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a2e',
    letterSpacing: 2,
  },
  ticketIdBox: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ticketIdLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  ticketIdValue: {
    fontSize: FontSize.md,
    color: '#1a1a2e',
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  barcodeFake: {
    fontFamily: 'monospace',
    fontSize: 24,
    color: '#1a1a2e',
    letterSpacing: -1,
    marginTop: 4,
    transform: [{ scaleY: 1.5 }],
  },
  pendingBox: {
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#ffe082',
    width: '100%',
  },
  pendingTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: '#b28900',
    marginTop: 8,
    marginBottom: 4,
  },
  pendingText: {
    fontSize: FontSize.sm,
    color: '#666',
    textAlign: 'center',
  },
  badgeFooter: {
    backgroundColor: '#f8f9fa',
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  footerDate: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  viewEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary + '1A',
    borderRadius: BorderRadius.full,
  },
  viewEventText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: '100%',
    maxWidth: 360,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
