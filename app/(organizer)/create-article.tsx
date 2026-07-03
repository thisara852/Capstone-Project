import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useFeedStore } from '../../store/feedStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { IEEE_TOPICS } from '../../config/api';

export default function CreateArticleScreen() {
  const { profile, user } = useUserStore();
  const { createPost } = useFeedStore();
  
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Enforce Verification Lock
  if (profile?.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.warning} />
          <Text style={styles.lockedTitle}>Account Pending</Text>
          <Text style={styles.lockedText}>
            You must be a verified organizer to publish articles. Please wait for an admin to review and approve your account.
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(organizer)/dashboard');
              }
            }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !summary.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Title, Summary, and Content are required to publish an article.');
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('Tags Required', 'Please select at least one tag for your article.');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800'; // Default placeholder

    try {
      if (localImageUri) {
        finalImageUrl = await uploadFileToCloudinary(localImageUri);
      }

      const wordCount = content.trim().split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute average

      await createPost({
        title,
        summary,
        content,
        imageUrl: finalImageUrl,
        author: profile.displayName || profile.organizationName || 'Organizer',
        authorId: user?.uid || 'unknown',
        branch: profile.branch || 'all',
        tags: selectedTags,
        likes: [],
        comments: 0,
        createdAt: Date.now(),
        type: 'article',
        readTime,
        published: true,
        status: 'pending',
      });

      Alert.alert('Success', 'Your article has been submitted for admin approval!', [
        { text: 'OK', onPress: () => router.replace('/(organizer)/dashboard') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to publish article.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(organizer)/dashboard'); }} style={{ marginBottom: Spacing.sm }}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Publish Article</Text>
            <Text style={styles.headerSubtitle}>Share knowledge, tutorials, or research with the IEEE community.</Text>
          </View>

          {/* Cover Image Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Cover Image</Text>
            <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage} activeOpacity={0.8}>
              {localImageUri ? (
                <Image source={{ uri: localImageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imageUploadPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.imageUploadText}>Tap to upload a 16:9 cover image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.label}>Article Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., The Future of Quantum Computing"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Summary / Excerpt</Text>
            <TextInput
              style={[styles.input, styles.textArea, { minHeight: 80 }]}
              placeholder="A brief 1-2 sentence overview of your article..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={summary}
              onChangeText={setSummary}
            />
          </View>

          {/* Article Body */}
          <View style={styles.section}>
            <Text style={styles.label}>Article Content</Text>
            <TextInput
              style={[styles.input, styles.textArea, { minHeight: 250, textAlignVertical: 'top' }]}
              placeholder="Write your full article here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={content}
              onChangeText={setContent}
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.label}>Tags (Select up to 3)</Text>
            <View style={styles.tagsContainer}>
              {IEEE_TOPICS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag) && styles.tagChipSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.publishBtn, isUploading && styles.publishBtnDisabled]} 
              onPress={handlePublish}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.publishBtnText}>Publish Article</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageUploadBtn: {
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    height: 200,
  },
  imageUploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  imageUploadText: {
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: Colors.primary,
  },
  footer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  publishBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  lockedTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  lockedText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
