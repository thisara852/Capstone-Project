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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFeedStore } from '../../store/feedStore';
import { useUserStore } from '../../store/userStore';
import { PostCard } from '../../components/PostCard';
import { rankPostsByInterests } from '../../services/nlpService';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { IEEE_TOPICS } from '../../config/api';

const FILTERS = ['All', 'Events', 'Articles', 'Announcements', 'News'];

export default function FeedScreen() {
  const { posts, isLoading, fetchPosts, toggleLike } = useFeedStore();
  const { profile, user } = useUserStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPosts(profile?.interests);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(profile?.interests);
    setRefreshing(false);
  };

  // Apply filter
  let filteredPosts = posts;
  if (activeFilter !== 'All') {
    filteredPosts = posts.filter(
      (p) => p.type === activeFilter.toLowerCase().slice(0, -1)
    );
  }

  // NLP ranking by user interests
  const rankedPosts = profile?.interests?.length
    ? rankPostsByInterests(filteredPosts, profile.interests)
    : filteredPosts;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View>
          <Text style={styles.greeting}>
            Hey {profile?.displayName?.split(' ')[0] || 'Dewmi'} 👋
          </Text>
          <Text style={styles.headerTitle}>IEEE CompConnect</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </Animated.View>

      {/* NLP Banner */}
      {profile?.interests && profile.interests.length > 0 && (
        <View style={styles.nlpBanner}>
          <Ionicons name="sparkles" size={14} color={Colors.accent} />
          <Text style={styles.nlpText}>
            Personalized for your interests in{' '}
            <Text style={{ color: Colors.accent }}>{profile.interests[0]}</Text>
            {profile.interests.length > 1 ? ` +${profile.interests.length - 1} more` : ''}
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            {activeFilter === filter ? (
              <LinearGradient
                colors={Colors.gradientPrimary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterGradient}
              >
                <Text style={[styles.filterText, styles.filterTextActive]}>{filter}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.filterText}>{filter}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Post Feed */}
      <Animated.FlatList
        data={rankedPosts}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/post/${item.id}`)}
            onLike={() => toggleLike(item.id, user?.uid || 'demo')}
            isLiked={item.likes.includes(user?.uid || 'demo')}
          />
        )}
      />
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
    paddingVertical: Spacing.md,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
  },
  notifBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.bgCard,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.bgDark,
  },
  nlpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.accent + '11',
    borderWidth: 1,
    borderColor: Colors.accent + '33',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nlpText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTextActive: {
    color: '#fff',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
  },
});
