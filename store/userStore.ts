import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  branch: string;
  university: string;
  membershipType: 'Student' | 'Graduate' | 'Professional';
  interests: string[];
  joinedGroups: string[];
  bio?: string;
  linkedIn?: string;
  createdAt: number;
}

interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  initializeAuth: () => {
    set({ isLoading: true });
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        set({ user, isLoading: false });
        await get().fetchProfile(user.uid);
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: credential.user });
      await get().fetchProfile(credential.user.uid);
    } catch (err: any) {
      set({ error: err.message || 'Login failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, profileData) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email,
        displayName: profileData.displayName || email.split('@')[0],
        branch: profileData.branch || '',
        university: profileData.university || '',
        membershipType: profileData.membershipType || 'Student',
        interests: profileData.interests || [],
        joinedGroups: [],
        bio: profileData.bio || '',
        linkedIn: profileData.linkedIn || '',
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      set({ user: credential.user, profile: newProfile });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, profile: null });
  },

  fetchProfile: async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        set({ profile: snap.data() as UserProfile });
      }
    } catch (err: any) {
      // Use console.warn instead of console.error to avoid React Native LogBox red screen when offline
      console.warn('Failed to fetch profile (device might be offline):', err.message || err);
    }
  },

  updateProfile: async (data) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    set({ isLoading: true });
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      set({ profile: { ...profile, ...data } as UserProfile });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
