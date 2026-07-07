import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { db } from '../../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: 'How do I join a group?',
    answer: 'Navigate to the "Communities" tab on the bottom bar. Browse the available groups and tap the "Join" button on the card. Once joined, you can participate in the group chat and view member-only announcements.'
  },
  {
    question: 'How can I register for an event?',
    answer: 'Go to the "Home" feed or the "Communities" tab to find upcoming events. Tap on an event to view its details, then tap the "Register" button. You will receive a notification once your registration is confirmed.'
  },
  {
    question: 'What does an Organizer do?',
    answer: 'Organizers can create and manage events, broadcast announcements to their groups, and oversee event registrations. They have a special verified badge and access to an exclusive Organizer Dashboard.'
  }
];

export default function HelpSupportScreen() {
  const { user } = useUserStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const contactSupport = () => {
    // In a real app, this would open the email client
    Linking.openURL('mailto:support@ieeecompconnect.org?subject=App Support Request').catch(
      () => alert('Unable to open email client.')
    );
  };

  const startLiveChat = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'supportTickets', user.uid), {
        uid: user.uid,
        userName: user.email?.split('@')[0] || 'Student',
        status: 'open',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch(err) {
      console.warn("Failed to create support ticket", err);
    }
    router.push(`/chat/support_${user.uid}`);
  };

  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-buoy" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          </View>
          
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index}>
                <TouchableOpacity 
                  style={styles.faqRow}
                  onPress={() => toggleAccordion(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqLabel}>{faq.question}</Text>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-forward'} 
                    size={20} 
                    color={isExpanded ? Colors.primary : Colors.textMuted} 
                  />
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
                
                {index < FAQS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles" size={24} color={Colors.success} />
            <Text style={styles.cardTitle}>Contact Us</Text>
          </View>
          
          <TouchableOpacity style={styles.contactRow} onPress={contactSupport}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactDesc}>We typically reply within 24 hours</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactRow} onPress={startLiveChat}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="chatbox-ellipses" size={20} color={Colors.success} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Live Chat</Text>
              <Text style={styles.contactDesc}>Talk to our admin team directly</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>App Version 1.0.0 (Build 42)</Text>
      </ScrollView>
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
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  faqLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  faqAnswerContainer: { paddingBottom: Spacing.md, paddingRight: Spacing.xl },
  faqAnswer: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: 'bold' },
  contactDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  versionText: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, fontSize: FontSize.sm },
});
