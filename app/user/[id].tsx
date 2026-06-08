import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, query, collection, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile, useUserStore } from '../../store/userStore';
import { PostCard } from '../../components/PostCard';
import { Post } from '../../store/feedStore';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicProfile() {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch Profile
        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
          setError('User not found.');
          return;
        }
        setProfile(userDoc.data() as UserProfile);

        // Fetch user's posts
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const postsSnap = await getDocs(q);
        const userPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(userPosts);
      } catch (err) {
        console.error('Failed to fetch public profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="person-circle-outline" size={64} color={Colors.textMuted} />
          <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>{error || 'User not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOrganizer = profile.role === 'organizer' || profile.role === 'admin';
  const displayName = profile.displayName || 'Unknown User';
  const displayAvatar = profile.photoURL ? { uri: profile.photoURL } : null;
  const isSelf = user?.uid === id;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }}>
          {isSelf && (
            <TouchableOpacity onPress={() => router.push('/(settings)/edit-profile')} style={styles.editBtn}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeaderCard}>
          <LinearGradient
            colors={isOrganizer ? [Colors.bgCardAlt, Colors.bgDark] : [Colors.bgCard, Colors.bgDark]}
            style={styles.gradientBg}
          >
            <View style={styles.avatarWrapper}>
              {displayAvatar ? (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View> // Replace with actual image later if needed, but text fallback handles photoURL well if we use Image
              ) : (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {isOrganizer && profile.verificationStatus === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                </View>
              )}
            </View>

            <Text style={styles.name}>{isOrganizer ? profile.organizationName || displayName : displayName}</Text>
            
            {isOrganizer ? (
              <View style={styles.roleBadgeContainer}>
                <View style={[styles.roleBadge, { backgroundColor: Colors.primary + '22' }]}>
                  <Ionicons name="business" size={12} color={Colors.primary} />
                  <Text style={[styles.roleBadgeText, { color: Colors.primary }]}>Organizer</Text>
                </View>
                {profile.ieeeSection && (
                  <View style={[styles.roleBadge, { backgroundColor: Colors.accent + '22' }]}>
                    <Ionicons name="location" size={12} color={Colors.accent} />
                    <Text style={[styles.roleBadgeText, { color: Colors.accent }]}>{profile.ieeeSection}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.roleBadgeContainer}>
                <View style={[styles.roleBadge, { backgroundColor: Colors.accentGold + '22' }]}>
                  <Ionicons name="ribbon" size={12} color={Colors.accentGold} />
                  <Text style={[styles.roleBadgeText, { color: Colors.accentGold }]}>IEEE {profile.membershipType || 'Student'}</Text>
                </View>
              </View>
            )}

            {profile.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {!isOrganizer && profile.university && (
              <View style={styles.universityRow}>
                <Ionicons name="school-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.universityText}>
                  {profile.university} {profile.branch ? `• ${profile.branch.toUpperCase()}` : ''}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {!isOrganizer && profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsGrid}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isOrganizer ? 'Hosted Events' : 'Recent Posts'}</Text>
          {posts.length > 0 ? (
            posts.map(post => {
              const isLiked = post.likes?.includes(user?.uid || '') || false;
              return (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPress={() => router.push(`/post/${post.id}`)} 
                  onLike={() => {
                    import('../../store/feedStore').then(({ useFeedStore }) => {
                      useFeedStore.getState().toggleLike(post.id, user?.uid || '');
                    });
                  }}
                  isLiked={isLiked}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No posts yet.</Text>
            </View>
          )}
        </View>

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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  editBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  container: {
    paddingBottom: Spacing.xxl,
  },
  profileHeaderCard: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gradientBg: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.bgDark,
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
  },
  bio: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  universityText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
