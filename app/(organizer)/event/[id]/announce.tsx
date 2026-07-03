import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../../../store/notificationStore';
import { useCompetitionStore } from '../../../../store/competitionStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../../constants/theme';

export default function AnnounceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myCompetitions } = useCompetitionStore();
  const { sendAnnouncementToAttendees, isLoading } = useNotificationStore();

  const event = myCompetitions.find(c => c.id === id);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const PRIORITIES = [
    { value: 'low', label: 'Low', color: Colors.textSecondary },
    { value: 'normal', label: 'Normal', color: Colors.primary },
    { value: 'high', label: 'Urgent', color: Colors.error },
  ];

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter a title and message for your announcement.');
      return;
    }

    if (!event) {
      Alert.alert('Error', 'Event not found.');
      return;
    }

    Alert.alert(
      'Broadcast Announcement',
      `This will immediately notify all students registered for "${event.title}". Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Broadcast', 
          onPress: async () => {
            try {
              await sendAnnouncementToAttendees(
                event.id,
                title.trim(),
                message.trim()
              );
              Alert.alert('Success', 'Announcement broadcasted successfully!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send announcement.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Broadcast Update</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.infoBox}>
          <Ionicons name="megaphone-outline" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Target Audience:</Text>
            <Text style={styles.infoText}>
              All {event?.registeredCount || 0} registered participants for "{event?.title}"
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Announcement Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Venue Changed to Auditorium!"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          editable={!isLoading}
        />

        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.priorityGrid}>
          {PRIORITIES.map((p) => {
            const selected = priority === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityCard, 
                  selected && { borderColor: p.color, backgroundColor: p.color + '11' }
                ]}
                onPress={() => setPriority(p.value as any)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={selected ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={selected ? p.color : Colors.textMuted} 
                />
                <Text style={[styles.priorityText, selected && { color: p.color, fontWeight: 'bold' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write the full update details here..."
          placeholderTextColor={Colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isLoading}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleBroadcast}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Send Announcement</Text>
            </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '11',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoTitle: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
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
  textArea: {
    minHeight: 120,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  priorityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  priorityText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  }
});
