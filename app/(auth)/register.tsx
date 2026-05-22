import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { IEEE_BRANCHES, IEEE_TOPICS } from '../../config/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [membershipType, setMembershipType] = useState<'Student' | 'Graduate' | 'Professional'>('Student');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { register, isLoading, error, clearError } = useUserStore();

  const toggleInterest = (topic: string) => {
    setSelectedInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleRegister = async () => {
    clearError();
    const branch = IEEE_BRANCHES.find((b) => b.id === selectedBranch);
    await register(email.trim(), password, {
      displayName: name.trim(),
      branch: selectedBranch,
      university: branch?.university || '',
      membershipType,
      interests: selectedInterests,
    });
    const { user } = useUserStore.getState();
    if (user) router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
              ))}
            </View>
            <Text style={styles.stepLabel}>Step {step} of 3</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={[styles.errorBox, { marginBottom: Spacing.md }]}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join the IEEE CompConnect community</Text>

                {[
                  { label: 'Full Name', value: name, setter: setName, placeholder: 'Your name', icon: 'person-outline', type: 'default' },
                  { label: 'Email', value: email, setter: setEmail, placeholder: 'you@email.com', icon: 'mail-outline', type: 'email-address' },
                  { label: 'Password', value: password, setter: setPassword, placeholder: '8+ characters', icon: 'lock-closed-outline', type: 'default', secure: true },
                ].map((field) => (
                  <View key={field.label} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={field.placeholder}
                        placeholderTextColor={Colors.textMuted}
                        value={field.value}
                        onChangeText={field.setter}
                        keyboardType={field.type as any}
                        autoCapitalize="none"
                        secureTextEntry={!!field.secure}
                      />
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() => {
                    if (!name || !email || !password) return;
                    setStep(2);
                  }}
                >
                  <LinearGradient colors={Colors.gradientPrimary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                    <Text style={styles.btnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: IEEE Branch */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.title}>Your IEEE Branch</Text>
                <Text style={styles.subtitle}>Select your university branch</Text>

                <View style={styles.membershipRow}>
                  {(['Student', 'Graduate', 'Professional'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.memberChip, membershipType === type && styles.memberChipActive]}
                      onPress={() => setMembershipType(type)}
                    >
                      <Text style={[styles.memberChipText, membershipType === type && styles.memberChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Branch</Text>
                <View style={styles.branchList}>
                  {IEEE_BRANCHES.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.branchItem, selectedBranch === b.id && styles.branchItemActive]}
                      onPress={() => setSelectedBranch(b.id)}
                    >
                      <View style={styles.branchInfo}>
                        <Text style={[styles.branchName, selectedBranch === b.id && { color: Colors.primary }]}>
                          {b.university}
                        </Text>
                        <Text style={styles.branchCity}>{b.city}</Text>
                      </View>
                      {selectedBranch === b.id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() => setStep(3)}
                >
                  <LinearGradient colors={Colors.gradientPrimary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                    <Text style={styles.btnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.title}>Your Interests</Text>
                <Text style={styles.subtitle}>
                  Choose topics to personalize your feed. Our NLP engine will curate content for you.
                </Text>

                <View style={styles.topicsGrid}>
                  {IEEE_TOPICS.map((topic) => {
                    const selected = selectedInterests.includes(topic);
                    return (
                      <TouchableOpacity
                        key={topic}
                        style={[styles.topicChip, selected && styles.topicChipActive]}
                        onPress={() => toggleInterest(topic)}
                      >
                        <Text style={[styles.topicText, selected && styles.topicTextActive]}>{topic}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.hint}>Selected: {selectedInterests.length} topics</Text>

                <TouchableOpacity style={styles.nextBtn} onPress={handleRegister} disabled={isLoading}>
                  <LinearGradient colors={Colors.gradientPrimary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.btnText}>Create Account</Text>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.primaryLight }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  header: { paddingVertical: Spacing.lg, gap: 12, flexDirection: 'column' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.bgSurface },
  stepDotActive: { backgroundColor: Colors.primary, width: 24 },
  stepLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  form: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  stepContent: { gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  errorBox: { backgroundColor: Colors.error + '22', borderWidth: 1, borderColor: Colors.error, borderRadius: BorderRadius.md, padding: Spacing.sm },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  inputGroup: { gap: 8 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: Spacing.md },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 14 },
  membershipRow: { flexDirection: 'row', gap: 8 },
  memberChip: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', backgroundColor: Colors.bgSurface },
  memberChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
  memberChipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  memberChipTextActive: { color: Colors.primary },
  branchList: { gap: 8 },
  branchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  branchItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  branchInfo: { flex: 1 },
  branchName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  branchCity: { color: Colors.textMuted, fontSize: FontSize.sm },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.bgSurface },
  topicChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  topicText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  topicTextActive: { color: '#fff' },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  nextBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: 8 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginLinkText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
