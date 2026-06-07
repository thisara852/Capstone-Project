import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
  Modal, TouchableWithoutFeedback, ImageBackground
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';
import { useFeedStore } from '../../store/feedStore';
import { useCompetitionStore } from '../../store/competitionStore';
import { uploadFileToCloudinary } from '../../utils/cloudinary';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';
import { format } from 'date-fns';

export default function EventChatScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string, name: string, type: 'image' | 'document', size?: number } | null>(null);
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const insets = useSafeAreaInsets();

  const { user, profile } = useUserStore();
  const { posts } = useFeedStore();
  const { myCompetitions } = useCompetitionStore();
  
  const { messages, isLoading, subscribeToChat, sendMessage, deleteMessage, cleanup } = useChatStore();

  const event = posts.find(p => p.id === eventId) || myCompetitions.find(p => p.id === eventId);
  const isCreatorOrganizer = event && user?.uid === event.authorId;
  const isAdmin = profile?.role === 'admin';
  const canModerate = isCreatorOrganizer || isAdmin;

  useEffect(() => {
    if (eventId) {
      subscribeToChat(eventId);
    }
    return () => cleanup();
  }, [eventId]);

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
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: 'image',
        size: asset.fileSize
      });
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
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
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
          type: 'document',
          size: asset.size
        });
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const showAttachmentMenu = () => {
    setIsAttachmentMenuVisible(true);
  };

  const handleDownloadDocument = async (item: ChatMessage) => {
    if (!item.fileUrl) return;
    try {
      setDownloadingFileId(item.id);
      const safeName = (item.fileName || 'document.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}`;
      
      console.log('Downloading from:', item.fileUrl);
      console.log('Saving to:', fileUri);
      
      const downloadRes = await FileSystem.downloadAsync(item.fileUrl, fileUri);
      console.log('Download result:', downloadRes);
      
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
        Alert.alert('Download Error', `Failed to download. Status: ${downloadRes.status}. URL: ${item.fileUrl.substring(0, 30)}...`);
      }
    } catch (err: any) {
      console.error('Download exception:', err);
      Alert.alert('Error', 'Failed to open document: ' + err.message);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const saveImageToGallery = async (imageUrl: string) => {
    try {
      setIsSavingImage(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos to your device.');
        return;
      }
      
      // Download to cache first
      const filename = imageUrl.split('/').pop() || 'photo.jpg';
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadRes.status === 200) {
        await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
        Alert.alert('Success', 'Photo saved to your gallery!');
      } else {
        Alert.alert('Error', 'Failed to download photo.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save photo.');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedFile) || isSending) return;
    
    setIsSending(true);
    try {
      let fileUrl;
      if (selectedFile) {
        fileUrl = await uploadFileToCloudinary(selectedFile.uri, selectedFile.type === 'document');
      }

      await sendMessage({
        eventId: eventId as string, 
        text: messageText, 
        type: isAnnouncement ? 'announcement' : 'normal',
        fileUrl,
        fileName: selectedFile?.name,
        fileType: selectedFile?.type,
        fileSize: selectedFile?.size
      });
      
      setMessageText('');
      setSelectedFile(null);
      setIsAnnouncement(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleLongPress = (message: ChatMessage) => {
    if (!canModerate && message.senderId !== user?.uid) return; 
    
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteMessage(eventId as string, message.id).catch(err => {
              Alert.alert('Error', 'Failed to delete message');
            });
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;
    const isSpecial = item.type === 'announcement';

    return (
      <TouchableOpacity 
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperMe : styles.messageWrapperThem
        ]}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{item.senderName[0]}</Text>
          </View>
        )}
        
        <View style={{ flex: 1, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {!isMe && (
            <View style={styles.senderInfo}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              {item.senderRole === 'organizer' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Organizer</Text>
                </View>
              )}
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
            isSpecial && styles.messageBubbleAnnouncement,
            (item.fileUrl && !item.text) && { paddingVertical: Spacing.sm }
          ]}>
            {item.deleted ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6 }}>
                <Ionicons name="trash-outline" size={14} color={isMe ? '#fff' : Colors.textSecondary} />
                <Text style={[
                  styles.messageText,
                  { fontStyle: 'italic', marginLeft: 6 },
                  isMe ? styles.messageTextMe : styles.messageTextThem
                ]}>
                  This message was deleted
                </Text>
              </View>
            ) : (
              <>
                {isSpecial && (
                  <View style={styles.announcementHeader}>
                    <Ionicons name="megaphone" size={14} color="#b28900" />
                    <Text style={styles.announcementLabel}>ANNOUNCEMENT</Text>
                  </View>
                )}
                
                {item.fileUrl && item.fileType === 'image' && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setFullScreenImage(item.fileUrl!)}>
                    <Image source={{ uri: item.fileUrl }} style={styles.messageImage} />
                  </TouchableOpacity>
                )}

                {item.fileUrl && item.fileType === 'document' && (
                  <TouchableOpacity 
                    style={styles.fileCard}
                    onPress={() => handleDownloadDocument(item)}
                    disabled={downloadingFileId === item.id}
                  >
                    <Ionicons name="document" size={24} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{item.fileName || 'Document'}</Text>
                      {item.fileSize && <Text style={styles.fileSize}>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</Text>}
                    </View>
                    {downloadingFileId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={20} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}

                {!!item.text && (
                  <Text style={[
                    styles.messageText,
                    isMe ? styles.messageTextMe : styles.messageTextThem,
                    isSpecial && styles.messageTextAnnouncement,
                    item.fileUrl && { marginTop: 8 }
                  ]}>
                    {item.text}
                  </Text>
                )}
              </>
            )}

            <Text style={[
              styles.timeText,
              isMe ? styles.timeTextMe : styles.timeTextThem
            ]}>
              {format(new Date(item.createdAt), 'h:mm a')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventId.startsWith('support_') ? 'Live Support' : event?.title || 'Chat'}</Text>
          <Text style={styles.headerSubtitle}>{eventId.startsWith('support_') ? 'Admin Assistant' : 'Group Chat'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ImageBackground 
          source={require('../../assets/chat_bg.jpg')} 
          style={styles.chatBackground}
          imageStyle={{ opacity: 0.6, resizeMode: 'cover' }}
        >
          {isLoading && messages.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySubText}>Be the first to say hello!</Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ImageBackground>

        <View style={{ backgroundColor: Colors.bgCard }}>
          {selectedFile && (
            <View style={styles.previewContainer}>
              <View style={styles.previewBox}>
                {selectedFile.type === 'image' ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewDocIcon}>
                    <Ionicons name="document-text" size={24} color={Colors.primary} />
                  </View>
                )}
                <Text style={styles.previewName} numberOfLines={1}>{selectedFile.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.previewClose}>
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={isAnnouncement ? "Type an announcement..." : "Message the group..."}
                placeholderTextColor={Colors.textMuted}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity style={styles.attachBtn} onPress={showAttachmentMenu}>
                <Ionicons name="attach" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              {canModerate && !eventId.startsWith('support_') && (
                <TouchableOpacity 
                  style={[styles.announcementToggle, isAnnouncement && styles.announcementToggleActive]}
                  onPress={() => setIsAnnouncement(!isAnnouncement)}
                >
                  <Ionicons 
                    name="megaphone" 
                    size={20} 
                    color={isAnnouncement ? '#fff' : Colors.textSecondary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.sendBtn, (!messageText.trim() && !selectedFile) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={(!messageText.trim() && !selectedFile) || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Viewer Modal */}
      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade">
        <View style={styles.fullScreenModalBg}>
          <TouchableOpacity style={styles.fullScreenCloseBtn} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close-circle" size={40} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
          {fullScreenImage && (
            <TouchableOpacity 
              style={styles.fullScreenSaveBtn} 
              onPress={() => saveImageToGallery(fullScreenImage)}
              disabled={isSavingImage}
            >
              {isSavingImage ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={24} color="#fff" />
                  <Text style={styles.fullScreenSaveText}>Save to Device</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Attachment Menu Modal */}
      <Modal visible={isAttachmentMenuVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAttachmentMenuVisible(false)}>
          <View style={styles.attachmentMenuContainer}>
            <Text style={styles.attachmentMenuTitle}>Share Attachment</Text>
            
            <View style={styles.attachmentOptionsRow}>
              <TouchableOpacity style={styles.attachmentOptionBtn} onPress={pickImage}>
                <View style={[styles.attachmentIconBox, { backgroundColor: Colors.primary + '22' }]}>
                  <Ionicons name="image" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.attachmentOptionText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentOptionBtn} onPress={pickDocument}>
                <View style={[styles.attachmentIconBox, { backgroundColor: Colors.accent + '22' }]}>
                  <Ionicons name="document-text" size={28} color={Colors.accent} />
                </View>
                <Text style={styles.attachmentOptionText}>Document</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.attachmentCancelBtn} onPress={() => setIsAttachmentMenuVisible(false)}>
              <Text style={styles.attachmentCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgDark,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconBg: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    borderRadius: 40,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    marginTop: Spacing.md,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperThem: {
    alignSelf: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  senderAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  senderName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  roleBadge: {
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: Colors.bgSurface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleAnnouncement: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#ffe082',
    borderBottomLeftRadius: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe082',
    paddingBottom: 4,
  },
  announcementLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b28900',
    letterSpacing: 1,
  },
  messageText: {
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextThem: {
    color: Colors.textPrimary,
  },
  messageTextAnnouncement: {
    color: '#1a1a2e',
    fontWeight: '500',
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: 220,
  },
  fileName: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  fileSize: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextThem: {
    color: Colors.textMuted,
  },
  
  previewContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  previewDocIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  previewClose: {
    padding: 4,
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    marginRight: Spacing.sm,
    minHeight: 45,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  attachBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  announcementToggleActive: {
    backgroundColor: Colors.warning,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: 10,
    maxHeight: 80,
  },
  sendBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  fullScreenSaveBtn: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 30,
    gap: 8,
  },
  fullScreenSaveText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentMenuContainer: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  attachmentMenuTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  attachmentOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xxl,
  },
  attachmentOptionBtn: {
    alignItems: 'center',
  },
  attachmentIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  attachmentCancelBtn: {
    backgroundColor: Colors.bgSurface,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  attachmentCancelText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
