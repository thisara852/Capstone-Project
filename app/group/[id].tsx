import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToCloudinary } from '../../utils/cloudinary';

export default function GroupProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentGroup, getGroupDetails, myGroups, joinGroup, leaveGroup, deleteGroup, updateGroup } = useGroupStore();
  const { user, profile } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await getGroupDetails(id);
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const isMember = myGroups.some(g => g.id === id);
  const isOwner = currentGroup?.createdBy === user?.uid || profile?.role === 'admin';

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to join.');
      return;
    }
    setIsJoining(true);
    try {
      await joinGroup(id, user.uid);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Community', `Are you sure you want to leave ${currentGroup?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        if (!user) return;
        setIsJoining(true);
        try {
          await leaveGroup(id, user.uid);
          router.back();
        } catch (err: any) {
          Alert.alert('Error', err.message);
        } finally {
          setIsJoining(false);
        }
      }}
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Community', 'This action is irreversible. Delete this community?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setIsJoining(true);
        try {
          await deleteGroup(id);
          router.replace('/(tabs)/groups');
        } catch (err: any) {
          Alert.alert('Error', err.message);
          setIsJoining(false);
        }
      }}
    ]);
  };

  const handleShare = async () => {
    if (!currentGroup) return;
    try {
      const inviteLink = `ieeecompconnect://group/${id}`;
      const message = currentGroup.visibility === 'private' 
        ? `You've been invited to a private community: ${currentGroup.name}! Use this exclusive link to join: ${inviteLink}`
        : `Check out ${currentGroup.name} on IEEE CompConnect! Join here: ${inviteLink}`;
        
      await Share.share({
        message,
        url: inviteLink, // iOS uses URL field
        title: `Join ${currentGroup.name}`
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSaveDescription = async () => {
    if (!currentGroup) return;
    setIsUpdating(true);
    try {
      await updateGroup(id, { description: newDesc });
      setIsEditingDesc(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUploadingAvatar(true);
        const newAvatarUrl = await uploadFileToCloudinary(result.assets[0].uri);
        await updateGroup(id, { avatar: newAvatarUrl });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update avatar. ' + error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading || !currentGroup) {
    return (
      <SafeAreaView style={styles.loadingSafe}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity style={styles.menuBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {currentGroup.banner ? (
            <Image source={{ uri: currentGroup.banner }} style={styles.banner} />
          ) : (
            <LinearGradient
              colors={['#1A73E8', '#8b5cf6', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.banner, { opacity: 0.85 }]}
            />
          )}
        </View>

        <View style={styles.content}>
          {/* Avatar & Title */}
          <View style={styles.topSection}>
          <TouchableOpacity 
            style={styles.avatarWrap} 
            activeOpacity={isOwner ? 0.7 : 1}
            onPress={isOwner ? handleChangeAvatar : undefined}
          >
            {isUploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : currentGroup.avatar ? (
              <Image source={{ uri: currentGroup.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{currentGroup.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            {isOwner && (
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.title}>
            {currentGroup.name} {currentGroup.verified && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            {currentGroup.visibility === 'private' && <Ionicons name="lock-closed" size={18} color={Colors.textMuted} style={{marginLeft: 8}} />}
          </Text>
          <Text style={styles.category}>{currentGroup.category} • {currentGroup.type === 'event' ? 'Event Group' : 'Circle'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>{currentGroup.memberCount} Members</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>Est. {format(currentGroup.createdAt, 'MMM yyyy')}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isMember ? (
            <View style={styles.memberActions}>
              <TouchableOpacity 
                style={styles.chatBtn}
                onPress={() => router.push(`/group/${id}/chat`)}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Enter Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.leaveBtnIcon, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }]} 
                onPress={handleShare}
              >
                <Ionicons name="share-social" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveBtnIcon} onPress={handleLeave}>
                <Ionicons name="log-out-outline" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.joinBtn} 
              onPress={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.joinBtnText}>Join Community</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>About</Text>
            {isOwner && !isEditingDesc && (
              <TouchableOpacity onPress={() => {
                setNewDesc(currentGroup.description);
                setIsEditingDesc(true);
              }}>
                <Ionicons name="pencil" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingDesc ? (
            <View style={styles.editDescContainer}>
              <TextInput
                style={styles.descInput}
                multiline
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Write a description for your community..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <View style={styles.editDescActions}>
                <TouchableOpacity 
                  style={[styles.editBtn, styles.editBtnCancel]} 
                  onPress={() => setIsEditingDesc(false)}
                  disabled={isUpdating}
                >
                  <Text style={styles.editBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editBtn, styles.editBtnSave]} 
                  onPress={handleSaveDescription}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.editBtnSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.description}>{currentGroup.description}</Text>
          )}
        </View>
        </View>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  loadingSafe: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  
  bannerContainer: { width: '100%', height: 200, position: 'relative' },
  banner: { width: '100%', height: '100%', position: 'absolute' },
  headerSafe: { 
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md, paddingTop: 10 
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20,
  },
  menuBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 20,
  },

  content: { padding: Spacing.lg },
  
  topSection: { alignItems: 'center', marginTop: -60, marginBottom: Spacing.xl, zIndex: 5 },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.bgDark, padding: 4,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 46 },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  editAvatarBadge: {
    position: 'absolute', right: 0, bottom: 0,
    backgroundColor: Colors.primary, width: 32, height: 32,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.bgDark, zIndex: 20
  },
  
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  category: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginBottom: 12 },
  
  statsRow: { flexDirection: 'row', gap: Spacing.xl },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: Colors.textSecondary, fontSize: FontSize.sm },

  actionContainer: { marginBottom: Spacing.xl },
  joinBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: 'bold' },
  
  memberActions: { flexDirection: 'row', gap: Spacing.md },
  chatBtn: {
    flex: 1, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: BorderRadius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  chatBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: 'bold' },
  leaveBtnIcon: {
    width: 52, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },

  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary },
  description: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24 },
  
  editDescContainer: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  descInput: { color: Colors.textPrimary, fontSize: FontSize.base, minHeight: 80, textAlignVertical: 'top' },
  editDescActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  editBtnCancel: { backgroundColor: 'transparent' },
  editBtnSave: { backgroundColor: Colors.primary },
  editBtnCancelText: { color: Colors.textMuted, fontWeight: '600' },
  editBtnSaveText: { color: '#fff', fontWeight: 'bold' },
});
