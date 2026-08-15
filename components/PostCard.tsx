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
          <View style={[styles.typeTag, { backgroundColor: typeColors[post.type] || Colors.accentGold }]}>
            <Ionicons name={typeIcons[post.type] as any} size={12} color="#FFFFFF" />
            <Text style={styles.typeText}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    height: 195,
    position: 'relative',
    backgroundColor: '#F1F5F9',
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
    height: 90,
  },
  typeTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.md,
    gap: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tagText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  eventDetailsContainer: {
    backgroundColor: '#F8FAFC',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizerText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  eventDate: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
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
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authorName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  timeAgo: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 6,
  },
  actionCount: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  registerBtn: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
