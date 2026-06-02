import { create } from 'zustand';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { UserProfile } from './userStore';
import { Post } from './feedStore';

export interface SupportTicket {
  uid: string;
  userName: string;
  status: 'open' | 'closed';
  updatedAt: number;
}

interface AdminStore {
  organizers: UserProfile[];
  events: Post[];
  supportTickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;
  organizersUnsubscribe: (() => void) | null;
  eventsUnsubscribe: (() => void) | null;
  supportTicketsUnsubscribe: (() => void) | null;

  fetchOrganizers: () => void;
  fetchEvents: () => void;
  fetchSupportTickets: () => void;
  updateOrganizerStatus: (userId: string, status: 'verified' | 'rejected') => Promise<void>;
  updateEventStatus: (postId: string, status: 'approved' | 'rejected') => Promise<void>;
  deleteOrganizer: (userId: string) => Promise<void>;
  deleteEvent: (postId: string) => Promise<void>;
  cleanup: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  organizers: [],
  events: [],
  supportTickets: [],
  isLoading: false,
  error: null,
  organizersUnsubscribe: null,
  eventsUnsubscribe: null,
  supportTicketsUnsubscribe: null,

  cleanup: () => {
    const { organizersUnsubscribe, eventsUnsubscribe, supportTicketsUnsubscribe } = get();
    if (organizersUnsubscribe) organizersUnsubscribe();
    if (eventsUnsubscribe) eventsUnsubscribe();
    if (supportTicketsUnsubscribe) supportTicketsUnsubscribe();
    set({ organizersUnsubscribe: null, eventsUnsubscribe: null, supportTicketsUnsubscribe: null });
  },

  fetchOrganizers: () => {
    const { organizersUnsubscribe } = get();
    if (organizersUnsubscribe) return;

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'organizer')
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const orgs = snap.docs.map(d => d.data() as UserProfile);
        // Sort: pending first
        orgs.sort((a, b) => {
          if (a.verificationStatus === 'pending' && b.verificationStatus !== 'pending') return -1;
          if (a.verificationStatus !== 'pending' && b.verificationStatus === 'pending') return 1;
          return 0;
        });
        set({ organizers: orgs, isLoading: false });
      }, (err) => {
        set({ error: err.message || 'Failed to fetch organizers', isLoading: false });
      });
      set({ organizersUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch organizers', isLoading: false });
    }
  },

  fetchEvents: () => {
    const { eventsUnsubscribe } = get();
    if (eventsUnsubscribe) return;

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'posts'),
        where('type', 'in', ['event', 'article'])
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const events = snap.docs.map(d => {
          const data = d.data();
          return { 
            id: d.id, 
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
            eventDate: data.eventDate?.toMillis ? data.eventDate.toMillis() : data.eventDate,
            registrationStartDate: data.registrationStartDate?.toMillis ? data.registrationStartDate.toMillis() : data.registrationStartDate,
            registrationEndDate: data.registrationEndDate?.toMillis ? data.registrationEndDate.toMillis() : data.registrationEndDate
          } as Post;
        });
        // Sort: pending first, then newest
        events.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.createdAt - a.createdAt;
        });
        set({ events: events, isLoading: false });
      }, (err) => {
        set({ error: err.message || 'Failed to fetch events', isLoading: false });
      });
      set({ eventsUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch events', isLoading: false });
    }
  },

  fetchSupportTickets: () => {
    const { supportTicketsUnsubscribe } = get();
    if (supportTicketsUnsubscribe) return;

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'supportTickets'),
        where('status', '==', 'open')
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const tickets = snap.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
          } as SupportTicket;
        });
        
        // Sort newest tickets first
        tickets.sort((a, b) => b.updatedAt - a.updatedAt);
        
        set({ supportTickets: tickets, isLoading: false });
      }, (err) => {
        set({ error: err.message || 'Failed to fetch support tickets', isLoading: false });
      });
      set({ supportTicketsUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch support tickets', isLoading: false });
    }
  },

  updateOrganizerStatus: async (userId, status) => {
    try {
      await updateDoc(doc(db, 'users', userId), { verificationStatus: status });
      
      // NOTIFICATION TRIGGER
      if (status === 'verified') {
        const { useNotificationStore } = await import('./notificationStore');
        await useNotificationStore.getState().createDirectNotification(
          userId,
          "Organizer Account Verified",
          "Your organizer account has been successfully verified. You can now publish and manage events.",
          "verification"
        );
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update organizer' });
    }
  },

  deleteOrganizer: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete organizer' });
    }
  },

  updateEventStatus: async (postId, status) => {
    try {
      await updateDoc(doc(db, 'posts', postId), { status });
      
      // NOTIFICATION TRIGGER
      const event = get().events.find(e => e.id === postId);
      if (event && event.authorId) {
        const { useNotificationStore } = await import('./notificationStore');
        const title = status === 'approved' ? 'Event Approved' : 'Event Rejected';
        const body = status === 'approved' 
          ? `Your event '${event.title}' has been approved and is now visible to students.` 
          : `Your event '${event.title}' was rejected. Please review and resubmit.`;
          
        await useNotificationStore.getState().createDirectNotification(
          event.authorId,
          title,
          body,
          status === 'approved' ? 'event_approval' : 'rejection',
          postId
        );
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update event' });
    }
  },

  deleteEvent: async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete event' });
    }
  },
}));
