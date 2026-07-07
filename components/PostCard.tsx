import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { Post } from '../store/feedStore';
import { useUserStore } from '../store/userStore';
import { useRegistrationStore } from '../store/registrationStore';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../constants/theme';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  isLiked: boolean;
}

export function PostCard({ post, onPress, onLike, isLiked }: PostCardProps) {
  const { profile, toggleSavePost } = useUserStore();
  const { userTickets } = useRegistrationStore();
  
  const isSaved = profile?.savedPostIds?.includes(post.id) || false;
  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin';

  // Find if the logged-in user has a ticket for this specific event
  const myTicket = post.type === 'event'
    ? userTickets.find(t => t.eventId === post.id)
    : undefined;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${post.title}" on IEEE CompConnect!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const typeColors: Record<string, string> = {
    event: Colors.accentGold,
    article: Colors.primaryLight,
    announcement: Colors.success,
    news: Colors.accent,
  };

  const typeIcons: Record<string, string> = {
    event: 'calendar',
    article: 'newspaper',
    announcement: 'megaphone',
    news: 'globe',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: getOptimizedImageUrl(post.imageUrl) }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(10,15,30,0.95)']}
            style={styles.imageGradient}
          />
          <View style={styles.typeTag}>
            <Ionicons name={typeIcons[post.type] as any} size={10} color={Colors.bgDark} />
            <Text style={[styles.typeText, { color: Colors.bgDark }]}>
              {post.type.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Author Row — shown right after image */}
      <TouchableOpacity
        style={styles.authorRow}
        onPress={() => router.push(`/user/${post.authorId}`)}
      >
        <View style={styles.authorAvatar}>
          <Text style={styles.authorInitial}>{post.author[0]}</Text>
        </View>
        <View>
          <Text style={styles.authorName} numberOfLines={1}>{post.author}</Text>
          <Text style={styles.timeAgo}>
            {format(new Date(post.createdAt), 'MMM dd')}
            {post.type === 'article' && post.readTime ? ` • ${post.readTime} min read` : ''}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Tags */}
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

        {/* Summary */}
        <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>

        {/* Event Details (Organizer, Branch, Date, Location) */}
        {post.type === 'event' && (
          <View style={styles.eventDetailsContainer}>
            <View style={styles.eventDetailRow}>
              <Ionicons name="business" size={14} color={Colors.primary} />
              <Text style={styles.organizerText} numberOfLines={1}>
                Organized by <Text style={{fontWeight: 'bold', color: Colors.textPrimary}}>{post.author}</Text>
                {post.branch ? ` • ${post.branch}` : ''}
              </Text>
            </View>
            
            {post.eventDate && (
              <View style={[styles.eventDetailRow, { marginTop: 6 }]}>
                <Ionicons name="calendar" size={14} color={Colors.accentGold} />
                <Text style={styles.eventDate}>
                  {format(new Date(post.eventDate), 'MMM dd, yyyy')}
                </Text>
                {post.eventLocation && (
                  <>
                    <View style={styles.dotSeparator} />
                    <Ionicons name="location" size={14} color={Colors.textSecondary} />
                    <Text style={styles.eventLocation} numberOfLines={1}>{post.eventLocation}</Text>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Footer — actions only */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? Colors.error : Colors.textSecondary}
              />
              <Text style={styles.actionCount}>{post.likes.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}/comments`)}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionCount}>{post.comments || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSavePost(post.id)}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={isSaved ? Colors.primary : Colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Registration status badge or Register button for events */}
        {post.type === 'event' && !isOrganizer && (() => {
          if (!myTicket && post.registrationOpen) {
            return (
              <TouchableOpacity style={styles.registerBtn} onPress={onPress}>
                <LinearGradient
                  colors={Colors.gradientPrimary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerGradient}
                >
                  <Text style={styles.registerText}>Register Now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            );
          }
          if (myTicket?.status === 'pending') {
            return (
              <View style={[styles.statusBadge, { backgroundColor: Colors.warning + '22', borderColor: Colors.warning }]}>
                <Ionicons name="time-outline" size={14} color={Colors.warning} />
                <Text style={[styles.statusBadgeText, { color: Colors.warning }]}>Pending Approval</Text>
              </View>
            );
          }
          if (myTicket?.status === 'approved' || myTicket?.status === 'checked-in') {
            return (
              <View style={[styles.statusBadge, { backgroundColor: Colors.success + '22', borderColor: Colors.success }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={[styles.statusBadgeText, { color: Colors.success }]}>Registered</Text>
              </View>
            );
          }
          if (myTicket?.status === 'rejected') {
            return (
              <View style={[styles.statusBadge, { backgroundColor: Colors.error + '22', borderColor: Colors.error }]}>
                <Ionicons name="close-circle" size={14} color={Colors.error} />
                <Text style={[styles.statusBadgeText, { color: Colors.error }]}>Registration Rejected</Text>
              </View>
            );
          }
          return null;
        })()}
        {post.type === 'event' && isOrganizer && post.registrationOpen && (
          <TouchableOpacity style={styles.registerBtn} onPress={onPress}>
            <LinearGradient
              colors={Colors.gradientPrimary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              <Text style={styles.registerText}>View Details</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  typeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.accentGold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  summary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  eventDetailsContainer: {
    backgroundColor: Colors.bgSurface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organizerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  eventDate: {
    fontSize: FontSize.xs,
    color: Colors.accentGold,
    fontWeight: FontWeight.bold,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 4,
  },
  eventLocation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  authorName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    maxWidth: 120,
  },
  timeAgo: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  registerBtn: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  registerText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
