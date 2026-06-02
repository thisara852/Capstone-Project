import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { FormInput } from '../../components/forms/FormInput';
import { FormButton } from '../../components/forms/FormButton';

export default function PrivacySecurityScreen() {
  const { profile, updateProfile, updateUserPassword, deactivateUserAccount, error, clearError } = useUserStore();
  
  const [isPublic, setIsPublic] = useState(profile?.isProfilePublic !== false);
  const [shareData, setShareData] = useState(profile?.shareDataWithOrganizers !== false);
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [deactivatePass, setDeactivatePass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTogglePublic = async (val: boolean) => {
    setIsPublic(val);
    await updateProfile({ isProfilePublic: val });
  };

  const handleToggleShare = async (val: boolean) => {
    setShareData(val);
    await updateProfile({ shareDataWithOrganizers: val });
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await updateUserPassword(currentPass, newPass);
      Alert.alert('Success', 'Password updated successfully!');
      setShowPassModal(false);
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      // Error is handled by store and shown via Alert or UI
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatePass) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await deactivateUserAccount(deactivatePass);
      // It will automatically navigate out when user becomes null
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Account Security</Text>
          </View>
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowPassModal(true)}>
            <View>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDesc}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="eye" size={24} color={Colors.accentGold} />
            <Text style={styles.cardTitle}>Data Privacy</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.settingLabel}>Profile Visibility</Text>
              <Text style={styles.settingDesc}>Allow other students to see your profile and joined groups</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={handleTogglePublic}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : isPublic ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Text style={styles.settingDesc}>Share basic contact info with organizers when registering for events</Text>
            </View>
            <Switch
              value={shareData}
              onValueChange={handleToggleShare}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : shareData ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeactivateModal(true)}>
          <Ionicons name="warning-outline" size={20} color={Colors.error} />
          <Text style={styles.deleteText}>Deactivate Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPassModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPassModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FormInput
              label="Current Password"
              placeholder="Enter current password"
              value={currentPass}
              onChangeText={setCurrentPass}
              secureTextEntry
              icon="lock-closed-outline"
            />
            <FormInput
              label="New Password"
              placeholder="Enter new password"
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              icon="lock-closed-outline"
            />
            <FormButton
              label="Update Password"
              onPress={handleChangePassword}
              isLoading={loading}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deactivate Account Modal */}
      <Modal visible={showDeactivateModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: Colors.error, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.error }]}>Deactivate Account</Text>
              <TouchableOpacity onPress={() => setShowDeactivateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 }}>
              Deactivating your account will hide your profile from other users. You must enter your password to confirm this action.
            </Text>
            <FormInput
              label="Password"
              placeholder="Enter your password"
              value={deactivatePass}
              onChangeText={setDeactivatePass}
              secureTextEntry
              icon="lock-closed-outline"
            />
            <TouchableOpacity 
              style={[styles.deleteBtn, { marginTop: Spacing.md, backgroundColor: Colors.error }]} 
              onPress={handleDeactivate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="warning" size={20} color="#fff" />
                  <Text style={[styles.deleteText, { color: '#fff' }]}>Confirm Deactivation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgDark,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  container: { padding: Spacing.lg },
  card: { backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginLeft: Spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  settingLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  settingDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg, marginTop: Spacing.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteText: { color: Colors.error, fontSize: FontSize.md, fontWeight: 'bold', marginLeft: Spacing.sm },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.bgDark, padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary },
});
