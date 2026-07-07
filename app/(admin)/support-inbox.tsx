import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { useAdminStore } from '../../store/adminStore';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSupportInboxScreen() {
  const { supportTickets, isLoading, error, fetchSupportTickets } = useAdminStore();

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const openTicket = (uid: string) => {
    router.push(`/chat/support_${uid}`);
  };

  const renderTicket = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.ticketCard} onPress={() => openTicket(item.uid)}>
      <View style={styles.ticketIconContainer}>
        <Ionicons name="person" size={24} color={Colors.primary} />
      </View>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketName}>{item.userName}</Text>
        <Text style={styles.ticketTime}>
          {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
        </Text>
      </View>
      <View style={styles.ticketStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Open</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Support Inbox</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : isLoading && supportTickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : supportTickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success} />
          <Text style={styles.emptyTitle}>Inbox Zero!</Text>
          <Text style={styles.emptyText}>There are no open support tickets right now.</Text>
        </View>
      ) : (
        <FlatList
          data={supportTickets}
          keyExtractor={(item) => item.uid}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgDark,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  listContainer: { padding: Spacing.lg },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface,
    padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  ticketIconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  ticketInfo: { flex: 1 },
  ticketName: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  ticketTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  ticketStatus: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, marginRight: Spacing.md,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, marginRight: 4 },
  statusText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  errorText: { color: Colors.error, fontSize: FontSize.md, textAlign: 'center' },
});
