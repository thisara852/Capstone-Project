import { create } from 'zustand';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

export interface Group {
  id: string;
  name: string;
  description: string;
  branch: string;
  category: string;
  memberCount: number;
  members: string[];
  coverImage?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: any;
  type: 'text' | 'image' | 'file';
}

// Mock groups
const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'AI & ML Research Circle',
    description: 'Collaborative research in Artificial Intelligence and Machine Learning',
    branch: 'all',
    category: 'Research',
    memberCount: 47,
    members: [],
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800',
    isPrivate: false,
    createdBy: 'admin',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'g2',
    name: 'Cybersecurity Task Force',
    description: 'Ethical hacking, threat analysis, and security research',
    branch: 'cmb',
    category: 'Security',
    memberCount: 23,
    members: [],
    coverImage: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800',
    isPrivate: false,
    createdBy: 'admin_cmb',
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'g3',
    name: 'Robotics & Automation Lab',
    description: 'Building autonomous systems and robotic solutions',
    branch: 'mrt',
    category: 'Robotics',
    memberCount: 31,
    members: [],
    coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    isPrivate: false,
    createdBy: 'admin_mrt',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'g4',
    name: 'Women in Engineering',
    description: 'Empowering women in STEM and engineering disciplines',
    branch: 'all',
    category: 'Community',
    memberCount: 68,
    members: [],
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    isPrivate: false,
    createdBy: 'admin',
    createdAt: Date.now() - 86400000 * 60,
  },
];

interface GroupStore {
  groups: Group[];
  messages: Record<string, ChatMessage[]>;
  isLoading: boolean;

  fetchGroups: () => Promise<void>;
  joinGroup: (groupId: string, userId: string) => Promise<void>;
  sendMessage: (groupId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  subscribeToMessages: (groupId: string) => () => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: MOCK_GROUPS,
  messages: {},
  isLoading: false,

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const snap = await getDocs(collection(db, 'groups'));
      if (!snap.empty) {
        const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
        set({ groups });
      }
    } catch {
      set({ groups: MOCK_GROUPS });
    } finally {
      set({ isLoading: false });
    }
  },

  joinGroup: async (groupId, userId) => {
    const { groups } = get();
    const updated = groups.map((g) =>
      g.id === groupId ? { ...g, members: [...g.members, userId], memberCount: g.memberCount + 1 } : g
    );
    set({ groups: updated });
    try {
      await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(userId) });
    } catch {}
  },

  sendMessage: async (groupId, message) => {
    const { messages } = get();
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
    };
    const existing = messages[groupId] || [];
    set({ messages: { ...messages, [groupId]: [...existing, newMsg] } });
    try {
      await addDoc(collection(db, `groups/${groupId}/messages`), {
        ...message,
        timestamp: serverTimestamp(),
      });
    } catch {}
  },

  subscribeToMessages: (groupId) => {
    const q = query(
      collection(db, `groups/${groupId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      const { messages } = get();
      set({ messages: { ...messages, [groupId]: msgs } });
    }, () => {});
    return unsubscribe;
  },
}));
