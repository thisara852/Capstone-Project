import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore, UserProfile } from '../../store/userStore';
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { IEEE_TOPICS } from '../../config/api';

export default function EditProfileScreen() {
  const { user, profile, updateProfile, isLoading } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Common Fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Student Fields
  const [university, setUniversity] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [membershipType, setMembershipType] = useState<'Student' | 'Graduate' | 'Professional'>('Student');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Organizer Fields
  const [organizationName, setOrganizationName] = useState('');
  const [ieeeSection, setIeeeSection] = useState('');

  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin';

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setLinkedIn(profile.linkedIn || '');
      
      if (!isOrganizer) {
        setUniversity(profile.university || '');
        setBranch(profile.branch || '');
        setDepartment(profile.department || '');
        setMembershipType(profile.membershipType || 'Student');
        setSelectedInterests(profile.interests || []);
      } else {
        setOrganizationName(profile.organizationName || '');
        setIeeeSection(profile.ieeeSection || '');
      }
    }
  }, [profile, isOrganizer]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      let finalPhotoURL = profile?.photoURL;

      if (localImageUri) {
        setIsUploadingImage(true);
        finalPhotoURL = await uploadFileToCloudinary(localImageUri);
        setIsUploadingImage(false);
      }

      const updates: Partial<UserProfile> = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        linkedIn: linkedIn.trim(),
        photoURL: finalPhotoURL,
      };

      if (!isOrganizer) {
        updates.university = university.trim();
        updates.branch = branch.trim();
        updates.department = department.trim();
        updates.membershipType = membershipType;
        updates.interests = selectedInterests;
      } else {
        updates.organizationName = organizationName.trim();
        updates.ieeeSection = ieeeSection.trim();
      }

      await updateProfile(updates);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }}
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentAvatar = localImageUri || profile?.photoURL;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
            style={styles.headerBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            {isUploadingImage && <Text style={styles.uploadingText}>Uploading image...</Text>}
          </View>

          {/* Common Fields */}
          <View style={styles.section}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your Name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>LinkedIn URL</Text>
            <TextInput
              style={styles.input}
              value={linkedIn}
              onChangeText={setLinkedIn}
              placeholder="https://linkedin.com/in/..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Role-Specific Fields */}
          {!isOrganizer ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Academic Details</Text>
              
              <Text style={styles.label}>University</Text>
              <TextInput
                style={styles.input}
                value={university}
                onChangeText={setUniversity}
                placeholder="e.g. SLIIT"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Student Branch</Text>
              <TextInput
                style={styles.input}
                value={branch}
                onChangeText={setBranch}
                placeholder="e.g. SLIIT Student Branch"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g. Software Engineering"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Membership Type</Text>
              <View style={styles.segmentedControl}>
                {['Student', 'Graduate', 'Professional'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.segmentBtn, membershipType === type && styles.segmentBtnActive]}
                    onPress={() => setMembershipType(type as any)}
                  >
                    <Text style={[styles.segmentText, membershipType === type && styles.segmentTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.tagsContainer}>
                {IEEE_TOPICS.map((topic) => {
                  const isSelected = selectedInterests.includes(topic);
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.tag, isSelected && styles.tagActive]}
                      onPress={() => toggleInterest(topic)}
                    >
                      <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organization Details</Text>
              
              <Text style={styles.label}>Organization / Chapter Name</Text>
              <TextInput
                style={styles.input}
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="e.g. IEEE Computer Society"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>IEEE Section (Optional)</Text>
              <TextInput
                style={styles.input}
                value={ieeeSection}
                onChangeText={setIeeeSection}
                placeholder="e.g. Sri Lanka Section"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  headerBtn: {
    padding: Spacing.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  saveText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.bgDark,
  },
  uploadingText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary + '22',
  },
  segmentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  tagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  tagTextActive: {
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
});
