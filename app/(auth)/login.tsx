import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetFocused, setIsResetFocused] = useState(false);

  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);

  const { user, login, isLoading, error, clearError, resetPassword } = useUserStore();
  const { isLoading: resetLoading } = useUserStore();

  useEffect(() => {
    if (user) {
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
    <View style={styles.rootContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Wavy Gradient Hero Header */}
          <View style={styles.headerWrapper} pointerEvents="box-none">
            <LinearGradient
              colors={['#1E5ED6', '#1A73E8', '#1557B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
              pointerEvents="box-none"
            >
              {/* Decorative Subtle Circles */}
              <View style={styles.headerCircle1} pointerEvents="none" />
              <View style={styles.headerCircle2} pointerEvents="none" />

              <SafeAreaView edges={['top']} style={styles.headerContent} pointerEvents="box-none">
                {/* IEEE Brand Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/ieee_logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Priority: IEEE CompConnect App Name */}
                <Text style={styles.appName}>IEEE CompConnect</Text>
              </SafeAreaView>
            </LinearGradient>

            {/* Layered Wave Transition Curves */}
            <View style={styles.waveBackdrop} pointerEvents="none" />
            <View style={styles.waveFront} pointerEvents="none" />
          </View>

          {/* Form Content Sheet */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeHeading}>
                <Text style={styles.welcomeBold}>Welcome </Text>
                <Text style={styles.welcomeLight}>back !</Text>
              </Text>
              <Text style={styles.welcomeSubtitle}>Sign in to your IEEE account</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email / Username Pill Input */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => emailInputRef.current?.focus()}
              style={[
                styles.pillInputWrapper,
                isEmailFocused && styles.pillInputFocused
              ]}
            >
              <TextInput
                ref={emailInputRef}
                style={styles.pillInput}
                placeholder="Username or Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              {email.length > 3 && (
                <Ionicons name="checkmark-circle" size={18} color="#1A73E8" style={styles.inputEndIcon} />
              )}
            </TouchableOpacity>

            {/* Password Pill Input */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => passwordInputRef.current?.focus()}
              style={[
                styles.pillInputWrapper,
                isPasswordFocused && styles.pillInputFocused
              ]}
            >
              <TextInput
                ref={passwordInputRef}
                style={styles.pillInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Options Row: Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeBtn}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={rememberMe ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={rememberMe ? '#1A73E8' : '#94A3B8'}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowForgotModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Pill Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
              style={styles.loginBtnOuter}
            >
              <LinearGradient
                colors={['#1A73E8', '#1557B0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* New User Callout */}
            <View style={styles.newUserRow}>
              <Text style={styles.newUserText}>New user? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.7}
              >
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Trust Badge */}
            <View style={styles.bottomTrustBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#94A3B8" />
              <Text style={styles.bottomTrustText}>IEEE Student Branch Network</Text>
            </View>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="lock-closed" size={26} color="#1A73E8" />
              </View>
              
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalDescription}>
                Enter your registered IEEE email to receive recovery instructions.
              </Text>

              {error && (
                <View style={[styles.errorBox, { marginBottom: 14, width: '100%' }]}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={[styles.pillInputWrapper, { width: '100%', marginBottom: 16 }]}>
                <TextInput
                  style={styles.pillInput}
                  placeholder="your.email@ieee.org"
                  placeholderTextColor="#94A3B8"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!resetLoading}
                  onFocus={() => setIsResetFocused(true)}
                  onBlur={() => setIsResetFocused(false)}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={handleCloseForgotModal}
                  disabled={resetLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#1A73E8', '#1557B0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSubmitGradient}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitText}>Send Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 36,
  },
  headerWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  headerCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 10,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  logoContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 6,
  },
  logoImage: {
    width: 100,
    height: 42,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Layered Wave Effect
  waveBackdrop: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(26, 115, 232, 0.3)',
    borderTopLeftRadius: width * 0.45,
    borderTopRightRadius: width * 0.55,
  },
  waveFront: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: width * 0.55,
    borderTopRightRadius: width * 0.45,
  },

  // Form Section
  formContainer: {
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  welcomeHeading: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  welcomeBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeLight: {
    fontWeight: '400',
    color: '#64748B',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '400',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Pill Inputs
  pillInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 20,
    height: 52,
    marginBottom: 14,
  },
  pillInputFocused: {
    borderColor: '#1A73E8',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pillInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  inputEndIcon: {
    marginLeft: 8,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  rememberMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // Login Button
  loginBtnOuter: {
    borderRadius: 26,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loginBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // New User
  newUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  newUserText: {
    fontSize: 14,
    color: '#64748B',
  },
  signUpLink: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '700',
  },

  bottomTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  bottomTrustText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Social Links
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  socialIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 16,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

