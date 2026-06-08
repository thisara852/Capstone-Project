import React, { useState, useEffect } from 'react';
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
  Alert,
  Modal,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { user, login, isLoading, error, clearError, resetPassword } = useUserStore();
  const { isLoading: resetLoading } = useUserStore();

  // Auto-redirect if Firebase restores the session in the background
  useEffect(() => {
    if (user) {
      // Use setTimeout to avoid 'Attempted to navigate before mounting' crashes
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [])
  );

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    clearError();
    await login(email.trim(), password);

    // Navigate immediately if login succeeded (no error was set)
    const { error: loginError } = useUserStore.getState();
    if (!loginError) {
      router.replace('/(tabs)');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    await resetPassword(resetEmail.trim());
    const { error: resetError } = useUserStore.getState();

    if (!resetError) {
      setShowForgotModal(false);
      setResetEmail('');
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail('');
    clearError();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/ieee_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>IEEE CompConnect</Text>
            <Text style={styles.subtitle}>Your IEEE Community Hub</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.description}>Sign in to your IEEE account</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@ieee.org"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.loginBtn}>
              <LinearGradient
                colors={Colors.gradientPrimary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.registerText}>
                New to IEEE CompConnect?{' '}
                <Text style={styles.registerLink}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseForgotModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={[Colors.bgCard, '#1A1F30']} style={styles.modalContent}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="lock-closed" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Reset Password</Text>

              <Text style={styles.modalDescription}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@ieee.org"
                    placeholderTextColor={Colors.textMuted}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!resetLoading}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={handleCloseForgotModal}
                  disabled={resetLoading}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  logoImage: {
    width: 160,
    height: 90,
    marginBottom: Spacing.xs,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  form: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '22',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  loginBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: 4,
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  demoBtn: {
    backgroundColor: Colors.bgSurface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 14,
    alignItems: 'center',
  },
  demoBtnText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  registerBtn: {
    alignItems: 'center',
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  registerLink: {
    color: Colors.primaryLight,
    fontWeight: FontWeight.bold,
  },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  modalIconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30' },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginTop: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.full, backgroundColor: 'transparent', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' },
  modalSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, justifyContent: 'center' },
  modalSubmitText: { color: '#fff', fontSize: FontSize.md, fontWeight: 'bold' },
});
