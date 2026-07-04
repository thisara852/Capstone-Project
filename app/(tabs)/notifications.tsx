import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, AppNotification } from '../../store/notificationStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';

export default function NotificationsScreen() {
  const { notifications, isLoading, unreadCount, markAllAsRead } = useNotificationStore();
  const { user } = useUserStore();

  useFocusEffect(
    useCallback(() => {
      if (user && unreadCount > 0) {
        markAllAsRead();
      }
    }, [user, unreadCount, markAllAsRead])
  );

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'announcement': return { name: 'megaphone', color: Colors.primary, bg: Colors.primary + '11' };
      case 'approval': return { name: 'ticket', color: Colors.success, bg: Colors.success + '11' };
      case 'event_approval': return { name: 'checkmark-circle', color: Colors.success, bg: Colors.success + '11' };
      case 'rejection': return { name: 'close-circle', color: Colors.error, bg: Colors.error + '11' };
      case 'verification': return { name: 'shield-checkmark', color: Colors.accentGold, bg: Colors.accentGold + '11' };
      default: return { name: 'notifications', color: Colors.textMuted, bg: Colors.bgSurface };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconInfo = getNotificationIcon(item.type);

    return (
      <TouchableOpacity 
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => {
          if (item.relatedEventId) {
            router.push({ pathname: '/post/[id]', params: { id: item.relatedEventId } });
          }
        }}
        disabled={!item.relatedEventId}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
          <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.timeText}>
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
            </Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.body}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Please sign in to view your notifications.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! New announcements and approvals will appear here.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  list: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.primary + '44',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 60,
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
    lineHeight: 22,
  },
});
