import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ScrollView,
  InteractionManager,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFeedStore } from '../../store/feedStore';
import { useUserStore } from '../../store/userStore';
import { useRegistrationStore } from '../../store/registrationStore';
import { PostCard } from '../../components/PostCard';
import { rankPostsByInterests } from '../../services/nlpService';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { IEEE_TOPICS } from '../../config/api';
import { useNotificationStore } from '../../store/notificationStore';

const FILTERS = ['All', 'Events', 'Articles', 'Announcements', 'News'];

export default function FeedScreen() {
  const { posts, isLoading, fetchPosts, toggleLike } = useFeedStore();
  const { profile, user } = useUserStore();
  const { fetchUserTickets } = useRegistrationStore();
  const { unreadCount } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const [upperHeaderHeight, setUpperHeaderHeight] = useState(100);
  const [filterHeightState, setFilterHeightState] = useState(60);
  const insets = useSafeAreaInsets();

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.uid) return;

    fetchPosts(profile?.interests);

    // Defer tickets fetch so it doesn't compete with the main feed listener
    const task = InteractionManager.runAfterInteractions(() => {
      fetchUserTickets(user.uid);
    });
    return () => task.cancel();
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(profile?.interests);
    if (user?.uid) {
      fetchUserTickets(user.uid);
    }
    setRefreshing(false);
  };

  // Apply filter
  let filteredPosts = posts;
  if (activeFilter !== 'All') {
    filteredPosts = posts.filter((p) => {
      const type = activeFilter.toLowerCase();
      // 'news' shouldn't be sliced, others should (Events -> event)
      const targetType = type === 'news' ? 'news' : type.slice(0, -1);
      return p.type === targetType;
    });
  }

  // NLP ranking by user interests
  const rankedPosts = profile?.interests?.length
    ? rankPostsByInterests(filteredPosts, profile.interests)
    : filteredPosts;

  // Interpolations for shrink animation
  const scrollDistance = Math.max(upperHeaderHeight - insets.top, 1);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, scrollDistance],
    outputRange: [0, -scrollDistance],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, scrollDistance / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Shrink the chips uniformly using scale
  const chipScale = scrollY.interpolate({
    inputRange: [0, scrollDistance],
    outputRange: [1, 0.88],
    extrapolate: 'clamp',
  });

  const totalHeaderHeight = upperHeaderHeight + filterHeightState;

  return (
    <View style={styles.safe}>
      {/* Absolute Sticky Header Container */}
      <Animated.View
        style={[
          styles.absoluteHeaderContainer,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <View
          style={styles.upperHeaderContainer}
          onLayout={(e) => setUpperHeaderHeight(e.nativeEvent.layout.height)}
        >
          {/* Top Header Row */}
          <Animated.View style={[styles.header, { opacity: headerOpacity, paddingTop: Math.max(insets.top, Spacing.sm) }]}>
            <View>
              <Text style={styles.greeting}>
                Hey {profile?.displayName?.split(' ')[0] || 'Dewmi'}
              </Text>
              <Text style={styles.headerTitle}>IEEE CompConnect</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                {unreadCount > 0 && <View style={styles.notifDot} />}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* NLP Banner */}
          {profile?.interests && profile.interests.length > 0 && (
            <Animated.View style={[styles.nlpBanner, { opacity: headerOpacity }]}>
              <Ionicons name="sparkles" size={14} color={Colors.accent} />
              <Text style={styles.nlpText}>
                Personalized for your interests in{' '}
                <Text style={{ color: Colors.accent }}>{profile.interests[0]}</Text>
                {profile.interests.length > 1 ? ` +${profile.interests.length - 1} more` : ''}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Filter Tabs (Sticky Section) */}
        <View
          style={styles.filterSection}
          onLayout={(e) => setFilterHeightState(e.nativeEvent.layout.height)}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((filter) => (
              <Animated.View key={filter} style={{ transform: [{ scale: chipScale }] }}>
                <TouchableOpacity
                  style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  {activeFilter === filter ? (
                    <LinearGradient
                      colors={Colors.gradientPrimary as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterGradient}
                    >
                      <View style={styles.filterInner}>
                        <Text style={[styles.filterText, styles.filterTextActive]}>
                          {filter}
                        </Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterInner}>
                      <Text style={styles.filterText}>
                        {filter}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Post Feed */}
      <Animated.FlatList
        style={{ flex: 1 }}
        data={rankedPosts}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.listContent, { paddingTop: totalHeaderHeight + Spacing.sm }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            progressViewOffset={totalHeaderHeight}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyState, { marginTop: totalHeaderHeight }]}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => {
              if (item.type === 'article') {
                router.push(`/article/${item.id}`);
              } else {
                router.push(`/post/${item.id}`);
              }
            }}
            onLike={() => toggleLike(item.id, user?.uid || 'demo')}
            isLiked={item.likes.includes(user?.uid || 'demo')}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header Containers
  absoluteHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  upperHeaderContainer: {
    backgroundColor: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: Spacing.sm,
    paddingTop: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1A73E8',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  notifBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nlpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nlpText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '500',
  },

  // Filter Tabs
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: 'transparent',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterGradient: {
    borderRadius: 20,
  },
  filterInner: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
