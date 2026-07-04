import { create } from 'zustand';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useUserStore } from './userStore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'organizer' | 'admin' | string;
  text: string;
  type: 'normal' | 'announcement' | 'system';
  createdAt: number;
  
  // Attachments
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document';
  fileSize?: number;

  // Deletion
  deleted?: boolean;
  deletedAt?: number;
}

export interface SendMessageParams {
  eventId: string;
  text: string;
  type?: 'normal' | 'announcement';
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document';
  fileSize?: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  unsubscribeChat: (() => void) | null;

  subscribeToChat: (eventId: string) => void;
  sendMessage: (params: SendMessageParams) => Promise<void>;
  deleteMessage: (eventId: string, messageId: string) => Promise<void>;
  cleanup: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  unsubscribeChat: null,

  cleanup: () => {
    const { unsubscribeChat } = get();
    if (unsubscribeChat) {
      unsubscribeChat();
    }
    set({ messages: [], unsubscribeChat: null, error: null });
  },

  subscribeToChat: (eventId: string) => {
    const { cleanup } = get();
    cleanup(); // Clear any existing listeners

    set({ isLoading: true, error: null });

    try {
      const messagesRef = collection(db, 'eventChats', eventId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100)); // Optimized listener

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            text: data.text,
            type: data.type,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            
            // Attachments
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileType: data.fileType,
            fileSize: data.fileSize,
            
            // Soft delete state
            deleted: data.deleted,
            deletedAt: data.deletedAt?.toMillis ? data.deletedAt.toMillis() : undefined,
          });
        });
        
        // Ensure messages are sorted descending (newest first for inverted FlatList)
        msgs.sort((a, b) => b.createdAt - a.createdAt);
        
        set({ messages: msgs, isLoading: false });
      }, (error) => {
        console.error("Chat listener error:", error);
        set({ error: "Failed to load chat messages", isLoading: false });
      });

      set({ unsubscribeChat: unsubscribe });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  sendMessage: async ({ eventId, text, type = 'normal', fileUrl, fileName, fileType, fileSize }) => {
    if (!text.trim() && !fileUrl) return; // Allow file-only messages

    try {
      const { user, profile } = useUserStore.getState();
      if (!user || !profile) throw new Error("Must be logged in to chat");

      const messagesRef = collection(db, 'eventChats', eventId, 'messages');
      
      const payload: any = {
        senderId: user.uid,
        senderName: profile.displayName || 'User',
        senderRole: profile.role || 'student',
        text: text.trim(),
        type,
        createdAt: serverTimestamp(),
      };

      if (fileUrl) {
        payload.fileUrl = fileUrl;
        if (fileName) payload.fileName = fileName;
        if (fileType) payload.fileType = fileType;
        if (fileSize) payload.fileSize = fileSize;
      }

      await addDoc(messagesRef, payload);
    } catch (err: any) {
      console.error("Send message error:", err);
      throw new Error(err.message || "Failed to send message");
    }
  },

  deleteMessage: async (eventId: string, messageId: string) => {
    try {
      const messageRef = doc(db, 'eventChats', eventId, 'messages', messageId);
      
      // Update instead of delete for soft-delete logic
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        text: 'This message was deleted',
        // Optional: you can choose to remove fileUrls here, 
        // but replacing the UI on read is safer for history if needed.
        // We will remove it here for strict compliance with hiding files.
        fileUrl: null, 
      });
    } catch (err: any) {
      console.error("Delete message error:", err);
      throw new Error(err.message || "Failed to delete message");
    }
  }
}));
