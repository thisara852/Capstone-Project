import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { useFeedStore } from '../../store/feedStore';
import { useRegistrationStore } from '../../store/registrationStore';
import { useGroupStore } from '../../store/groupStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function ProfileScreen() {
  const { profile, user, logout } = useUserStore();
  const { posts } = useFeedStore();
  const { userTickets } = useRegistrationStore();
  const { groups } = useGroupStore();
  const [showInterests, setShowInterests] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || '';
  const email = profile?.email || user?.email || '';
  const branch = profile?.branch || '';
  const university = profile?.university || '';
  const memberType = profile?.membershipType || 'Student';
  const interests = profile?.interests || [];

  // Calculate real stats
  const eventCount = userTickets?.length || 0;
  const groupCount = profile?.joinedGroups?.length || 0;
  const postCount = posts.filter(p => p.authorId === user?.uid).length;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#1A2035', Colors.bgDark]}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName ? displayName[0].toUpperCase() : 'U'}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity 
              style={styles.editAvatarBtn}
              onPress={() => router.push('/(settings)/edit-profile')}
            >
              <Ionicons name="create" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={[
            styles.memberBadge, 
            profile?.role === 'admin' && { backgroundColor: Colors.error + '22', borderColor: Colors.error },
            profile?.role === 'organizer' && { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }
          ]}>
            <Ionicons 
              name={profile?.role === 'admin' ? 'shield' : profile?.role === 'organizer' ? 'star' : 'ribbon'} 
              size={14} 
              color={profile?.role === 'admin' ? Colors.error : profile?.role === 'organizer' ? Colors.primary : Colors.accentGold} 
            />
            <Text style={[
              styles.memberBadgeText,
              profile?.role === 'admin' && { color: Colors.error },
              profile?.role === 'organizer' && { color: Colors.primary }
            ]}>
              {profile?.role === 'admin' ? 'Administrator' : 
               profile?.role === 'organizer' ? 'Organizer' : 
               `IEEE ${memberType} Member`}
            </Text>
          </View>
          
          {profile?.bio && (
            <Text style={styles.bioText}>{profile.bio}</Text>
          )}
          {profile?.linkedIn && (
            <TouchableOpacity style={styles.linkedInRow}>
              <Ionicons name="logo-linkedin" size={16} color="#0077b5" />
              <Text style={styles.linkedInText} numberOfLines={1}>{profile.linkedIn}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Events', value: eventCount.toString() },
            { label: 'Groups', value: groupCount.toString() },
            { label: 'Posts', value: postCount.toString() },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Branch Info */}
        {branch ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IEEE Branch</Text>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push('/branch/' + branch)}
            >
              <Ionicons name="school" size={20} color={Colors.primary} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{university || 'University Not Set'}</Text>
                <Text style={styles.cardSubtitle}>Branch: {branch.toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Interests */}
        {profile?.role !== 'admin' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Interests</Text>
              {interests.length > 0 && (
                <TouchableOpacity onPress={() => setShowInterests(!showInterests)}>
                  <Ionicons name={showInterests ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {(showInterests || interests.length <= 4) && (
              <View style={styles.interestsGrid}>
                {interests.length > 0 ? (
                  interests.map((interest) => (
                    <View key={interest} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginRight: Spacing.md }}>No interests added yet.</Text>
                )}
                <TouchableOpacity 
                  style={styles.addInterestChip}
                  onPress={() => router.push('/(settings)/edit-profile')}
                >
                  <Ionicons name="add" size={14} color={Colors.primary} />
                  <Text style={styles.addInterestText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Saved Posts */}
        {profile?.savedPostIds && profile.savedPostIds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Bookmarks</Text>
            {profile.savedPostIds.map((postId) => {
              const post = posts.find((p) => p.id === postId);
              if (!post) return null;
              return (
                <TouchableOpacity 
                  key={postId} 
                  style={styles.menuItem} 
                  onPress={() => router.push(`/post/${postId}`)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: Colors.accentGold + '22' }]}>
                    <Ionicons name="bookmark" size={18} color={Colors.accentGold} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.menuLabel} numberOfLines={1}>{post.title}</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{post.author}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesRow}>
            {[
              { 
                icon: '⚡', 
                title: 'Early Adopter', 
                desc: 'Joined on launch', 
                unlocked: profile?.createdAt ? true : false, 
                progress: profile?.createdAt ? '1/1' : '0/1' 
              },
              { 
                icon: '🏆', 
                title: 'Event Champion', 
                desc: 'Registered for 5+ events', 
                unlocked: eventCount >= 5, 
                progress: `${Math.min(eventCount, 5)}/5` 
              },
              { 
                icon: '🤝', 
                title: 'Team Player', 
                desc: 'Member of 3+ groups', 
                unlocked: groupCount >= 3, 
                progress: `${Math.min(groupCount, 3)}/3` 
              },
              { 
                icon: '✍️', 
                title: 'Thought Leader', 
                desc: 'Created a post', 
                unlocked: postCount >= 1, 
                progress: `${Math.min(postCount, 1)}/1` 
              },
            ].map((badge) => (
              <TouchableOpacity 
                key={badge.title} 
                style={[styles.badge, !badge.unlocked && { opacity: 0.4 }]}
                onPress={() => setSelectedBadge(badge)}
              >
                <Text style={styles.badgeIcon}>{badge.unlocked ? badge.icon : '🔒'}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Organizer Tools */}
        {profile?.role === 'organizer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizer Tools</Text>
            <TouchableOpacity 
              style={[styles.menuItem, { borderColor: Colors.primary }]} 
              onPress={() => router.replace('/(organizer)/dashboard')}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.primary }]}>
                <Ionicons name="briefcase" size={18} color="#fff" />
              </View>
              <Text style={[styles.menuLabel, { fontWeight: 'bold' }]}>Return to Dashboard</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Tools */}
        {profile?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <TouchableOpacity 
              style={[styles.menuItem, { borderColor: Colors.error }]} 
              onPress={() => router.replace('/(admin)/dashboard')}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.error }]}>
                <Ionicons name="shield" size={18} color="#fff" />
              </View>
              <Text style={[styles.menuLabel, { fontWeight: 'bold' }]}>Return to Dashboard</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { marginTop: Spacing.sm }]} 
              onPress={() => router.push('/(admin)/support-inbox')}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Support Inbox</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { 
              icon: 'person-outline', 
              label: 'Edit Profile', 
              action: () => router.push('/(settings)/edit-profile') 
            },
            { 
              icon: 'shield-outline', 
              label: 'Privacy & Security', 
              action: () => router.push('/(settings)/privacy') 
            },
            { 
              icon: 'notifications-outline', 
              label: 'Notifications', 
              action: () => router.push('/(tabs)/notifications') 
            },
            { 
              icon: 'help-circle-outline', 
              label: 'Help & Support', 
              action: () => router.push('/(settings)/support') 
            },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Achievement Modal */}
      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={[Colors.bgCard, '#1A1F30']} style={styles.modalContent}>
              {selectedBadge && (
                <>
                  <View style={styles.modalIconWrap}>
                    <Text style={{ fontSize: 40 }}>{selectedBadge.icon}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                  <Text style={styles.modalDescription}>{selectedBadge.desc}</Text>
                  
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Current Progress</Text>
                    <Text style={styles.progressValue}>{selectedBadge.progress}</Text>
                  </View>
                  
                  {!selectedBadge.unlocked && (
                    <View style={styles.lockedContainer}>
                      <Ionicons name="lock-closed" size={16} color={Colors.warning} />
                      <Text style={styles.lockedText}>Keep exploring to unlock this badge!</Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedBadge(null)}
                  >
                    <Text style={styles.modalCloseText}>Awesome</Text>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  container: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl, gap: 8 },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 36, fontWeight: FontWeight.bold, color: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 12, width: 26, height: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.bgDark },
  displayName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  email: { color: Colors.textSecondary, fontSize: FontSize.md },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentGold + '22', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accentGold + '44' },
  memberBadgeText: { color: Colors.accentGold, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  bioText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.sm, lineHeight: 22 },
  linkedInRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  linkedInText: { color: '#0077b5', fontSize: FontSize.sm, fontWeight: FontWeight.medium, maxWidth: 200 },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardContent: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold },
  cardSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '44' },
  interestText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  addInterestChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.borderLight },
  addInterestText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  badgesRow: { flexDirection: 'row', gap: 10 },
  badge: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  badgeIcon: { fontSize: 24 },
  badgeTitle: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  badgeDesc: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '22', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.lg, paddingVertical: 16, backgroundColor: Colors.error + '11', borderRadius: BorderRadius.md, gap: 8, borderWidth: 1, borderColor: Colors.error + '44' },
  logoutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: Colors.primary, shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary, marginBottom: Spacing.xs, textAlign: 'center' },
  modalDescription: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  progressContainer: { width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: Spacing.md },
  progressLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' },
  progressValue: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: 'bold' },
  lockedContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.warning + '11', padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.warning + '44', marginBottom: Spacing.lg, width: '100%', justifyContent: 'center' },
  lockedText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '600' },
  modalCloseBtn: { width: '100%', paddingVertical: 14, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', marginTop: Spacing.sm },
  modalCloseText: { color: '#fff', fontSize: FontSize.md, fontWeight: 'bold' },
});
