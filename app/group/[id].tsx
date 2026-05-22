import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, messages, subscribeToMessages, sendMessage, joinGroup } = useGroupStore();
  const { user, profile } = useUserStore();
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);

  const group = groups.find((g) => g.id === id);
  const userId = user?.uid || 'demo-user';
  const groupMessages = messages[id || ''] || [];
  const isJoined = group?.members?.includes(userId);

  useEffect(() => {
    let unsubscribe: () => void;
    if (id) {
      unsubscribe = subscribeToMessages(id);
    }
    return () => unsubscribe?.();
  }, [id]);

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    await sendMessage(id, {
      groupId: id,
      senderId: userId,
      senderName: profile?.displayName || 'Demo User',
      text: text.trim(),
      type: 'text',
    });
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
            <Text style={styles.memberCount}>{group.memberCount} members</Text>
          </View>
          {!isJoined && (
            <TouchableOpacity style={styles.joinBtn} onPress={() => joinGroup(group.id, userId)}>
              <Text style={styles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Cover */}
        {group.coverImage && (
          <View style={styles.coverContainer}>
            <Image source={{ uri: group.coverImage }} style={styles.cover} resizeMode="cover" />
            <LinearGradient colors={['transparent', Colors.bgDark]} style={StyleSheet.absoluteFillObject} />
            <View style={styles.coverOverlay}>
              <Text style={styles.coverCategory}>{group.category}</Text>
              <Text style={styles.coverDesc} numberOfLines={2}>{group.description}</Text>
            </View>
          </View>
        )}

        {/* Chat */}
        {!isJoined ? (
          <View style={styles.centered}>
            <Ionicons name="lock-closed" size={40} color={Colors.textMuted} />
            <Text style={styles.lockedText}>Join the group to chat</Text>
            <TouchableOpacity style={styles.bigJoinBtn} onPress={() => joinGroup(group.id, userId)}>
              <LinearGradient colors={Colors.gradientPrimary as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bigJoinGradient}>
                <Text style={styles.bigJoinText}>Join Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatRef}
              data={groupMessages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatText}>No messages yet. Say hello! 👋</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isMine = item.senderId === userId;
                return (
                  <View style={[styles.messageWrapper, isMine && styles.messageWrapperMine]}>
                    {!isMine && (
                      <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{item.senderName[0]}</Text>
                      </View>
                    )}
                    <View style={[styles.messageBubble, isMine && styles.messageBubbleMine]}>
                      {!isMine && <Text style={styles.senderName}>{item.senderName}</Text>}
                      <Text style={styles.messageText}>{item.text}</Text>
                      <Text style={styles.messageTime}>
                        {item.timestamp instanceof Date
                          ? format(item.timestamp, 'HH:mm')
                          : 'now'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={Colors.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!text.trim()}
              >
                <LinearGradient colors={Colors.gradientPrimary as [string, string]} style={styles.sendGradient}>
                  <Ionicons name="send" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.md },
  backIconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  groupName: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  memberCount: { color: Colors.textMuted, fontSize: FontSize.xs },
  joinBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 6 },
  joinBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  coverContainer: { height: 120, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', bottom: 8, left: Spacing.md, right: Spacing.md },
  coverCategory: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  coverDesc: { color: Colors.textSecondary, fontSize: FontSize.sm },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  lockedText: { color: Colors.textMuted, fontSize: FontSize.lg },
  bigJoinBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  bigJoinGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  bigJoinText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  notFoundText: { color: Colors.textMuted, fontSize: FontSize.lg },
  chatList: { padding: Spacing.md, gap: 12, paddingBottom: 20 },
  emptyChat: { alignItems: 'center', paddingTop: 40 },
  emptyChatText: { color: Colors.textMuted, fontSize: FontSize.md },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  messageWrapperMine: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bgSurface, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  messageBubble: { maxWidth: '75%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderBottomLeftRadius: 4, padding: 10, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  messageBubbleMine: { backgroundColor: Colors.primary + '33', borderColor: Colors.primary + '55', borderBottomRightRadius: 4, borderBottomLeftRadius: BorderRadius.lg },
  senderName: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  messageText: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 20 },
  messageTime: { color: Colors.textMuted, fontSize: FontSize.xs, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard, gap: 8 },
  input: { flex: 1, backgroundColor: Colors.bgSurface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, fontSize: FontSize.md, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { borderRadius: 20 },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
