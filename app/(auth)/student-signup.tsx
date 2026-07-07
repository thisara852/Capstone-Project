import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { FormInput } from '../../components/forms/FormInput';
import { FormSelect } from '../../components/forms/FormSelect';
import { FormButton } from '../../components/forms/FormButton';
import { useUserStore } from '../../store/userStore';
import { IEEE_BRANCHES, IEEE_TOPICS } from '../../config/api';
import { uploadFileToCloudinary } from '../../utils/cloudinary';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Name is too short').max(50, 'Name is too long').trim(),
  email: z.string().email('Invalid email address').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  branch: z.string().min(1, 'Please select a branch'),
  department: z.string().min(2, 'Department is required').trim(),
  studentId: z.string().min(2, 'Student ID is required').trim(),
  membershipType: z.enum(['Student', 'Graduate', 'Professional']),
});

const step3Schema = z.object({
  bio: z.string().optional(),
  linkedIn: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export default function StudentSignupScreen() {
  const { register, isLoading, error, clearError } = useUserStore();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [])
  );

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    department: '',
    studentId: '',
    membershipType: 'Student' as 'Student' | 'Graduate' | 'Professional',
    bio: '',
    linkedIn: '',
    github: '',
  });

  const [avatar, setAvatar] = useState<{ uri: string } | null>(null);
  const [idDocument, setIdDocument] = useState<{ uri: string, name: string, type: 'image' | 'pdf' } | null>(null);
  const [ieeeProof, setIeeeProof] = useState<{ uri: string, name: string, type: 'image' | 'pdf' } | null>(null);
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const branchOptions = IEEE_BRANCHES.map(b => ({ label: `${b.university} - ${b.name}`, value: b.id }));
  const membershipOptions = [
    { label: 'Student Member', value: 'Student' },
    { label: 'Graduate Student Member', value: 'Graduate' },
    { label: 'Professional Member', value: 'Professional' }
  ];

  const toggleInterest = (topic: string) => {
    setSelectedInterests(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const validateStep = () => {
    setFormErrors({});
    try {
      if (step === 1) step1Schema.parse(formData);
      if (step === 2) step2Schema.parse(formData);
      if (step === 3) {
        step3Schema.parse(formData);
        if (selectedInterests.length === 0) {
          setFormErrors({ interests: 'Please select at least one interest' });
          return false;
        }
      }
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e: any) => {
          if (e.path[0]) errors[e.path[0].toString()] = e.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const pickImage = async (setter: any, aspect?: [number, number]) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !!aspect,
        aspect,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'image.jpg';
        setter({ uri, name, type: 'image' });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async (setter: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        const asset = result.assets[0];
        const type = asset.mimeType?.includes('pdf') ? 'pdf' : 'image';
        setter({ uri: asset.uri, name: asset.name, type });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRegister = async () => {
    if (!validateStep()) return;
    
    clearError();
    setIsUploading(true);

    try {
      const branch = IEEE_BRANCHES.find((b) => b.id === formData.branch);

      // Upload files first if they exist
      let avatarUrl = '';
      let idDocumentUrl = '';
      let ieeeProofUrl = '';

      if (avatar?.uri) {
        avatarUrl = await uploadFileToCloudinary(avatar.uri, false);
      }
      if (idDocument?.uri) {
        idDocumentUrl = await uploadFileToCloudinary(idDocument.uri, idDocument.type === 'pdf');
      }
      if (ieeeProof?.uri) {
        ieeeProofUrl = await uploadFileToCloudinary(ieeeProof.uri, ieeeProof.type === 'pdf');
      }

      const profileData = {
        role: 'student' as const,
        displayName: formData.fullName,
        branch: formData.branch,
        university: branch?.university || '',
        department: formData.department,
        membershipType: formData.membershipType,
        interests: selectedInterests,
        bio: formData.bio || undefined,
        linkedIn: formData.linkedIn || undefined,
        github: formData.github || undefined,
        photoURL: avatarUrl || undefined,
        studentId: formData.studentId,
        verificationDocuments: {
          idDocument: idDocumentUrl || null,
          ieeeProof: ieeeProofUrl || null,
        },
        verified: !!(idDocumentUrl || ieeeProofUrl), // Auto-verify if they provided docs (for now)
      };

      await register(formData.email, formData.password, profileData);

      if (!useUserStore.getState().error) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong');
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.stepIndicatorWrapper}>
          <View style={[styles.stepDot, step >= i && styles.stepDotActive]} />
          {i < 5 && <View style={[styles.stepLine, step > i && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => (step > 1 ? prevStep() : router.back())} style={styles.modalCloseBtn}>
          <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Step {step} of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.mainErrorText}>{error}</Text>
            </View>
          )}

          {/* STEP 1: Basic Account */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Create Account</Text>
              <Text style={styles.stepSubtitle}>Let's start with your basic login credentials.</Text>
              
              <FormInput
                label="Full Name *"
                placeholder="John Doe"
                icon="person-outline"
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                error={formErrors.fullName}
              />
              <FormInput
                label="Email Address *"
                placeholder="you@university.edu"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                error={formErrors.email}
              />
              <FormInput
                label="Password *"
                placeholder="8+ characters"
                icon="lock-closed-outline"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                error={formErrors.password}
              />
              <FormInput
                label="Confirm Password *"
                placeholder="Re-enter password"
                icon="lock-closed-outline"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                error={formErrors.confirmPassword}
              />
            </View>
          )}

          {/* STEP 2: Academic Details */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Academic Details</Text>
              <Text style={styles.stepSubtitle}>Tell us about your university and IEEE membership.</Text>
              
              <FormSelect
                label="IEEE Branch/University *"
                options={branchOptions}
                value={formData.branch}
                onSelect={(val) => setFormData(prev => ({ ...prev, branch: val }))}
                error={formErrors.branch}
                icon="school-outline"
                placeholder="Select your university branch"
              />
              <FormInput
                label="Department/Major *"
                placeholder="e.g. Computer Science"
                icon="book-outline"
                value={formData.department}
                onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                error={formErrors.department}
              />
              <FormInput
                label="Student ID Number *"
                placeholder="e.g. IT21234567"
                icon="id-card-outline"
                value={formData.studentId}
                onChangeText={(text) => setFormData(prev => ({ ...prev, studentId: text }))}
                error={formErrors.studentId}
              />
              <FormSelect
                label="Membership Type *"
                options={membershipOptions}
                value={formData.membershipType}
                onSelect={(val) => setFormData(prev => ({ ...prev, membershipType: val as any }))}
                error={formErrors.membershipType}
                icon="card-outline"
              />
            </View>
          )}

          {/* STEP 3: Profile Setup */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Setup Profile</Text>
              <Text style={styles.stepSubtitle}>Personalize your profile. This helps organizers learn about you.</Text>
              
              <View style={styles.avatarUploadContainer}>
                <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage(setAvatar, [1, 1])}>
                  {avatar?.uri ? (
                    <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={Colors.textMuted} />
                      <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <FormInput
                label="Bio (Optional)"
                placeholder="A short bio about yourself..."
                icon="document-text-outline"
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={3}
              />
              <FormInput
                label="LinkedIn (Optional)"
                placeholder="https://linkedin.com/in/..."
                icon="logo-linkedin"
                value={formData.linkedIn}
                onChangeText={(text) => setFormData(prev => ({ ...prev, linkedIn: text }))}
                error={formErrors.linkedIn}
                autoCapitalize="none"
              />
              <FormInput
                label="GitHub (Optional)"
                placeholder="https://github.com/..."
                icon="logo-github"
                value={formData.github}
                onChangeText={(text) => setFormData(prev => ({ ...prev, github: text }))}
                error={formErrors.github}
                autoCapitalize="none"
              />
              
              <Text style={styles.sectionLabel}>Interests (Select at least 1) *</Text>
              <View style={styles.topicsGrid}>
                {IEEE_TOPICS.map((topic) => {
                  const selected = selectedInterests.includes(topic);
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.topicChip, selected && styles.topicChipActive]}
                      onPress={() => toggleInterest(topic)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.topicText, selected && styles.topicTextActive]}>{topic}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {formErrors.interests && <Text style={styles.fieldErrorText}>{formErrors.interests}</Text>}
            </View>
          )}

          {/* STEP 4: Optional Verification */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Verification (Optional)</Text>
              <Text style={styles.stepSubtitle}>Upload your ID to instantly get verified access to premium events. You can skip this and do it later.</Text>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Student ID Card</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument(setIdDocument)}>
                  <Ionicons name={idDocument ? "document-text" : "cloud-upload-outline"} size={32} color={idDocument ? Colors.primary : Colors.textMuted} />
                  <Text style={styles.uploadBoxText}>
                    {idDocument ? idDocument.name : 'Tap to upload ID (Image or PDF)'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>IEEE Membership Proof</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument(setIeeeProof)}>
                  <Ionicons name={ieeeProof ? "document-text" : "cloud-upload-outline"} size={32} color={ieeeProof ? Colors.primary : Colors.textMuted} />
                  <Text style={styles.uploadBoxText}>
                    {ieeeProof ? ieeeProof.name : 'Tap to upload IEEE Proof'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepSubtitle}>Please review your details before creating your account.</Text>
              
              <View style={styles.reviewCard}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{formData.fullName}</Text>
                
                <Text style={styles.reviewLabel}>Email:</Text>
                <Text style={styles.reviewValue}>{formData.email}</Text>
                
                <Text style={styles.reviewLabel}>University / Branch:</Text>
                <Text style={styles.reviewValue}>{IEEE_BRANCHES.find(b => b.id === formData.branch)?.name}</Text>
                
                <Text style={styles.reviewLabel}>Student ID:</Text>
                <Text style={styles.reviewValue}>{formData.studentId}</Text>
                
                <Text style={styles.reviewLabel}>Documents Uploaded:</Text>
                <Text style={styles.reviewValue}>
                  {idDocument ? '✅ Student ID' : '❌ Student ID'}
                  {'\n'}
                  {ieeeProof ? '✅ IEEE Proof' : '❌ IEEE Proof'}
                </Text>
              </View>
              
              <View style={styles.termsBox}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                <Text style={styles.termsText}>
                  By creating an account, you agree to the IEEE CompConnect Terms of Service and Privacy Policy.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.footerActions}>
            {step < 5 ? (
              <FormButton
                label="Next Step"
                onPress={nextStep}
                icon="arrow-forward"
                style={{ flex: 1 }}
              />
            ) : (
              <FormButton
                label="Create Account"
                onPress={handleRegister}
                isLoading={isLoading || isUploading}
                icon="checkmark-circle"
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgDark,
  },
  modalCloseBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface,
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  
  stepIndicatorContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, backgroundColor: Colors.bgDark,
  },
  stepIndicatorWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary },
  stepLine: { width: 20, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },

  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  stepSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: Spacing.lg,
  },
  mainErrorText: { color: Colors.error, marginLeft: Spacing.sm, flex: 1 },
  
  avatarUploadContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarPicker: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.bgSurface,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center' },
  avatarPlaceholderText: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },

  sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500', marginTop: Spacing.md },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { backgroundColor: Colors.bgSurface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  topicChipActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: Colors.primary },
  topicText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  topicTextActive: { color: Colors.primary, fontWeight: 'bold' },
  fieldErrorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },

  uploadSection: { marginBottom: Spacing.lg },
  uploadLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 8 },
  uploadBox: {
    backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    padding: Spacing.lg, alignItems: 'center', justifyContent: 'center'
  },
  uploadBoxText: { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },

  reviewCard: { backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.xl },
  reviewLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 2 },
  reviewValue: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '500', marginBottom: Spacing.md },

  termsBox: { flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: Spacing.md, borderRadius: BorderRadius.md },
  termsText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  footerActions: { marginTop: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
});
