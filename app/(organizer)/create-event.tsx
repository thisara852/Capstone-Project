import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { IEEE_TOPICS } from '../../config/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { format } from 'date-fns';

export default function CreateEventScreen() {
  const { profile } = useUserStore();
  const { createCompetition, isLoading } = useCompetitionStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  
  const [eventDate, setEventDate] = useState(new Date());
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  const [regStartDate, setRegStartDate] = useState(new Date());
  const [showRegStartDatePicker, setShowRegStartDatePicker] = useState(false);

  const [regEndDate, setRegEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 7 days from now
  const [showRegEndDatePicker, setShowRegEndDatePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [participantLimit, setParticipantLimit] = useState('');
  const [rules, setRules] = useState('');
  const [category, setCategory] = useState('Hackathon');

  // Registration Config
  const [requiresStudentId, setRequiresStudentId] = useState(false);
  const [requiresResume, setRequiresResume] = useState(false);
  const [requiresIeeeProof, setRequiresIeeeProof] = useState(false);
  const [customQuestionsInput, setCustomQuestionsInput] = useState('');
  const [isTeamEvent, setIsTeamEvent] = useState(false);
  const [maxTeamSize, setMaxTeamSize] = useState('');

  const EVENT_CATEGORIES = ['Hackathon', 'Coding Challenge', 'Workshop', 'Seminar', 'Conference', 'Other'];

  // Enforce Verification Lock
  if (profile?.verificationStatus !== 'verified') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.warning} />
          <Text style={styles.lockedTitle}>Account Pending</Text>
          <Text style={styles.lockedText}>
            You must be a verified organizer to create competitions. Please wait for an admin to review and approve your account.
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

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Title, Description, Date, Location).');
      return;
    }

    if (regEndDate.getTime() < regStartDate.getTime()) {
      Alert.alert('Invalid Dates', 'Registration End Date must be after the Start Date.');
      return;
    }

    setIsUploadingImage(true);
    setIsUploadingPdf(true);
    let finalImageUrl = imageUrl.trim();
    let finalPdfUrl = '';

    try {
      // If user selected a local image, upload to Cloudinary first
      if (localImageUri) {
        try {
          finalImageUrl = await uploadFileToCloudinary(localImageUri);
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.message || 'Failed to upload image to Cloudinary. Ensure your keys are set.');
          setIsUploadingImage(false);
          setIsUploadingPdf(false);
          return;
        }
      }

      if (localPdfUri) {
        try {
          finalPdfUrl = await uploadFileToCloudinary(localPdfUri, true);
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.message || 'Failed to upload PDF to Cloudinary.');
          setIsUploadingImage(false);
          setIsUploadingPdf(false);
          return;
        }
      }

      await createCompetition({
        title: title.trim(),
        content: description.trim(),
        eventLocation: location.trim(),
        imageUrl: finalImageUrl || undefined,
        pdfUrl: finalPdfUrl || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        tags: selectedTags,
        eventDate: eventDate.getTime(),
        registrationStartDate: regStartDate.getTime(),
        registrationEndDate: regEndDate.getTime(),
        participantLimit: participantLimit ? parseInt(participantLimit, 10) : undefined,
        rules: rules.trim() || undefined,
        category: category || undefined,
        eventStatus: 'upcoming',
        registrationConfig: {
          requiresStudentId,
          requiresResume,
          requiresIeeeProof,
          customQuestions: customQuestionsInput.split(',').map(q => q.trim()).filter(Boolean),
          isTeamEvent,
          maxTeamSize: isTeamEvent && maxTeamSize ? parseInt(maxTeamSize, 10) : undefined,
        }
      });
      
      Alert.alert('Success', 'Competition submitted for admin review!', [
        { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(organizer)/dashboard');
          }
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save event. Please check your permissions.');
    } finally {
      setIsUploadingImage(false);
      setIsUploadingPdf(false);
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
      setImageUrl(''); // Clear manual URL if they pick a file
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalPdfUri(result.assets[0].uri);
        setPdfName(result.assets[0].name);
      }
    } catch (err) {
      console.error('Error picking document:', err);
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
        <Text style={styles.modalTitle}>Create Event</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            New competitions will be marked as "Pending" and must be approved by an Admin before they appear to students.
          </Text>
        </View>

        <Text style={styles.label}>Competition Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., IEEE Xtreme 24.0"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          editable={!isLoading}
        />

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
        
        <Text style={[styles.label, { marginTop: Spacing.sm }]}>Or paste an Image Web URL instead:</Text>
        <TextInput
          style={styles.input}
          placeholder="https://images.unsplash.com/..."
          placeholderTextColor={Colors.textMuted}
          value={imageUrl}
          onChangeText={(text) => {
            setImageUrl(text);
            if (text) setLocalImageUri(null); // Clear local selection if they type a URL
          }}
          editable={!isLoading && !isUploadingImage}
        />

        <Text style={styles.label}>External Website Link (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., https://my-event.com"
          placeholderTextColor={Colors.textMuted}
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          editable={!isLoading}
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

        <Text style={styles.label}>Guidelines / Rulebook PDF (Optional)</Text>
        <TouchableOpacity style={styles.pdfPicker} onPress={pickPdf} disabled={isLoading || isUploadingPdf}>
          <Ionicons name="document-text-outline" size={24} color={localPdfUri ? Colors.success : Colors.textMuted} />
          <Text style={[styles.pdfPickerText, localPdfUri && { color: Colors.success, fontWeight: 'bold' }]}>
            {localPdfUri ? pdfName : 'Tap to upload a PDF rulebook'}
          </Text>
          {localPdfUri && (
            <TouchableOpacity onPress={() => { setLocalPdfUri(null); setPdfName(''); }}>
              <Ionicons name="close-circle" size={20} color={Colors.error} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

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

        {/* Dynamic Registration Configuration */}
        <Text style={[styles.label, { marginTop: Spacing.lg, fontSize: FontSize.md, fontWeight: 'bold' }]}>Registration Requirements</Text>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, marginLeft: 4 }}>
          Select what participants must provide when registering.
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Require Student ID (Image/PDF)</Text>
          <Switch value={requiresStudentId} onValueChange={setRequiresStudentId} trackColor={{ true: Colors.primary, false: Colors.border }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Require Resume/CV (PDF)</Text>
          <Switch value={requiresResume} onValueChange={setRequiresResume} trackColor={{ true: Colors.primary, false: Colors.border }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Require IEEE Membership Proof</Text>
          <Switch value={requiresIeeeProof} onValueChange={setRequiresIeeeProof} trackColor={{ true: Colors.primary, false: Colors.border }} />
        </View>

        <Text style={[styles.label, { marginTop: Spacing.md }]}>Custom Questions (Comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Dietary requirements, T-Shirt size"
          placeholderTextColor={Colors.textMuted}
          value={customQuestionsInput}
          onChangeText={setCustomQuestionsInput}
          editable={!isLoading}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Is this a Team Event?</Text>
          <Switch value={isTeamEvent} onValueChange={setIsTeamEvent} trackColor={{ true: Colors.primary, false: Colors.border }} />
        </View>

        {isTeamEvent && (
          <>
            <Text style={[styles.label, { marginTop: Spacing.sm }]}>Maximum Team Size *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 4"
              placeholderTextColor={Colors.textMuted}
              value={maxTeamSize}
              onChangeText={setMaxTeamSize}
              keyboardType="numeric"
              editable={!isLoading}
            />
          </>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, (isLoading || isUploadingImage || isUploadingPdf) && styles.submitButtonDisabled]} 
          onPress={handleCreate}
          disabled={isLoading || isUploadingImage || isUploadingPdf}
        >
          {isLoading || isUploadingImage || isUploadingPdf ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={Colors.textPrimary} />
              <Text style={styles.submitButtonText}>{isUploadingImage ? 'Uploading Image...' : isUploadingPdf ? 'Uploading PDF...' : 'Saving Event...'}</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Competition</Text>
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '11',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    color: Colors.primary,
    fontSize: FontSize.sm,
    lineHeight: 20,
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
    color: '#FFFFFF',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgSurface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  pdfPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  pdfPickerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
