import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { useUserStore } from './userStore';

export type GroupType = 'event' | 'circle';
export type GroupVisibility = 'public' | 'private';
export type MemberRole = 'owner' | 'moderator' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  category: string;
  tags: string[];
  type: GroupType;
  visibility: GroupVisibility;
  createdBy: string;
  creatorRole: string;
  verified: boolean;
  memberCount: number;
  eventId?: string;
  lastMessageAt?: number;
  createdAt: number;
}

export interface GroupMember {
  id: string; // groupId_userId
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: number;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  type: 'text' | 'image' | 'file' | 'system';
  text: string;
  fileUrl?: string;
  fileName?: string;
  deleted?: boolean;
  createdAt: number;
}

interface GroupStore {
  groups: Group[]; // Discovered/All groups
  myGroups: Group[]; // Groups the current user is in
  currentGroup: Group | null;
  messages: Record<string, GroupMessage[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGroups: (category?: string) => Promise<void>;
  fetchMyGroups: (userId: string) => Promise<void>;
  getGroupDetails: (groupId: string) => Promise<Group | null>;
  createGroup: (groupData: Partial<Group>, userId: string) => Promise<string>;
  joinGroup: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Group>) => Promise<void>;

  // Messaging
  subscribeToMessages: (groupId: string) => () => void;
  sendMessage: (groupId: string, message: Partial<GroupMessage>) => Promise<void>;
  deleteMessage: (groupId: string, messageId: string) => Promise<void>;

  clearError: () => void;
  cleanup: () => void;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      myGroups: [],
      currentGroup: null,
      messages: {},
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),
      
      cleanup: () => {
        set({ groups: [], myGroups: [], currentGroup: null, messages: {} });
      },

      fetchGroups: async (category) => {
        set({ isLoading: true, error: null });
        try {
          let q = query(collection(db, 'groups'), orderBy('memberCount', 'desc'), limit(50));
          if (category && category !== 'All') {
            q = query(collection(db, 'groups'), where('category', '==', category), orderBy('memberCount', 'desc'), limit(50));
          }
          const snap = await getDocs(q);
          // Filter out private groups so they don't appear in public discovery
          const groups = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Group))
            .filter(g => g.visibility === 'public');
          set({ groups, isLoading: false });
        } catch (err: any) {
          console.error("Fetch Groups Error:", err);
          set({ error: err.message, isLoading: false });
        }
      },

      fetchMyGroups: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const membersRef = collection(db, 'groupMembers');
          const q = query(membersRef, where('userId', '==', userId));
          const snap = await getDocs(q);
          
          const myGroupIds = snap.docs.map(d => d.data().groupId);
          if (myGroupIds.length === 0) {
            set({ myGroups: [], isLoading: false });
            return;
          }

          // Fetch group details for the IDs
          // Chunking for 'in' query limitations (max 10)
          const chunks = [];
          for (let i = 0; i < myGroupIds.length; i += 10) {
            chunks.push(myGroupIds.slice(i, i + 10));
          }
          
          let myGroups: Group[] = [];
          for (const chunk of chunks) {
            const groupQ = query(collection(db, 'groups'), where('__name__', 'in', chunk));
            const groupSnap = await getDocs(groupQ);
            myGroups = [...myGroups, ...groupSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group))];
          }

          set({ myGroups, isLoading: false });
        } catch (err: any) {
          console.error("Fetch My Groups Error:", err);
          set({ error: err.message, isLoading: false });
        }
      },

      getGroupDetails: async (groupId: string) => {
        try {
          const docRef = doc(db, 'groups', groupId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const group = { id: snap.id, ...snap.data() } as Group;
            set({ currentGroup: group });
            return group;
          }
          return null;
        } catch (err: any) {
          set({ error: err.message });
          return null;
        }
      },

      createGroup: async (groupData, userId) => {
        set({ isLoading: true, error: null });
        try {
          const newGroup = {
            ...groupData,
            createdBy: userId,
            memberCount: 1,
            createdAt: Date.now(),
            lastMessageAt: Date.now(),
          };

          const docRef = await addDoc(collection(db, 'groups'), newGroup);
          
          const memberId = `${docRef.id}_${userId}`;
          await setDoc(doc(db, 'groupMembers', memberId), {
            id: memberId,
            groupId: docRef.id,
            userId,
            role: 'owner',
            joinedAt: Date.now()
          });

          await get().fetchMyGroups(userId);
          set({ isLoading: false });
          return docRef.id;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      joinGroup: async (groupId, userId) => {
        try {
          const memberId = `${groupId}_${userId}`;
          await setDoc(doc(db, 'groupMembers', memberId), {
            id: memberId,
            groupId,
            userId,
            role: 'member',
            joinedAt: Date.now()
          });

          await updateDoc(doc(db, 'groups', groupId), {
            memberCount: increment(1)
          });

          await get().fetchMyGroups(userId);
          const { currentGroup } = get();
          if (currentGroup && currentGroup.id === groupId) {
            set({ currentGroup: { ...currentGroup, memberCount: (currentGroup.memberCount || 0) + 1 } });
          }
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      leaveGroup: async (groupId, userId) => {
        try {
          const memberId = `${groupId}_${userId}`;
          await deleteDoc(doc(db, 'groupMembers', memberId));

          await updateDoc(doc(db, 'groups', groupId), {
            memberCount: increment(-1)
          });

          await get().fetchMyGroups(userId);
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      deleteGroup: async (groupId: string) => {
        try {
          await deleteDoc(doc(db, 'groups', groupId));
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      updateGroup: async (groupId: string, data: Partial<Group>) => {
        try {
          await updateDoc(doc(db, 'groups', groupId), data);
          // Update local state if it's the current group
          const { currentGroup } = get();
          if (currentGroup?.id === groupId) {
            set({ currentGroup: { ...currentGroup, ...data } });
          }
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      subscribeToMessages: (groupId: string) => {
        const q = query(
          collection(db, `groups/${groupId}/messages`),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
          const msgs = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as GroupMessage));
          
          set((state) => ({
            messages: {
              ...state.messages,
              [groupId]: msgs
            }
          }));
        }, (err) => {
          console.error("Messages Subscription Error:", err);
        });

        return unsubscribe;
      },

      sendMessage: async (groupId, messageData) => {
        try {
          const msg = {
            ...messageData,
            createdAt: Date.now(),
          };
          await addDoc(collection(db, `groups/${groupId}/messages`), msg);
          
          await updateDoc(doc(db, 'groups', groupId), {
            lastMessageAt: Date.now()
          });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      deleteMessage: async (groupId, messageId) => {
        try {
          await updateDoc(doc(db, `groups/${groupId}/messages`, messageId), {
            deleted: true,
            text: 'This message was deleted.',
            fileUrl: null
          });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      }

    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ myGroups: state.myGroups }),
    }
  )
);
