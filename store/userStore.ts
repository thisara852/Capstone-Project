import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { Post } from './feedStore';
import { useFeedStore } from './feedStore';
import { useNotificationStore } from './notificationStore';
import { useGroupStore } from './groupStore';
import { useRegistrationStore } from './registrationStore';
import { useCompetitionStore } from './competitionStore';
import { useChatStore } from './chatStore';
import { useAdminStore } from './adminStore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'organizer' | 'admin';
  photoURL?: string;
  // Student fields
  branch?: string;
  university?: string;
  department?: string;
  membershipType?: 'Student' | 'Graduate' | 'Professional';
  interests?: string[];
  joinedGroups?: string[];
  savedPostIds?: string[];
  followedBranches?: string[];
  studentId?: string;
  github?: string;
  verificationDocuments?: {
    idDocument?: string | null;
    ieeeProof?: string | null;
    appointmentLetter?: string | null;
    logo?: string | null;
  };
  organizationMemberships?: string[];
  // Organizer fields
  organizationName?: string;
  ieeeSection?: string;
  organizationDescription?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  // Privacy & Settings fields
  isProfilePublic?: boolean;
  shareDataWithOrganizers?: boolean;
  deactivated?: boolean;
  // Common fields
  verified?: boolean;
  phoneNumber?: string;
  contactNumber?: string;
  bio?: string;
  linkedIn?: string;
  website?: string;
  createdAt: number;
}

interface UserStore {
  user: User | null;
  profile: UserProfile | null;
  savedPosts: Post[];
  isFetchingSavedPosts: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  isFetchingProfile: boolean;
  error: string | null;
  profileUnsubscribe: (() => void) | null;
  authUnsubscribe: (() => void) | null;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserPassword: (currentPass: string, newPass: string) => Promise<void>;
  deactivateUserAccount: (password: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  toggleFollowBranch: (branchId: string) => Promise<void>;
  fetchSavedPosts: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      savedPosts: [],
      isFetchingSavedPosts: false,
      isLoading: true,
      isInitializing: true,
      isFetchingProfile: false,
      error: null,
      profileUnsubscribe: null,
      authUnsubscribe: null,

  clearError: () => set({ error: null }),

  initializeAuth: () => {
    const { authUnsubscribe } = get();
    if (authUnsubscribe) authUnsubscribe();

    set({ isInitializing: true });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Immediately unblock the UI with the cached user session
        set({ user, isLoading: false, isInitializing: false });
        
        // Fetch the latest profile data in the background
        get().fetchProfile(user.uid).catch(err => {
          console.warn("Background profile fetch failed:", err);
        });
      } else {
        const { profileUnsubscribe } = get();
        if (profileUnsubscribe) profileUnsubscribe();
        
        // Synchronous cleanup — no dynamic imports needed
        try {
          useFeedStore.getState().cleanup();
          useNotificationStore.getState().cleanup();
          useGroupStore.getState().cleanup();
          useRegistrationStore.getState().cleanup();
          useCompetitionStore.getState().cleanup();
          useChatStore.getState().cleanup();
          useAdminStore.getState().cleanup();
        } catch (e) {}

        set({ user: null, profile: null, isLoading: false, isInitializing: false, profileUnsubscribe: null, isFetchingProfile: false });
      }
    });
    set({ authUnsubscribe: unsubscribe });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: credential.user });
      // Profile fetch is handled by onAuthStateChanged — no duplicate call needed
    } catch (err: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        // Fallback to Firebase's message but strip the 'Firebase: ' prefix if present
        errorMessage = err.message.replace(/^Firebase:\s*/, '');
      }
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, profileData) => {
    set({ isLoading: true, error: null });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      const baseProfile = {
        uid: credential.user.uid,
        email,
        displayName: profileData.displayName || email.split('@')[0],
        role: profileData.role || 'student',
        bio: profileData.bio || '',
        linkedIn: profileData.linkedIn || '',
        photoURL: profileData.photoURL || '',
        createdAt: Date.now(),
      };

      let newProfile: UserProfile;

      if (profileData.role === 'organizer') {
        newProfile = {
          ...baseProfile,
          role: 'organizer',
          organizationName: profileData.organizationName || '',
          ieeeSection: profileData.ieeeSection || '',
          organizationDescription: profileData.organizationDescription || '',
          verificationStatus: 'pending',
          verified: false,
          contactNumber: profileData.contactNumber || '',
          website: profileData.website || '',
        };
      } else {
        newProfile = {
          ...baseProfile,
          role: 'student',
          branch: profileData.branch || '',
          university: profileData.university || '',
          department: profileData.department || '',
          membershipType: profileData.membershipType || 'Student',
          interests: profileData.interests || [],
          phoneNumber: profileData.phoneNumber || '',
          verified: true,
          joinedGroups: [],
        };
      }

      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      await get().fetchProfile(credential.user.uid);
      set({ user: credential.user, profile: newProfile });
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. It must be at least 6 characters.';
      } else if (err.message) {
        errorMessage = err.message.replace(/^Firebase:\s*/, '');
      }
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { profileUnsubscribe } = get();
    if (profileUnsubscribe) profileUnsubscribe();
    
    // Synchronous cleanup — all stores are already loaded in memory
    try {
      useFeedStore.getState().cleanup();
      useNotificationStore.getState().cleanup();
      useGroupStore.getState().cleanup();
      useRegistrationStore.getState().cleanup();
      useCompetitionStore.getState().cleanup();
      useChatStore.getState().cleanup();
      useAdminStore.getState().cleanup();
    } catch (e) {}

    await signOut(auth);
    set({ user: null, profile: null, profileUnsubscribe: null, isFetchingProfile: false, isLoading: false });
  },

  fetchProfile: async (uid) => {
    const { profileUnsubscribe, isFetchingProfile } = get();
    if (isFetchingProfile) return; // Prevent concurrent fetches
    
    if (profileUnsubscribe) profileUnsubscribe();

    set({ isFetchingProfile: true });
    try {
      // First, fetch profile immediately for faster login
      const docSnap = await getDoc(doc(db, 'users', uid));
      
      // Prevent setting up listeners if the user logged out while getDoc was running
      const currentUser = get().user;
      if (!currentUser || currentUser.uid !== uid) {
        set({ isFetchingProfile: false });
        return;
      }

      if (docSnap.exists()) {
        set({ profile: docSnap.data() as UserProfile });
      }

      // Then set up real-time listener for updates
      const unsubscribe = onSnapshot(doc(db, 'users', uid), (doc) => {
        if (doc.exists()) {
          set({ profile: doc.data() as UserProfile });
        }
      }, (error) => {
        console.warn('Failed to fetch profile real-time:', error.message);
      });

      // Cleanup any listener that might have been created by concurrent fetchProfile calls (just in case)
      const { profileUnsubscribe: existingUnsubscribe } = get();
      if (existingUnsubscribe) existingUnsubscribe();

      set({ profileUnsubscribe: unsubscribe, isFetchingProfile: false });
    } catch (err: any) {
      console.warn('Failed to setup profile listener:', err.message || err);
      set({ isFetchingProfile: false });
    }
  },

  updateProfile: async (data) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    set({ isLoading: true, error: null });
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      set({ profile: { ...profile, ...data } });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserPassword: async (currentPass, newPass) => {
    const { user } = get();
    if (!user || !user.email) return;

    set({ isLoading: true, error: null });
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
    } catch (err: any) {
      let msg = 'Failed to update password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = 'Incorrect current password.';
      if (err.code === 'auth/weak-password') msg = 'New password is too weak.';
      set({ error: msg });
      throw new Error(msg); // Let caller handle UI failure
    } finally {
      set({ isLoading: false });
    }
  },

  deactivateUserAccount: async (password) => {
    const { user } = get();
    if (!user || !user.email) return;

    set({ isLoading: true, error: null });
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update profile in DB to deactivated
      await updateDoc(doc(db, 'users', user.uid), { deactivated: true });
      
      // Log the user out (which handles cleanup)
      await get().logout();
    } catch (err: any) {
      let msg = 'Failed to deactivate account.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleSavePost: async (postId) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    const savedPostIds = profile.savedPostIds || [];
    const isSaved = savedPostIds.includes(postId);
    
    // Optimistic update
    const newSaved = isSaved 
      ? savedPostIds.filter(id => id !== postId) 
      : [...savedPostIds, postId];
      
    set({ profile: { ...profile, savedPostIds: newSaved } });
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        savedPostIds: isSaved ? arrayRemove(postId) : arrayUnion(postId)
      });
    } catch (err) {
      console.error("Failed to save post", err);
      // Revert on failure
      set({ profile: { ...profile, savedPostIds } });
    }
  },

  toggleFollowBranch: async (branchId) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    
    const followedBranches = profile.followedBranches || [];
    const isFollowing = followedBranches.includes(branchId);
    
    // Optimistic update
    const newFollowed = isFollowing 
      ? followedBranches.filter(id => id !== branchId) 
      : [...followedBranches, branchId];
      
    set({ profile: { ...profile, followedBranches: newFollowed } });
    
    try {
      // Update User Profile
      await updateDoc(doc(db, 'users', user.uid), {
        followedBranches: isFollowing ? arrayRemove(branchId) : arrayUnion(branchId)
      });
    } catch (err) {
      console.error("Failed to follow/unfollow branch in profile", err);
      // Revert on failure
      set({ profile: { ...profile, followedBranches } });
      return; // Stop here if profile update failed
    }

    try {
      // Try to update Branch follower count globally (might fail due to permissions)
      const { increment, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'branches', branchId), {
        followerCount: increment(isFollowing ? -1 : 1)
      }, { merge: true });
    } catch (err) {
      console.warn("Could not update global branch follower count (likely permission issue), but local profile was updated.");
    }
  },

  fetchSavedPosts: async () => {
    const { profile } = get();
    const savedPostIds = profile?.savedPostIds || [];
    if (savedPostIds.length === 0) {
      set({ savedPosts: [] });
      return;
    }

    set({ isFetchingSavedPosts: true });
    try {
      // Firestore 'in' queries support up to 30 items at a time
      const chunks: string[][] = [];
      for (let i = 0; i < savedPostIds.length; i += 30) {
        chunks.push(savedPostIds.slice(i, i + 30));
      }

      const allPosts: Post[] = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'posts'),
          where(documentId(), 'in', chunk)
        );
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          const data = d.data();
          allPosts.push({
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            eventDate: data.eventDate?.toMillis ? data.eventDate.toMillis() : data.eventDate,
          } as Post);
        });
      }

      // Preserve original save order
      const ordered = savedPostIds
        .map(id => allPosts.find(p => p.id === id))
        .filter(Boolean) as Post[];

      set({ savedPosts: ordered });
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      set({ isFetchingSavedPosts: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
      // Success - error will be null
    } catch (err: any) {
      console.error('Password reset error:', err.code, err.message);
      let errorMessage = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message.replace(/^Firebase:\s*/, '');
      }
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile, savedPosts: state.savedPosts }),
    }
  )
);
