import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { IEEE_TOPICS } from '../../config/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { format } from 'date-fns';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useUserStore();
  const { myCompetitions, updateCompetition, isLoading } = useCompetitionStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [eventDate, setEventDate] = useState(new Date());
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  const [regStartDate, setRegStartDate] = useState(new Date());
  const [showRegStartDatePicker, setShowRegStartDatePicker] = useState(false);

  const [regEndDate, setRegEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); 
  const [showRegEndDatePicker, setShowRegEndDatePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [participantLimit, setParticipantLimit] = useState('');
  const [rules, setRules] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [eventStatus, setEventStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');

  const EVENT_CATEGORIES = ['Hackathon', 'Coding Challenge', 'Workshop', 'Seminar', 'Conference', 'Other'];
  const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  useEffect(() => {
    const event = myCompetitions.find(c => c.id === id);
    if (event) {
      setTitle(event.title || '');
      setDescription(event.content || '');
      setLocation(event.eventLocation || '');
      setImageUrl(event.imageUrl || '');
      if (event.eventDate) {
        setEventDate(new Date(event.eventDate));
      }
      if (event.registrationStartDate) {
        setRegStartDate(new Date(event.registrationStartDate));
      }
      if (event.registrationEndDate) {
        setRegEndDate(new Date(event.registrationEndDate));
      }
      setSelectedTags(event.tags || []);
      setParticipantLimit(event.participantLimit ? event.participantLimit.toString() : '');
      setRules(event.rules || '');
      setCategory(event.category || 'Hackathon');
      setEventStatus(event.eventStatus || 'upcoming');
    } else if (myCompetitions.length > 0 && !isLoading) {
      Alert.alert('Error', 'Event not found');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(organizer)/dashboard');
      }
    }
  }, [id, myCompetitions]);

  if (profile?.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.warning} />
          <Text style={styles.lockedTitle}>Account Pending</Text>
          <Text style={styles.lockedText}>
            You must be a verified organizer to edit competitions. Please wait for an admin to review and approve your account.
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

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Title, Description, Date, Location).');
      return;
    }

    if (regEndDate.getTime() < regStartDate.getTime()) {
      Alert.alert('Invalid Dates', 'Registration End Date must be after the Start Date.');
      return;
    }

    setIsUploadingImage(true);
    let finalImageUrl = imageUrl.trim();

    try {
      if (localImageUri) {
        try {
          finalImageUrl = await uploadFileToCloudinary(localImageUri);
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.message || 'Failed to upload image to Cloudinary.');
          setIsUploadingImage(false);
          return;
        }
      }

      await updateCompetition(id as string, {
        title: title.trim(),
        content: description.trim(),
        eventLocation: location.trim(),
        imageUrl: finalImageUrl || undefined,
        tags: selectedTags,
        eventDate: eventDate.getTime(),
        registrationStartDate: regStartDate.getTime(),
        registrationEndDate: regEndDate.getTime(),
        participantLimit: participantLimit ? parseInt(participantLimit, 10) : undefined,
        rules: rules.trim() || undefined,
        category,
        eventStatus
      });
    
    Alert.alert('Success', 'Competition updated successfully!', [
      { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(organizer)/dashboard');
          }
        }}
    ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update event.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImageUri(result.assets[0].uri);
      setImageUrl('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {/* Modal Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(organizer)/dashboard');
          }}
          style={styles.modalCloseBtn}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Edit Event</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.label}>Competition Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., IEEE Xtreme 24.0"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          editable={!isLoading}
        />

        <Text style={styles.label}>Event Status *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {EVENT_STATUSES.map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.topicChip, eventStatus === status && styles.topicChipActive]}
                onPress={() => setEventStatus(status as any)}
              >
                <Text style={[styles.topicText, { textTransform: 'capitalize' }, eventStatus === status && styles.topicTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Event Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {EVENT_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.topicChip, category === cat && styles.topicChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.topicText, category === cat && styles.topicTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Event Date *</Text>
            <TouchableOpacity 
              style={styles.datePickerBtn} 
              onPress={() => setShowEventDatePicker(true)}
              disabled={isLoading}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.datePickerText}>{format(eventDate, 'MMM dd, yyyy')}</Text>
            </TouchableOpacity>
            {showEventDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEventDatePicker(false);
                  if (selectedDate) setEventDate(selectedDate);
                }}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SLIIT Campus"
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Reg. Start Date *</Text>
            <TouchableOpacity 
              style={styles.datePickerBtn} 
              onPress={() => setShowRegStartDatePicker(true)}
              disabled={isLoading}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.datePickerText}>{format(regStartDate, 'MMM dd, yyyy')}</Text>
            </TouchableOpacity>
            {showRegStartDatePicker && (
              <DateTimePicker
                value={regStartDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowRegStartDatePicker(false);
                  if (selectedDate) setRegStartDate(selectedDate);
                }}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Reg. End Date *</Text>
            <TouchableOpacity 
              style={styles.datePickerBtn} 
              onPress={() => setShowRegEndDatePicker(true)}
              disabled={isLoading}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.datePickerText}>{format(regEndDate, 'MMM dd, yyyy')}</Text>
            </TouchableOpacity>
            {showRegEndDatePicker && (
              <DateTimePicker
                value={regEndDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowRegEndDatePicker(false);
                  if (selectedDate) setRegEndDate(selectedDate);
                }}
              />
            )}
          </View>
        </View>

        <Text style={[styles.label, { marginTop: Spacing.lg }]}>Banner Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={isLoading || isUploadingImage}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Tap to select an image from gallery</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.label, { marginTop: Spacing.sm }]}>Or paste a Web URL instead:</Text>
        <TextInput
          style={styles.input}
          placeholder="https://images.unsplash.com/..."
          placeholderTextColor={Colors.textMuted}
          value={imageUrl}
          onChangeText={(text) => {
            setImageUrl(text);
            if (text) setLocalImageUri(null);
          }}
          editable={!isLoading && !isUploadingImage}
        />

        <Text style={styles.label}>Participant Limit (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 100"
          placeholderTextColor={Colors.textMuted}
          value={participantLimit}
          onChangeText={setParticipantLimit}
          keyboardType="numeric"
          editable={!isLoading}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the competition, dates, and prizes..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isLoading}
        />

        <Text style={styles.label}>Rules & Requirements (Optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          placeholder="e.g., Must be an undergraduate student. Max 3 members per team."
          placeholderTextColor={Colors.textMuted}
          value={rules}
          onChangeText={setRules}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isLoading}
        />

        <Text style={styles.label}>Tags (Select at least 1) *</Text>
        <View style={styles.topicsGrid}>
          {IEEE_TOPICS.map((topic) => {
            const selected = selectedTags.includes(topic);
            return (
              <TouchableOpacity
                key={topic}
                style={[styles.topicChip, selected && styles.topicChipActive]}
                onPress={() => toggleTag(topic)}
              >
                <Text style={[styles.topicText, selected && styles.topicTextActive]}>{topic}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (isLoading || isUploadingImage) && styles.submitButtonDisabled]} 
          onPress={handleUpdate}
          disabled={isLoading || isUploadingImage}
        >
          {isLoading || isUploadingImage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={Colors.textPrimary} />
              <Text style={styles.submitButtonText}>{isUploadingImage ? 'Uploading Image...' : 'Updating Event...'}</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Update Competition</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  lockedTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  lockedText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.bgSurface,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  datePickerText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  textArea: {
    minHeight: 120,
  },
  topicsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    marginBottom: Spacing.xl,
  },
  topicChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: BorderRadius.full, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    backgroundColor: Colors.bgSurface 
  },
  topicChipActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  topicText: { 
    color: Colors.textSecondary, 
    fontSize: FontSize.sm, 
    fontWeight: FontWeight.medium 
  },
  topicTextActive: { 
    color: '#fff' 
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  imagePicker: {
    height: 160,
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  imagePlaceholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
