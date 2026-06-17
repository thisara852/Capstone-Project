import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormButton } from './FormButton';
import { useUserStore } from '../../store/userStore';
import { useRegistrationStore } from '../../store/registrationStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadFileToCloudinary } from '../../utils/cloudinary';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name is required').trim(),
  studentId: z.string().min(2, 'Student ID is required').trim(),
  university: z.string().min(2, 'Campus/University is required').trim(),
  department: z.string().min(2, 'Department is required').trim(),
  phoneNumber: z.string().min(5, 'Phone number is required').trim(),
});

interface EventRegistrationFormProps {
  eventId: string;
  isTeamEvent?: boolean;
  registrationConfig?: {
    requiresStudentId?: boolean;
    requiresResume?: boolean;
    requiresIeeeProof?: boolean;
    customQuestions?: string[];
    isTeamEvent?: boolean;
    maxTeamSize?: number;
  };
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({ 
  eventId, 
  isTeamEvent = false,
  registrationConfig,
  visible,
  onClose,
  onSuccess
}) => {
  const { profile, updateProfile } = useUserStore();
  const { registerForEvent, isLoading } = useRegistrationStore();

  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile?.displayName || '',
    studentId: profile?.studentId || '',
    university: profile?.university || '',
    department: profile?.department || '',
    phoneNumber: profile?.phoneNumber || '',
  });

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  
  // Team Feature state
  const isTeamEventConfig = registrationConfig?.isTeamEvent || isTeamEvent;
  const maxTeamSize = registrationConfig?.maxTeamSize || 1;
  const hasTeamDetails = isTeamEventConfig && maxTeamSize > 1;
  const numAdditionalMembers = hasTeamDetails ? maxTeamSize - 1 : 0;

  const [teamName, setTeamName] = useState('');
  const [teamMemberEmails, setTeamMemberEmails] = useState<string[]>([]);

  useEffect(() => {
    if (numAdditionalMembers > 0 && teamMemberEmails.length !== numAdditionalMembers) {
      setTeamMemberEmails(Array(numAdditionalMembers).fill(''));
    }
  }, [numAdditionalMembers]);
  
  const [resume, setResume] = useState<{ uri: string, name: string, type: string } | null>(null);
  const [studentIdCard, setStudentIdCard] = useState<{ uri: string, name: string, type: string } | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.displayName || prev.fullName,
        university: profile.university || prev.university,
        department: profile.department || prev.department,
        phoneNumber: profile.phoneNumber || prev.phoneNumber,
        studentId: profile.studentId || prev.studentId,
      }));
    }
  }, [visible, profile]);

  const activeSteps = ['personal'];
  if (hasTeamDetails) activeSteps.push('team');
  if (registrationConfig?.customQuestions && registrationConfig.customQuestions.length > 0) activeSteps.push('questions');
  
  const needsStudentId = !profile?.verificationDocuments?.idDocument;
  const hasDocuments = needsStudentId || registrationConfig?.requiresResume;
  if (hasDocuments) activeSteps.push('documents');
  
  activeSteps.push('review');

  const currentStepId = activeSteps[step - 1];
  const totalSteps = activeSteps.length;

  const validateCurrentStep = () => {
    setFormErrors({});
    try {
      if (currentStepId === 'personal') {
        registrationSchema.parse(formData);
      } else if (currentStepId === 'team') {
        let isValid = true;
        const errors: Record<string, string> = {};
        if (!teamName.trim()) {
          errors.teamName = 'Team name is required';
          isValid = false;
        }
        // Emails are optional, but if provided they should be validish
        teamMemberEmails.forEach((email, idx) => {
          if (email.trim() && !email.includes('@')) {
            errors[`member_${idx}`] = 'Invalid email address';
            isValid = false;
          }
        });
        if (!isValid) {
          setFormErrors(errors);
          return false;
        }
      } else if (currentStepId === 'questions' && registrationConfig?.customQuestions) {
        let isValid = true;
        const errors: Record<string, string> = {};
        registrationConfig.customQuestions.forEach(q => {
          if (!customAnswers[q] || customAnswers[q].trim().length === 0) {
            errors[q] = 'This field is required';
            isValid = false;
          }
        });
        if (!isValid) {
          setFormErrors(errors);
          return false;
        }
      } else if (currentStepId === 'documents') {
        let isValid = true;
        const errors: Record<string, string> = {};
        
        if (needsStudentId && !studentIdCard) {
          errors.studentId = 'Student ID document is required.';
          isValid = false;
        }
        if (registrationConfig?.requiresResume && !resume) {
          errors.resume = 'Resume is required.';
          isValid = false;
        }
        if (!isValid) {
          setFormErrors(errors);
          return false;
        }
      }
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((e: any) => {
          if (e.path[0]) {
            errors[e.path[0].toString()] = e.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => prev + 1);
    }
  };
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const pickDocument = async (setter: any, allowPdfOnly?: boolean) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowPdfOnly ? ['application/pdf'] : ['application/pdf', 'image/*'],
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

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsUploading(true);
    setFormErrors({});
    
    try {
      let uploadedFiles: Record<string, any> = {};

      if (studentIdCard?.uri) {
        const url = await uploadFileToCloudinary(studentIdCard.uri, studentIdCard.type === 'pdf');
        uploadedFiles.studentIdCard = {
          url,
          type: studentIdCard.type
        };
        // Update profile so they don't have to upload it again
        if (!profile?.verificationDocuments?.idDocument) {
          await updateProfile({
            verificationDocuments: {
              ...profile?.verificationDocuments,
              idDocument: url,
            }
          });
        }
      }
      if (resume?.uri) {
        uploadedFiles.resume = {
          url: await uploadFileToCloudinary(resume.uri, true),
          type: resume.type
        };
      }

      const registrationDataPayload: any = {
        eventId,
        userId: profile?.uid || '',
        ...formData,
        teamName: hasTeamDetails ? teamName : undefined,
        teamMemberEmails: hasTeamDetails ? teamMemberEmails.filter(e => e.trim().length > 0) : undefined,
        registrationData: customAnswers,
        registrationStatus: 'pending' as const, // Always pending by default
      };

      if (Object.keys(uploadedFiles).length > 0) {
        registrationDataPayload.uploadedFiles = uploadedFiles;
      }

      await registerForEvent(eventId, registrationDataPayload);
      
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit registration. Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <Text style={styles.stepIndicatorText}>
        Step {step} of {totalSteps}
      </Text>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          {!isSuccess && (
            <TouchableOpacity onPress={() => step > 1 ? prevStep() : onClose()} style={styles.modalCloseBtn}>
              <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          {isSuccess && <View style={{ width: 40 }} />}
          <View>
            <Text style={styles.modalTitle}>{isSuccess ? 'Success' : 'Event Registration'}</Text>
            {!isSuccess && renderStepIndicator()}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={isSuccess ? styles.successContainer : styles.container}>
          
          {/* SUCCESS VIEW */}
          {isSuccess && (
            <View style={styles.successView}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Registration Submitted!</Text>
              <Text style={styles.successMessage}>
                Your application has been securely sent to the organizers. You will be notified once it is reviewed.
              </Text>
              <FormButton 
                label="Awesome" 
                onPress={() => {
                  setIsSuccess(false);
                  onClose();
                  onSuccess?.();
                }} 
                style={styles.successBtn}
              />
            </View>
          )}

          {/* STEP 1: Personal Details */}
          {!isSuccess && currentStepId === 'personal' && (
            <View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Please confirm your personal details for this event.
                </Text>
              </View>

              <FormInput label="Full Name *" value={formData.fullName} onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))} error={formErrors.fullName} icon="person-outline" />
              <FormInput label="Student ID *" value={formData.studentId} onChangeText={(text) => setFormData(prev => ({ ...prev, studentId: text }))} error={formErrors.studentId} icon="id-card-outline" />
              <FormInput label="Campus / University *" value={formData.university} onChangeText={(text) => setFormData(prev => ({ ...prev, university: text }))} error={formErrors.university} icon="school-outline" />
              <FormInput label="Department *" value={formData.department} onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))} error={formErrors.department} icon="book-outline" />
              <FormInput label="Phone Number *" value={formData.phoneNumber} onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))} error={formErrors.phoneNumber} icon="call-outline" keyboardType="phone-pad" />
            </View>
          )}

          {/* TEAM DETAILS */}
          {!isSuccess && currentStepId === 'team' && (
            <View>
              <Text style={styles.stepTitle}>Team Details</Text>
              <Text style={styles.stepSubtitle}>Register up to {maxTeamSize} members.</Text>
              
              <FormInput 
                label="Team Name *" 
                value={teamName} 
                onChangeText={setTeamName} 
                error={formErrors.teamName} 
                icon="people-outline" 
              />
              
              <Text style={[styles.stepSubtitle, { marginTop: Spacing.md }]}>Add Teammates (Enter their exact account email)</Text>
              {teamMemberEmails.map((email, idx) => (
                <FormInput
                  key={idx}
                  label={`Member ${idx + 2} Email`}
                  placeholder="e.g., friend@example.com"
                  value={email}
                  onChangeText={(text) => {
                    const newEmails = [...teamMemberEmails];
                    newEmails[idx] = text;
                    setTeamMemberEmails(newEmails);
                  }}
                  error={formErrors[`member_${idx}`]}
                  icon="mail-outline"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              ))}
            </View>
          )}

          {/* CUSTOM QUESTIONS */}
          {!isSuccess && currentStepId === 'questions' && (
            <View>
              <Text style={styles.stepTitle}>Additional Questions</Text>
              <Text style={styles.stepSubtitle}>The organizer requires the following information.</Text>
              
              {registrationConfig!.customQuestions!.map((question, index) => (
                <FormInput
                  key={index}
                  label={`${question} *`}
                  value={customAnswers[question] || ''}
                  onChangeText={(text) => setCustomAnswers(prev => ({ ...prev, [question]: text }))}
                  error={formErrors[question]}
                  multiline
                  numberOfLines={2}
                />
              ))}
            </View>
          )}

          {/* DOCUMENTS */}
          {!isSuccess && currentStepId === 'documents' && (
            <View>
              <Text style={styles.stepTitle}>Verification Documents</Text>
              <Text style={styles.stepSubtitle}>Please upload the required files to proceed.</Text>

              {needsStudentId && (
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Student ID (Image/PDF) *</Text>
                  {formErrors.studentId && <Text style={styles.fieldErrorText}>{formErrors.studentId}</Text>}
                  <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument(setStudentIdCard)}>
                    <Ionicons name={studentIdCard ? "document-text" : "cloud-upload-outline"} size={32} color={studentIdCard ? Colors.primary : Colors.textMuted} />
                    <Text style={styles.uploadBoxText}>{studentIdCard ? studentIdCard.name : 'Tap to upload ID'}</Text>
                  </TouchableOpacity>
                  <Text style={{color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4}}>
                    Since you didn't upload this during sign-up, it is required now.
                  </Text>
                </View>
              )}

              {registrationConfig?.requiresResume && (
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Resume / CV (PDF Only) *</Text>
                  {formErrors.resume && <Text style={styles.fieldErrorText}>{formErrors.resume}</Text>}
                  <TouchableOpacity style={styles.uploadBox} onPress={() => pickDocument(setResume, true)}>
                    <Ionicons name={resume ? "document-text" : "cloud-upload-outline"} size={32} color={resume ? Colors.primary : Colors.textMuted} />
                    <Text style={styles.uploadBoxText}>{resume ? resume.name : 'Tap to upload Resume'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* REVIEW */}
          {!isSuccess && currentStepId === 'review' && (
            <View>
              <Text style={styles.stepTitle}>Review Registration</Text>
              <Text style={styles.stepSubtitle}>Ensure all details are correct before submitting.</Text>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewLabel}>Participant:</Text>
                <Text style={styles.reviewValue}>{formData.fullName} ({formData.studentId})</Text>
                <Text style={styles.reviewLabel}>University:</Text>
                <Text style={styles.reviewValue}>{formData.university}</Text>
                {hasTeamDetails && (
                  <>
                    <Text style={styles.reviewLabel}>Team Name:</Text>
                    <Text style={styles.reviewValue}>{teamName}</Text>
                    <Text style={styles.reviewLabel}>Team Members:</Text>
                    <Text style={styles.reviewValue}>{teamMemberEmails.filter(e => e.trim().length > 0).join(', ') || 'None added'}</Text>
                  </>
                )}
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Your documents are securely stored and will only be accessible by the event organizers.
                </Text>
              </View>
            </View>
          )}

          {!isSuccess && (
            <View style={styles.footerActions}>
              {currentStepId === 'review' ? (
                <FormButton
                  label="Submit Registration"
                  onPress={handleSubmit}
                  isLoading={isLoading || isUploading}
                  icon="checkmark-circle-outline"
                  style={{ flex: 1 }}
                />
              ) : (
                <FormButton
                  label="Continue"
                  onPress={nextStep}
                  icon="arrow-forward"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
  modalTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center' },
  stepIndicatorText: { color: Colors.primary, fontSize: FontSize.xs, textAlign: 'center', marginTop: 2, fontWeight: '600' },
  
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  
  stepTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  stepSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },

  infoBox: {
    flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: Spacing.xl, alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: Colors.primary, fontSize: FontSize.sm, marginLeft: Spacing.sm, lineHeight: 20 },

  uploadSection: { marginBottom: Spacing.lg },
  uploadLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 8 },
  uploadBox: {
    backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    padding: Spacing.lg, alignItems: 'center', justifyContent: 'center'
  },
  uploadBoxText: { color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  fieldErrorText: { color: Colors.error, fontSize: FontSize.xs, marginBottom: 4 },

  reviewCard: { backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.xl },
  reviewLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 2 },
  reviewValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500', marginBottom: 12 },
  
  footerActions: { marginTop: Spacing.xl },

  successContainer: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  successView: { alignItems: 'center', backgroundColor: Colors.bgCard, padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  successIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxl, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  successMessage: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xxl },
  successBtn: { width: '100%', borderRadius: BorderRadius.full },
});
