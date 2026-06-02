import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { useRegistrationStore } from '../../store/registrationStore';
import { useFeedStore } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const CATEGORIES = ['All', 'Research', 'Security', 'Robotics', 'Community', 'AI', 'UI/UX'];

const CATEGORY_ICONS: Record<string, string> = {
  Research: 'flask',
  Security: 'shield-checkmark',
  Robotics: 'hardware-chip',
  Community: 'people',
  AI: 'git-network',
  'UI/UX': 'color-palette',
  All: 'grid',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = ['#6C63FF', '#FF6584', '#43B89C', '#F7B731', '#4A90E2', '#E05C65'];
function getAvatarColor(str: string) {
  let hash = 0;
  if (!str) return AVATAR_COLORS[0];
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function GroupsScreen() {
  const { groups, myGroups, fetchGroups, fetchMyGroups, joinGroup, leaveGroup, isLoading } = useGroupStore();
  const { user, profile } = useUserStore();
  const { userTickets } = useRegistrationStore();
  const { posts } = useFeedStore();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [joinLinkText, setJoinLinkText] = useState('');

  const loadData = async () => {
    if (user?.uid) {
      await Promise.all([
        fetchGroups(activeCategory),
        fetchMyGroups(user.uid),
        useRegistrationStore.getState().fetchUserTickets(user.uid)
      ]);
    } else {
      fetchGroups(activeCategory);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.uid, activeCategory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const userId = user?.uid || '';
  const myGroupIds = myGroups.map(g => g.id);

  // ── Event Chats (WhatsApp-style) ────────────────────────────
  const ticketEvents = userTickets
    .filter((r) => r.status === 'approved' || r.status === 'checked-in')
    .map((r) => {
      const event = posts.find((p) => p.id === r.eventId);
      return event ? { id: event.id, title: event.title, author: event.author, status: r.status, imageUrl: event.imageUrl } : null;
    })
    .filter(Boolean) as { id: string; title: string; author: string; status: string; imageUrl?: string }[];
  
  const organizedEvents = posts
    .filter((p) => p.type === 'event' && p.authorId === userId)
    .map((event) => ({
      id: event.id,
      title: event.title,
      author: event.author,
      status: 'organizer',
      imageUrl: event.imageUrl,
    }));

  const myEventChatsRaw = [...ticketEvents, ...organizedEvents];
  const myEventChats = Array.from(new Map(myEventChatsRaw.map((item) => [item.id, item])).values());

  // ── Recommendations (circles not yet joined) ─────────────────
  const recommendations = groups.filter(
    (g) =>
      !myGroupIds.includes(g.id) &&
      (!search || g.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>Communities</Text>
            <Text style={styles.subtitle}>Chats & Circles</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.createBtn, { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border }]}
              onPress={() => setIsJoinModalVisible(true)}
            >
              <Ionicons name="link" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => router.push('/create-group')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ───────────────────────────────────────────── */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* ── Event Chats ─────────────────── */}
        {myEventChats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Event Chats</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{myEventChats.length}</Text>
              </View>
            </View>

            {myEventChats.map((chat) => {
              const avatarColor = getAvatarColor(chat.title);
              const isCheckedIn = chat.status === 'checked-in';
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatRow}
                  onPress={() => router.push(`/chat/${chat.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.chatAvatar, { backgroundColor: avatarColor }]}>
                    {chat.imageUrl ? (
                      <Image source={{ uri: chat.imageUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.chatAvatarText}>{getInitials(chat.title)}</Text>
                    )}
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <Text style={styles.chatName} numberOfLines={1}>{chat.title}</Text>
                      <Text style={styles.chatTime}>Live</Text>
                    </View>
                    <View style={styles.chatBottomRow}>
                      <Text style={styles.chatPreview} numberOfLines={1}>Tap to open group chat...</Text>
                      {isCheckedIn && (
                        <View style={styles.checkedInBadge}>
                          <Text style={styles.checkedInText}>✓ In</Text>
                        </View>
                      )}
                      {chat.status === 'organizer' && (
                        <View style={[styles.checkedInBadge, { backgroundColor: Colors.accentGold }]}>
                          <Text style={styles.checkedInText}>⭐ Host</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── My Joined Circles ────────────────────────────────── */}
        {myGroups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Circles</Text>
            </View>
            {myGroups.map((group) => {
              const avatarColor = getAvatarColor(group.name);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.chatRow}
                  onPress={() => router.push(`/group/${group.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.chatAvatar, { backgroundColor: avatarColor }]}>
                    {group.avatar ? (
                      <Image source={{ uri: group.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.chatAvatarText}>{getInitials(group.name)}</Text>
                    )}
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <Text style={styles.chatName} numberOfLines={1}>
                        {group.name} {group.verified && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                      </Text>
                      <Text style={styles.chatMemberCount}>{group.memberCount} members</Text>
                    </View>
                    <Text style={styles.chatPreview} numberOfLines={1}>{group.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* ── Recommended Circles ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover Communities</Text>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Ionicons
                  name={(CATEGORY_ICONS[cat] || 'grid') as any}
                  size={13}
                  color={activeCategory === cat ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading && !refreshing ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : recommendations.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No communities found.</Text>
            </View>
          ) : (
            recommendations.map((group) => {
              const avatarColor = getAvatarColor(group.name);
              return (
                <View key={group.id} style={styles.recommendCard}>
                  <TouchableOpacity 
                    style={[styles.recommendAvatar, { backgroundColor: avatarColor }]}
                    onPress={() => router.push(`/group/${group.id}`)}
                  >
                    {group.avatar ? (
                      <Image source={{ uri: group.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.chatAvatarText}>{getInitials(group.name)}</Text>
                    )}
                  </TouchableOpacity>
                  <View style={styles.recommendInfo}>
                    <TouchableOpacity onPress={() => router.push(`/group/${group.id}`)}>
                      <Text style={styles.recommendName} numberOfLines={1}>
                        {group.name} {group.verified && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.recommendDesc} numberOfLines={2}>{group.description}</Text>
                    <View style={styles.recommendMeta}>
                      <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.recommendMembers}>{group.memberCount} members</Text>
                      <View style={styles.catDot} />
                      <Text style={styles.recommendCat}>{group.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={async () => {
                      if (!userId) {
                        Alert.alert("Login Required", "Please login to join communities.");
                        return;
                      }
                      await joinGroup(group.id, userId);
                    }}
                  >
                    <LinearGradient
                      colors={Colors.gradientPrimary as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.joinGradient}
                    >
                      <Text style={styles.joinText}>Join</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Premium Join Modal ─────────────────────────────── */}
      <Modal visible={isJoinModalVisible} transparent={true} animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{flex: 1}}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={[Colors.bgCard, '#1A1F30']}
              style={styles.modalContent}
            >
              <View style={styles.modalIconWrap}>
                <Ionicons name="link" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Join Community</Text>
              <Text style={styles.modalSubtitle}>Paste your secure invite link or community ID below.</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="ieeecompconnect://group/abc..."
                placeholderTextColor={Colors.textMuted}
                value={joinLinkText}
                onChangeText={setJoinLinkText}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setIsJoinModalVisible(false);
                    setJoinLinkText('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalJoinBtn, !joinLinkText.trim() && { opacity: 0.5 }]}
                  disabled={!joinLinkText.trim()}
                  onPress={() => {
                    if (joinLinkText) {
                      const extractedId = joinLinkText.split('/').pop()?.trim();
                      setIsJoinModalVisible(false);
                      setJoinLinkText('');
                      if (extractedId) router.push(`/group/${extractedId}`);
                    }
                  }}
                >
                  <Text style={styles.modalJoinText}>Join</Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 12 },

  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  sectionBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // ── WhatsApp-style chat row ───────────────────────────────────
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.bgDark,
    gap: 12,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  chatAvatarText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
  chatInfo: { flex: 1, gap: 3 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  chatTime: { fontSize: FontSize.xs, color: Colors.success },
  chatMemberCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatPreview: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  checkedInBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  checkedInText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  divider: {
    height: 8,
    backgroundColor: Colors.bgCard,
    marginBottom: Spacing.md,
  },

  catScroll: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 12, paddingTop: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  catTextActive: { color: '#fff' },

  // ── Modal Styles ───────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: Colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  modalIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  modalInput: { width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.full, backgroundColor: 'transparent', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' },
  modalJoinBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  modalJoinText: { color: '#fff', fontSize: FontSize.md, fontWeight: 'bold' },

  // ── Recommendation card ───────────────────────────────────────
  recommendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 12,
  },
  recommendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendInfo: { flex: 1, gap: 2 },
  recommendName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  recommendDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  recommendMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  recommendMembers: { fontSize: 11, color: Colors.textMuted },
  catDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  recommendCat: { fontSize: 11, color: Colors.primary },

  joinBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  joinGradient: { paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
