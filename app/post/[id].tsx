import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Share,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useFeedStore } from '../../store/feedStore';
import { useUserStore } from '../../store/userStore';
import { useAdminStore } from '../../store/adminStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { useRegistrationStore } from '../../store/registrationStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import { EventRegistrationForm } from '../../components/forms/EventRegistrationForm';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, toggleLike } = useFeedStore();
  const { events: adminEvents } = useAdminStore();
  const { myCompetitions } = useCompetitionStore();
  const { user, profile } = useUserStore();

  const post = useMemo(() => {
    return posts.find((p) => p.id === id) ||
      adminEvents.find((p) => p.id === id) ||
      myCompetitions.find((p) => p.id === id);
  }, [posts, adminEvents, myCompetitions, id]);

  const userId = user?.uid || 'demo-user';
  const { userTickets } = useRegistrationStore();
  const [showRegForm, setShowRegForm] = useState(false);

  const isLiked = post?.likes?.includes(userId) || false;
  const isSaved = profile?.savedPostIds?.includes(post?.id || '') || false;

  const currentRegistration = useMemo(() => {
    if (!post || post.type !== 'event') return null;
    return userTickets.find(t => t.eventId === post.id) || null;
  }, [userTickets, post]);

  const isRegistered = !!currentRegistration;

  let regStatusMessage = 'Register for Event';
  let isRegActive = post?.registrationOpen !== false;

  if (post?.type === 'event' && post.registrationStartDate && post.registrationEndDate) {
    const now = Date.now();
    if (now < post.registrationStartDate) {
      isRegActive = false;
      regStatusMessage = `Opens on ${format(new Date(post.registrationStartDate), 'MMM dd')}`;
    } else if (now > post.registrationEndDate) {
      isRegActive = false;
      regStatusMessage = 'Registration Closed';
    }
  } else if (post?.type === 'event' && !isRegActive) {
    regStatusMessage = 'Registration Closed';
  }

  const isCreatorOrganizer = post?.authorId === user?.uid;
  const isAdmin = profile?.role === 'admin';
  const isApprovedParticipant = currentRegistration?.status === 'approved' || currentRegistration?.status === 'checked-in';
  const canAccessChat = post?.type === 'event' && !isAdmin && (isCreatorOrganizer || isApprovedParticipant);

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
  // isLiked already defined above

  const handleRegisterClick = () => {
    if (profile?.role === 'admin' || profile?.role === 'organizer') return;
    setShowRegForm(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Header */}
        {post.imageUrl ? (
          <View style={styles.imageContainer}>
            {/* Main Contained Image (No Cropping) */}
            <Image
              source={{ uri: getOptimizedImageUrl(post.imageUrl) }}
              style={styles.image}
              resizeMode="contain"
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
              <Text style={styles.eventBoxTitle}>Event Details</Text>
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
              {post.participantLimit && (
                <View style={styles.eventDetail}>
                  <Ionicons name="stats-chart" size={16} color={Colors.primary} />
                  <Text style={styles.eventDetailText}>
                    {post.registeredCount || 0} / {post.participantLimit} Participants
                  </Text>
                </View>
              )}
              {post.category && (
                <View style={styles.eventDetail}>
                  <Ionicons name="grid-outline" size={16} color={Colors.accent} />
                  <Text style={styles.eventDetailText}>{post.category}</Text>
                </View>
              )}
              {post.rules && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={[styles.eventDetailText, { fontWeight: 'bold', marginBottom: 4 }]}>Rules & Requirements:</Text>
                  <Text style={[styles.eventDetailText, { lineHeight: 20 }]}>{post.rules}</Text>
                </View>
              )}
              {post.pdfUrl && (
                <TouchableOpacity
                  style={styles.pdfDownloadBtn}
                  onPress={() => Linking.openURL(post.pdfUrl!)}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.pdfDownloadText}>Download Guidelines PDF</Text>
                </TouchableOpacity>
              )}
              {post.websiteUrl && (
                <TouchableOpacity
                  style={[styles.pdfDownloadBtn, { backgroundColor: Colors.info, marginTop: Spacing.sm }]}
                  onPress={() => Linking.openURL(post.websiteUrl!)}
                >
                  <Ionicons name="globe-outline" size={20} color="#fff" />
                  <Text style={styles.pdfDownloadText}>Visit External Website</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <Text style={styles.body}>{post.content}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              console.log('Toggled Like on post details');
              toggleLike(post.id, userId);
            }}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? Colors.error : Colors.textSecondary} />
              <Text style={styles.actionLabel}>{post.likes?.length || 0} Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              console.log('Navigating to comments');
              router.push(`/post/${post.id}/comments`);
            }}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>{post.comments || 0} Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                console.log('Share clicked');
                try {
                  await Share.share({ message: `Check out "${post.title}" on IEEE CompConnect!` });
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              <Ionicons name="share-social-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => useUserStore.getState().toggleSavePost(post.id)}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? Colors.primary : Colors.textSecondary} />
              <Text style={styles.actionLabel}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Join Chat Button (if authorized) */}
          {canAccessChat && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push(`/chat/${post.id}`)}
            >
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <Text style={styles.chatBtnText}>Join Event Chat</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      {/* Bottom CTA for events */}
      {post.type === 'event' && profile?.role !== 'admin' && profile?.role !== 'organizer' && (
        <View style={styles.bottomCTA}>
          {isRegistered ? (
            <View style={[
              styles.registerBtn,
              { backgroundColor: currentRegistration?.status === 'pending' ? Colors.warning + '22' : Colors.success + '22' }
            ]}>
              <Ionicons
                name={currentRegistration?.status === 'pending' ? 'time' : 'checkmark-circle'}
                size={20}
                color={currentRegistration?.status === 'pending' ? Colors.warning : Colors.success}
              />
              <Text style={[
                styles.registerText,
                { color: currentRegistration?.status === 'pending' ? Colors.warning : Colors.success }
              ]}>
                {currentRegistration?.status === 'pending' ? 'Pending Approval' : 'Registered'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              <TouchableOpacity
                style={[styles.registerBtn, (!isRegActive) && { opacity: 0.6 }]}
                onPress={handleRegisterClick}
                disabled={!isRegActive}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerGradient}
                >
                  <Text style={styles.registerText}>
                    {regStatusMessage}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {post && (
        <EventRegistrationForm
          eventId={post.id}
          registrationConfig={post.registrationConfig}
          visible={showRegForm}
          onClose={() => setShowRegForm(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
  },
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    gap: 8,
  },
  pdfDownloadText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
});
