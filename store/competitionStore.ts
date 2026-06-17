import { create } from 'zustand';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  where,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { Post } from './feedStore';
import { useUserStore } from './userStore';

interface CompetitionStore {
  myCompetitions: Post[];
  isLoading: boolean;
  error: string | null;
  competitionsUnsubscribe: (() => void) | null;

  createCompetition: (eventData: Partial<Post>) => Promise<void>;
  updateCompetition: (competitionId: string, eventData: Partial<Post>) => Promise<void>;
  fetchMyCompetitions: (organizerId: string) => void;
  deleteCompetition: (competitionId: string) => Promise<void>;
  clearError: () => void;
  cleanup: () => void;
}

export const useCompetitionStore = create<CompetitionStore>((set, get) => ({
  myCompetitions: [],
  isLoading: false,
  error: null,
  competitionsUnsubscribe: null,

  clearError: () => set({ error: null }),

  cleanup: () => {
    const { competitionsUnsubscribe } = get();
    if (competitionsUnsubscribe) competitionsUnsubscribe();
    set({ competitionsUnsubscribe: null });
  },

  createCompetition: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const profile = useUserStore.getState().profile;
      const user = useUserStore.getState().user;
      
      if (!profile || !user) {
        throw new Error("User not authenticated");
      }

      const newDocRef = doc(collection(db, 'posts')); // Save to the unified 'posts' collection
      const newPost: Post = {
        id: newDocRef.id,
        title: eventData.title || '',
        summary: eventData.summary || eventData.content?.substring(0, 100) + '...' || '',
        content: eventData.content || '',
        imageUrl: eventData.imageUrl,
        pdfUrl: eventData.pdfUrl,
        websiteUrl: eventData.websiteUrl,
        author: profile.organizationName || profile.displayName || 'Unknown Organizer',
        authorId: user.uid,
        branch: profile.ieeeSection || 'all',
        tags: eventData.tags || [],
        likes: [],
        comments: 0,
        createdAt: Date.now(),
        type: 'event',
        eventDate: eventData.eventDate,
        registrationOpen: true,
        status: 'pending', // Starts as pending
        participantLimit: eventData.participantLimit,
        rules: eventData.rules,
        category: eventData.category || 'General',
        eventStatus: eventData.eventStatus || 'upcoming',
        registeredCount: 0,
        registrationConfig: eventData.registrationConfig || {},
      };

      await setDoc(newDocRef, newPost);
      // Local state update handled by onSnapshot
    } catch (err: any) {
      set({ error: err.message || 'Failed to create event' });
      throw err; // Throw so UI can catch it
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompetition: async (competitionId, eventData) => {
    set({ isLoading: true, error: null });
    try {
      await updateDoc(doc(db, 'posts', competitionId), eventData);
      // Local state update handled by onSnapshot
    } catch (err: any) {
      set({ error: err.message || 'Failed to update event' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyCompetitions: (organizerId) => {
    const { competitionsUnsubscribe } = get();
    if (competitionsUnsubscribe) return;

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', organizerId),
        where('type', '==', 'event')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comps: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          comps.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            eventDate: data.eventDate?.toMillis ? data.eventDate.toMillis() : data.eventDate,
            registrationStartDate: data.registrationStartDate?.toMillis ? data.registrationStartDate.toMillis() : data.registrationStartDate,
            registrationEndDate: data.registrationEndDate?.toMillis ? data.registrationEndDate.toMillis() : data.registrationEndDate
          } as Post);
        });

        // Sort locally to avoid needing immediate Firestore composite indexes
        comps.sort((a, b) => b.createdAt - a.createdAt);

        set({ myCompetitions: comps, isLoading: false });
      }, (err) => {
        set({ error: err.message || 'Failed to fetch events', isLoading: false });
      });

      set({ competitionsUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch events', isLoading: false });
    }
  },

  deleteCompetition: async (competitionId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'posts', competitionId));
      // Local state update handled by onSnapshot
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete event' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
