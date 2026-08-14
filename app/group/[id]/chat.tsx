import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
  Modal
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useGroupStore, GroupMessage } from '../../../store/groupStore';
import { useUserStore } from '../../../store/userStore';
import { uploadFileToCloudinary } from '../../../utils/cloudinary';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../constants/theme';
import { format } from 'date-fns';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string, name: string, type: 'image' | 'file', size?: number } | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  
  const { user, profile } = useUserStore();
  const { messages, currentGroup, subscribeToMessages, sendMessage, deleteMessage, getGroupDetails } = useGroupStore();
  const insets = useSafeAreaInsets();

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!currentGroup || currentGroup.id !== id) {
      getGroupDetails(id);
    }
    const unsubscribe = subscribeToMessages(id);
    return () => unsubscribe();
  }, [id]);

  const groupMessages = messages[id] || [];
  const isOwner = currentGroup?.createdBy === user?.uid;
  const isAdmin = profile?.role === 'admin';
  const canModerate = isOwner || isAdmin;

  const pickImage = async () => {
    setIsAttachmentMenuVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const sizeMB = (asset.fileSize || 0) / (1024 * 1024);
      if (sizeMB > 10) {
        Alert.alert('File too large', 'Images must be under 10MB');
        return;
      }
      setSelectedFile({ uri: asset.uri, name: asset.fileName || 'image.jpg', type: 'image', size: asset.fileSize });
    }
  };

  const pickDocument = async () => {
    setIsAttachmentMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
          'application/vnd.ms-powerpoint', 
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'application/zip'
        ],
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const sizeMB = (asset.size || 0) / (1024 * 1024);
        if (sizeMB > 25) {
          Alert.alert('File too large', 'Documents must be under 25MB');
          return;
        }
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: 'file',
          size: asset.size
        });
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleDownloadDocument = async (item: GroupMessage) => {
    if (!item.fileUrl) return;
    try {
      setDownloadingFileId(item.id);
      const safeName = (item.fileName || 'document.file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}`;
      
      const downloadRes = await FileSystem.downloadAsync(item.fileUrl, fileUri);
      
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: item.fileUrl.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            dialogTitle: `Save or View ${item.fileName}`
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        Alert.alert('Download Error', `Failed to download. Status: ${downloadRes.status}.`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to open document: ' + err.message);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedFile) || !user || !profile) return;
    
    setIsSending(true);
    try {
      let fileUrl = undefined;
      
      if (selectedFile) {
        fileUrl = await uploadFileToCloudinary(selectedFile.uri, selectedFile.type === 'file');
      }

      const messagePayload: any = {
        senderId: user.uid,
        senderName: profile.displayName || 'User',
        text: messageText.trim(),
        type: selectedFile ? selectedFile.type : 'text',
      };

      if (profile.photoURL) messagePayload.senderPhotoURL = profile.photoURL;
      if (fileUrl) messagePayload.fileUrl = fileUrl;
      if (selectedFile?.name) messagePayload.fileName = selectedFile.name;

      await sendMessage(id, messagePayload);

      setMessageText('');
      setSelectedFile(null);
      
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleLongPress = (item: GroupMessage) => {
    if (item.deleted) return;
    
    const isMine = item.senderId === user?.uid;
    if (isMine || canModerate) {
      Alert.alert(
        'Message Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Message', 
            style: 'destructive',
            onPress: () => {
              Alert.alert('Confirm', 'Delete this message permanently?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(id, item.id) }
              ]);
            }
          }
        ]
      );
    }
  };

  const renderMessage = ({ item, index }: { item: GroupMessage, index: number }) => {
    const isMine = item.senderId === user?.uid;
    const isSystem = item.type === 'system';
    
    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    if (item.deleted) {
      return (
        <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
          <View style={[styles.messageBubble, styles.deletedBubble]}>
            <Ionicons name="trash-outline" size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.deletedText}>This message was deleted</Text>
          </View>
        </View>
      );
    }

    const prevMessage = index < groupMessages.length - 1 ? groupMessages[index + 1] : null;
    const isConsecutive = prevMessage && prevMessage.senderId === item.senderId && !prevMessage.deleted && prevMessage.type !== 'system';

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        {!isMine && !isConsecutive && (
          <View style={styles.avatar}>
            {item.senderPhotoURL ? (
              <Image source={{ uri: item.senderPhotoURL }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{item.senderName?.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        )}
        
        {!isMine && isConsecutive && <View style={styles.avatarSpacer} />}

        <TouchableOpacity 
          style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.8}
        >
          {!isMine && !isConsecutive && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          
          {item.type === 'image' && item.fileUrl && (
            <TouchableOpacity onPress={() => setFullScreenImage(item.fileUrl!)}>
              <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
            </TouchableOpacity>
          )}

          {item.type === 'file' && item.fileUrl && (
            <TouchableOpacity 
              style={styles.fileContainer} 
              onPress={() => handleDownloadDocument(item)}
            >
              <View style={styles.fileIconBox}>
                <Ionicons name="document-text" size={24} color={isMine ? Colors.primary : '#fff'} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isMine ? styles.messageTextMine : styles.messageTextOther]} numberOfLines={1}>
                  {item.fileName || 'Document'}
                </Text>
                <Text style={[styles.fileTapText, isMine ? {color: 'rgba(255,255,255,0.7)'} : {color: Colors.textMuted}]}>
                  Tap to view
                </Text>
              </View>
              {downloadingFileId === item.id ? (
                <ActivityIndicator size="small" color={isMine ? '#fff' : Colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={20} color={isMine ? '#fff' : Colors.primary} />
              )}
            </TouchableOpacity>
          )}

          {!!item.text && (
            <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextOther]}>
              {item.text}
            </Text>
          )}
          
          <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeOther]}>
            {format(new Date(item.createdAt), 'h:mm a')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{currentGroup?.name || 'Loading...'}</Text>
          <Text style={styles.headerSubtitle}>{currentGroup?.memberCount || 0} Members</Text>
        </View>
        <TouchableOpacity style={styles.infoBtn} onPress={() => router.push(`/group/${id}`)}>
          <Image 
            source={{ uri: currentGroup?.avatar || 'https://via.placeholder.com/150' }} 
            style={styles.headerAvatar} 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={groupMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {selectedFile && (
          <View style={styles.previewContainer}>
            {selectedFile.type === 'image' ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.previewImg} />
            ) : (
              <View style={[styles.previewImg, {backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center'}]}>
                <Ionicons name="document-text" size={32} color={Colors.primary} />
              </View>
            )}
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={{color: Colors.textPrimary, fontSize: FontSize.sm}} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              {selectedFile.size && (
                <Text style={{color: Colors.textMuted, fontSize: FontSize.xs}}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.previewClose} onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {isAttachmentMenuVisible && (
          <View style={styles.attachmentMenu}>
            <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
              <View style={[styles.attachIconWrap, {backgroundColor: Colors.primary}]}>
                <Ionicons name="image" size={24} color="#fff" />
              </View>
              <Text style={styles.attachOptionText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
              <View style={[styles.attachIconWrap, {backgroundColor: Colors.accent}]}>
                <Ionicons name="document" size={24} color="#fff" />
              </View>
              <Text style={styles.attachOptionText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={() => setIsAttachmentMenuVisible(false)}>
              <View style={[styles.attachIconWrap, {backgroundColor: Colors.bgCard}]}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.attachOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={Colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.attachBtn} onPress={() => setIsAttachmentMenuVisible(!isAttachmentMenuVisible)}>
              <Ionicons name="attach" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.sendBtn, (!messageText.trim() && !selectedFile) && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={(!messageText.trim() && !selectedFile) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade">
        <View style={styles.fullScreenImgContainer}>
          <TouchableOpacity 
            style={styles.fullScreenClose} 
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  infoBtn: { padding: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgDark },
  
  listContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },

  systemMessage: { alignSelf: 'center', backgroundColor: Colors.bgCard, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginVertical: 8 },
  systemText: { color: Colors.textMuted, fontSize: FontSize.xs },

  messageRow: { flexDirection: 'row', marginBottom: 4, maxWidth: '85%' },
  messageRowMine: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageRowOther: { alignSelf: 'flex-start' },
  
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8, alignSelf: 'flex-end' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 14 },
  avatarText: { color: '#fff', fontSize: FontSize.xs, fontWeight: 'bold' },
  avatarSpacer: { width: 36 },

  messageBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  messageBubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: Colors.bgCard, borderBottomLeftRadius: 4 },
  
  deletedBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  deletedText: { color: Colors.textMuted, fontStyle: 'italic', fontSize: FontSize.sm },

  senderName: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: 'bold', marginBottom: 2 },
  
  messageText: { fontSize: FontSize.md, lineHeight: 20 },
  messageTextMine: { color: '#fff' },
  messageTextOther: { color: Colors.textPrimary },
  
  messageImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 4 },
  
  fileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8, marginBottom: 4, width: 200 },
  fileIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: FontSize.sm, fontWeight: '600' },
  fileTapText: { fontSize: 10, marginTop: 2 },

  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMine: { color: 'rgba(255,255,255,0.7)' },
  messageTimeOther: { color: Colors.textMuted },

  attachmentMenu: { flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.md, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border },
  attachOption: { alignItems: 'center', gap: 6 },
  attachIconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  attachOptionText: { color: Colors.textPrimary, fontSize: FontSize.xs },

  previewContainer: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border },
  previewImg: { width: 60, height: 60, borderRadius: 8 },
  previewClose: { padding: 4 },

  inputArea: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, backgroundColor: 'transparent' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 24, minHeight: 45, maxHeight: 100, paddingLeft: 16, paddingRight: 8, borderWidth: 1, borderColor: Colors.borderLight },
  attachBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 10 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: Colors.primary + '80' },

  fullScreenImgContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  fullScreenImg: { width: '100%', height: '80%' },
});
