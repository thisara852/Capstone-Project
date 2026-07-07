import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFeedStore } from '../../store/feedStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, toggleLike } = useFeedStore();
  const { user, profile, toggleSavePost } = useUserStore();
  
  const article = useMemo(() => {
    return posts.find((p) => p.id === id && p.type === 'article');
  }, [posts, id]);
  
  const userId = user?.uid || 'demo-user';
  const isLiked = article?.likes?.includes(userId) || false;
  const isSaved = profile?.savedPostIds?.includes(article?.id || '') || false;

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.notFoundText}>Article not found or has been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Read "${article.title}" by ${article.author} on IEEE CompConnect!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => toggleSavePost(article.id)}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={isSaved ? Colors.primary : Colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Category & Tags */}
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>ARTICLE</Text>
          </View>
          <Text style={styles.readTimeText}>
            {article.readTime ? `${article.readTime} min read` : '5 min read'}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>
        
        {/* Summary */}
        {article.summary ? (
          <Text style={styles.summary}>{article.summary}</Text>
        ) : null}

        {/* Author Info */}
        <TouchableOpacity 
          style={styles.authorSection}
          onPress={() => router.push(`/user/${article.authorId}`)}
          activeOpacity={0.8}
        >
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{article.author[0]}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{article.author}</Text>
            <Text style={styles.publishDate}>
              {format(new Date(article.createdAt), 'MMMM dd, yyyy')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Cover Image */}
        {article.imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: getOptimizedImageUrl(article.imageUrl) }} 
              style={styles.image} 
              resizeMode="cover" 
            />
          </View>
        )}

        {/* Article Body */}
        <View style={styles.bodyContainer}>
          <Text style={styles.bodyText}>{article.content}</Text>
        </View>

        {/* Article Tags Footer */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsFooter}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Interaction Bar */}
        <View style={styles.interactionBar}>
          <TouchableOpacity 
            style={styles.interactionBtn} 
            onPress={() => toggleLike(article.id, userId)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? Colors.error : Colors.textSecondary}
            />
            <Text style={[styles.interactionText, isLiked && { color: Colors.error }]}>
              {article.likes?.length || 0} Likes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.interactionBtn}
            onPress={() => router.push(`/post/${article.id}/comments`)}
          >
            <Ionicons name="chatbubble-outline" size={22} color={Colors.textSecondary} />
            <Text style={styles.interactionText}>{article.comments || 0} Comments</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.sm,
  },
  scrollContent: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  readTimeText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 36,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summary: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    lineHeight: 28,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authorInitial: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  authorName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  publishDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  imageContainer: {
    width: width,
    height: width * 0.6,
    marginBottom: Spacing.xl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bodyContainer: {
    paddingHorizontal: Spacing.lg,
  },
  bodyText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  tagsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  tagBadge: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadgeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  interactionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  headerBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notFoundText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
