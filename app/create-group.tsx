import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/userStore';
import { useGroupStore, GroupType, GroupVisibility } from '../store/groupStore';
import { uploadFileToCloudinary } from '../utils/cloudinary';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { FormButton } from '../components/forms/FormButton';

const CATEGORIES = ['Research', 'Security', 'Robotics', 'Community', 'AI', 'UI/UX', 'Other'];

export default function CreateGroupScreen() {
  const { user, profile } = useUserStore();
  const { createGroup } = useGroupStore();

  const isOrganizer = profile?.role === 'organizer';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [visibility, setVisibility] = useState<GroupVisibility>('public');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  const DURATION_OPTIONS = [
    { label: 'Never', value: 'never' },
    { label: '1 Hour', value: '1h' },
    { label: '1 Day', value: '1d' },
    { label: '1 Week', value: '1w' },
    { label: '30 Days', value: '30d' }
  ];
  const [duration, setDuration] = useState('never');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please provide a name and description.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      let avatarUrl = undefined;
      if (avatarUri) {
        avatarUrl = await uploadFileToCloudinary(avatarUri, false);
      }

      const groupPayload: any = {
        name: name.trim(),
        description: description.trim(),
        category,
        visibility,
        tags: [],
        type: isOrganizer ? 'event' : 'circle', // By default, organizers create official communities
        verified: isOrganizer,
        duration,
      };

      if (duration !== 'never') {
        let ms = 0;
        if (duration === '1h') ms = 60 * 60 * 1000;
        if (duration === '1d') ms = 24 * 60 * 60 * 1000;
        if (duration === '1w') ms = 7 * 24 * 60 * 60 * 1000;
        if (duration === '30d') ms = 30 * 24 * 60 * 60 * 1000;
        groupPayload.expiresAt = Date.now() + ms;
      }

      if (avatarUrl) {
        groupPayload.avatar = avatarUrl;
      }

      const groupId = await createGroup(groupPayload, user.uid);

      router.replace(`/group/${groupId}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOrganizer ? 'Create Community' : 'Create Circle'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar Picker */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarCircle} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera" size={32} color={Colors.textMuted} />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHelper}>Upload Community Icon</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder={isOrganizer ? "e.g., IEEE Robotics Society" : "e.g., Python Study Circle"}
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this community about?"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        {/* Category */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Privacy */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Visibility</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.radioBtn, visibility === 'public' && styles.radioBtnActive]}
              onPress={() => setVisibility('public')}
            >
              <Ionicons name="globe-outline" size={20} color={visibility === 'public' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.radioText, visibility === 'public' && styles.radioTextActive]}>Public</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioBtn, visibility === 'private' && styles.radioBtnActive]}
              onPress={() => setVisibility('private')}
            >
              <Ionicons name="lock-closed-outline" size={20} color={visibility === 'private' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.radioText, visibility === 'private' && styles.radioTextActive]}>Private</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration / Expiration */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Auto Delete After</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {DURATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.catChip, duration === opt.value && styles.catChipActive]}
                onPress={() => setDuration(opt.value)}
              >
                <Text style={[styles.catText, duration === opt.value && styles.catTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.submitWrap}>
          <FormButton
            label={isOrganizer ? "Create Community" : "Create Circle"}
            onPress={handleCreate}
            isLoading={isSubmitting}
            disabled={isSubmitting || !name.trim()}
          />
        </View>

      </ScrollView>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  content: { padding: Spacing.xl },

  avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.bgCard,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.primary,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.bgDark,
  },
  avatarHelper: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 8 },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  catScroll: { gap: 8, paddingRight: 20 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontWeight: '500' },
  catTextActive: { color: '#fff' },

  row: { flexDirection: 'row', gap: Spacing.md },
  radioBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  radioBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  radioText: { color: Colors.textSecondary, fontWeight: '500' },
  radioTextActive: { color: Colors.primary },

  submitWrap: { marginTop: Spacing.xl, marginBottom: 40 },
});
