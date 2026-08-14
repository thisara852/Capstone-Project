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
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { IEEE_BRANCHES } from '../../config/api';

const step1Schema = z.object({
  organizerName: z.string().min(2, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  organizationName: z.string().min(2, 'Organization Name is required').trim(),
  organizationType: z.enum(['Student Branch', 'Chapter', 'Affinity Group', 'Section']),
  ieeeSection: z.string().min(2, 'IEEE Section is required').trim(),
});

const step3Schema = z.object({
  committeePosition: z.string().min(2, 'Position is required').trim(),
  contactNumber: z.string().min(5, 'Contact number is required').trim(),
  organizationDescription: z.string().min(10, 'Description must be at least 10 characters').trim(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export default function OrganizerSignupScreen() {
  const { register, isLoading, error, clearError } = useUserStore();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [])
  );

  const [formData, setFormData] = useState({
    organizerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'Student Branch' as 'Student Branch' | 'Chapter' | 'Affinity Group' | 'Section',
    ieeeSection: '',
    university: '',
    committeePosition: '',
    contactNumber: '',
    organizationDescription: '',
    website: '',
  });

  const [logo, setLogo] = useState<{ uri: string } | null>(null);
  const [appointmentLetter, setAppointmentLetter] = useState<{ uri: string, name: string, type: 'image' | 'pdf' } | null>(null);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const orgTypeOptions = [
    { label: 'Student Branch', value: 'Student Branch' },
    { label: 'Technical Chapter', value: 'Chapter' },
    { label: 'Affinity Group (e.g. WIE)', value: 'Affinity Group' },
    { label: 'IEEE Section', value: 'Section' }
  ];

  const branchOptions = [{ label: 'None / Not Applicable', value: '' }, ...IEEE_BRANCHES.map(b => ({ label: `${b.university} - ${b.name}`, value: b.university }))];

  const validateStep = () => {
    setFormErrors({});
    try {
      if (step === 1) step1Schema.parse(formData);
      if (step === 2) step2Schema.parse(formData);
      if (step === 3) step3Schema.parse(formData);
      if (step === 4) {
        // Validation for step 4 (Files)
        if (!logo) {
          setFormErrors({ docs: 'Organization logo is required.' });
          return false;
        }
        if (!appointmentLetter) {
          setFormErrors({ docs: 'Appointment letter or proof is required for verification.' });
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

  const pickImage = async (setter: any) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setter({ uri });
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
      let logoUrl = '';
      let appointmentLetterUrl = '';

      if (logo?.uri) {
        logoUrl = await uploadFileToCloudinary(logo.uri, false);
      }
      if (appointmentLetter?.uri) {
        appointmentLetterUrl = await uploadFileToCloudinary(appointmentLetter.uri, appointmentLetter.type === 'pdf');
      }

      const profileData = {
        role: 'organizer' as const,
        displayName: formData.organizerName,
        organizationName: formData.organizationName,
        ieeeSection: formData.ieeeSection,
        university: formData.university || undefined,
        organizationDescription: formData.organizationDescription,
        contactNumber: formData.contactNumber,
        website: formData.website || undefined,
        photoURL: logoUrl || undefined,
        verificationDocuments: {
          logo: logoUrl || null,
          appointmentLetter: appointmentLetterUrl || null,
        },
        verificationStatus: 'pending' as const,
        verified: false,
      };

      await register(formData.email, formData.password, profileData);

      if (!useUserStore.getState().error) {
        Alert.alert(
          'Application Submitted',
          'Your organizer account has been created and is pending admin verification. You will have limited access until approved.',
          [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
          ]
        );
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
        <Text style={styles.modalTitle}>Organizer Application</Text>
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

          {/* STEP 1: Account Details */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Account Details</Text>
              <Text style={styles.stepSubtitle}>Create your personal login credentials.</Text>
              
              <FormInput
                label="Your Full Name *"
                placeholder="John Doe"
                icon="person-outline"
                value={formData.organizerName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, organizerName: text }))}
                error={formErrors.organizerName}
              />
              <FormInput
                label="Official Email Address *"
                placeholder="branch@university.edu"
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

          {/* STEP 2: Organization Details */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Organization Details</Text>
              <Text style={styles.stepSubtitle}>Tell us about the IEEE organization you represent.</Text>
              
              <FormInput
                label="Organization/Branch Name *"
                placeholder="e.g. IEEE SLIIT Student Branch"
                icon="business-outline"
                value={formData.organizationName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, organizationName: text }))}
                error={formErrors.organizationName}
              />
              <FormSelect
                label="Organization Type *"
                options={orgTypeOptions}
                value={formData.organizationType}
                onSelect={(val) => setFormData(prev => ({ ...prev, organizationType: val as any }))}
                error={formErrors.organizationType}
                icon="git-branch-outline"
              />
              <FormInput
                label="IEEE Section *"
                placeholder="e.g. IEEE Sri Lanka Section"
                icon="map-outline"
                value={formData.ieeeSection}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ieeeSection: text }))}
                error={formErrors.ieeeSection}
              />
              <FormSelect
                label="University (Optional)"
                options={branchOptions}
                value={formData.university}
                onSelect={(val) => setFormData(prev => ({ ...prev, university: val }))}
                icon="school-outline"
              />
            </View>
          )}

          {/* STEP 3: Role & Committee */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Role & Details</Text>
              <Text style={styles.stepSubtitle}>Provide details about your position and the organization.</Text>
              
              <FormInput
                label="Your Committee Position *"
                placeholder="e.g. Chairperson, Event Coordinator"
                icon="briefcase-outline"
                value={formData.committeePosition}
                onChangeText={(text) => setFormData(prev => ({ ...prev, committeePosition: text }))}
                error={formErrors.committeePosition}
              />
              <FormInput
                label="Contact Number *"
                placeholder="+1 234 567 8900"
                icon="call-outline"
                keyboardType="phone-pad"
                value={formData.contactNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, contactNumber: text }))}
                error={formErrors.contactNumber}
              />
              <FormInput
                label="Organization Description *"
                placeholder="Tell us about your branch/organization..."
                icon="document-text-outline"
                multiline
                numberOfLines={4}
                value={formData.organizationDescription}
                onChangeText={(text) => setFormData(prev => ({ ...prev, organizationDescription: text }))}
                error={formErrors.organizationDescription}
              />
              <FormInput
                label="Website (Optional)"
                placeholder="https://example.com"
                icon="globe-outline"
                keyboardType="url"
                autoCapitalize="none"
                value={formData.website}
                onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
                error={formErrors.website}
              />
            </View>
          )}

          {/* STEP 4: Verification Documents */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Verification</Text>
              <Text style={styles.stepSubtitle}>Official documents are required to approve your organizer status.</Text>

              {formErrors.docs && <Text style={[styles.fieldErrorText, { marginBottom: Spacing.md }]}>{formErrors.docs}</Text>}

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Organization Logo *</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setLogo)}>
                  {logo ? (
                    <Image source={{ uri: logo.uri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
                      <Text style={styles.uploadBoxText}>Tap to upload Logo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Appointment Letter / IEEE Proof *</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument(setAppointmentLetter)}>
                  <Ionicons name={appointmentLetter ? "document-text" : "cloud-upload-outline"} size={32} color={appointmentLetter ? Colors.primary : Colors.textMuted} />
                  <Text style={styles.uploadBoxText}>
                    {appointmentLetter ? appointmentLetter.name : 'Tap to upload PDF or Image'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepSubtitle}>Please review your application before submitting.</Text>
              
              <View style={styles.reviewCard}>
                <Text style={styles.reviewLabel}>Organizer:</Text>
                <Text style={styles.reviewValue}>{formData.organizerName} ({formData.committeePosition})</Text>
                
                <Text style={styles.reviewLabel}>Organization:</Text>
                <Text style={styles.reviewValue}>{formData.organizationName}</Text>
                
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>{formData.organizationType}</Text>
                
                <Text style={styles.reviewLabel}>Documents Provided:</Text>
                <Text style={styles.reviewValue}>✅ Logo & Appointment Letter</Text>
              </View>
              
              <View style={styles.termsBox}>
                <Ionicons name="information-circle" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                <Text style={styles.termsText}>
                  Your application will be manually reviewed by an Admin before you can publish official events.
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
                label="Submit Application"
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
  modalTitle: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textSecondary },
  
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
