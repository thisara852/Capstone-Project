import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useFeedStore } from '../../store/feedStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, toggleLike } = useFeedStore();
  const { user } = useUserStore();
  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);
  const userId = user?.uid || 'demo-user';

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLiked = post.likes.includes(userId);

  const handleRegister = () => {
    Alert.alert(
      'Event Registration',
      `You're registering for:\n"${post.title}"\n\nThis will connect you to the event group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register & Join Group',
          onPress: () => {
            Alert.alert('✅ Registered!', 'You have been added to the event group. Check Groups tab.', [
              { text: 'View Groups', onPress: () => router.push('/(tabs)/groups') },
              { text: 'OK' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Header */}
        {post.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', Colors.bgDark]}
              style={StyleSheet.absoluteFillObject}
            />
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          {/* Tags */}
          <View style={styles.tagsRow}>
            {post.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Author */}
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>{post.author[0]}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.postDate}>{format(new Date(post.createdAt), 'MMM dd, yyyy · HH:mm')}</Text>
            </View>
          </View>

          {/* Event Details */}
          {post.type === 'event' && (
            <View style={styles.eventBox}>
              <Text style={styles.eventBoxTitle}>📅 Event Details</Text>
              {post.eventDate && (
                <View style={styles.eventDetail}>
                  <Ionicons name="calendar" size={16} color={Colors.accentGold} />
                  <Text style={styles.eventDetailText}>
                    {format(new Date(post.eventDate), 'EEEE, MMMM dd, yyyy')}
                  </Text>
                </View>
              )}
              {post.eventLocation && (
                <View style={styles.eventDetail}>
                  <Ionicons name="location" size={16} color={Colors.error} />
                  <Text style={styles.eventDetailText}>{post.eventLocation}</Text>
                </View>
              )}
              <View style={styles.eventDetail}>
                <Ionicons name="people" size={16} color={Colors.success} />
                <Text style={[styles.eventDetailText, { color: Colors.success }]}>
                  {post.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                </Text>
              </View>
            </View>
          )}

          {/* Content */}
          <Text style={styles.body}>{post.content}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id, userId)}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? Colors.error : Colors.textSecondary} />
              <Text style={styles.actionLabel}>{post.likes.length} Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>{post.comments} Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-social-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA for events */}
      {post.type === 'event' && post.registrationOpen && (
        <View style={styles.bottomCTA}>
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <LinearGradient
              colors={Colors.gradientPrimary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.registerText}>Register for This Event</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  imageContainer: { height: 300, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  content: { padding: Spacing.lg, gap: Spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary + '44' },
  tagText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary, lineHeight: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  authorInitial: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  authorName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold },
  postDate: { color: Colors.textMuted, fontSize: FontSize.sm },
  eventBox: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  eventBoxTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 4 },
  eventDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventDetailText: { color: Colors.textSecondary, fontSize: FontSize.md, flex: 1 },
  body: { color: Colors.textSecondary, fontSize: FontSize.base, lineHeight: 26 },
  divider: { height: 1, backgroundColor: Colors.border },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 4, flex: 1 },
  actionLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  bottomCTA: { padding: Spacing.md, paddingBottom: Spacing.xl, backgroundColor: Colors.bgDark, borderTopWidth: 1, borderTopColor: Colors.border },
  registerBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  registerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  registerText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { color: Colors.textMuted, fontSize: FontSize.lg },
});
