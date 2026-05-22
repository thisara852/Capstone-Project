import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { Post } from '../store/feedStore';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../constants/theme';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  isLiked: boolean;
}

export function PostCard({ post, onPress, onLike, isLiked }: PostCardProps) {
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
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
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

        {/* Event info */}
        {post.type === 'event' && post.eventDate && (
          <View style={styles.eventInfo}>
            <Ionicons name="calendar-outline" size={12} color={Colors.accentGold} />
            <Text style={styles.eventDate}>
              {format(new Date(post.eventDate), 'MMM dd, yyyy')}
            </Text>
            {post.eventLocation && (
              <>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                <Text style={styles.eventLocation} numberOfLines={1}>{post.eventLocation}</Text>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>{post.author[0]}</Text>
            </View>
            <View>
              <Text style={styles.authorName} numberOfLines={1}>{post.author}</Text>
              <Text style={styles.timeAgo}>
                {format(new Date(post.createdAt), 'MMM dd')}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? Colors.error : Colors.textSecondary}
              />
              <Text style={styles.actionCount}>{post.likes.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.actionCount}>{post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-social-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Register button for events */}
        {post.type === 'event' && post.registrationOpen && (
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
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSurface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  eventDate: {
    fontSize: FontSize.sm,
    color: Colors.accentGold,
    fontWeight: FontWeight.medium,
  },
  eventLocation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
});
