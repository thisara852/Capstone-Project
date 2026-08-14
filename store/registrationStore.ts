import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  increment,
  query,
  orderBy,
  runTransaction,
  collectionGroup,
  where
} from 'firebase/firestore';
import { useUserStore } from './userStore';

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked-in';
  registeredAt: number;
  userDisplayName: string;
  userEmail: string;
  userAvatar?: string;
  studentId?: string; // Optional student ID or IEEE number
  userUniversity?: string;
  userBranch?: string;
  participantNumber?: string;
  ticketId?: string; // Alphanumeric unique ticket ID
  attendanceStatus?: 'absent' | 'present';
  eventTitle?: string; // Cache the event title for the My Tickets screen
  fullName?: string;
  phoneNumber?: string;
  university?: string;
  department?: string;
  experienceLevel?: string;
  teamName?: string;
  specialNotes?: string;
  registrationStatus?: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  registrationData?: Record<string, string>;
  uploadedFiles?: {
    studentIdCard?: { url: string; type: string };
    ieeeProof?: { url: string; type: string };
    resume?: { url: string; type: string };
  };
  approvalReason?: string;
  rejectionReason?: string;
}

interface RegistrationStore {
  registrations: Registration[];
  userTickets: Registration[];
  currentRegistration: Registration | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  registrationUnsubscribe: (() => void) | null;
  userTicketsUnsubscribe: (() => void) | null;
  checkRegistrationUnsubscribe: (() => void) | null;

  registerForEvent: (eventId: string, extraData?: Partial<Registration>) => Promise<void>;
  checkRegistrationStatus: (eventId: string, userId: string) => void;
  fetchEventRegistrations: (eventId: string) => void;
  fetchUserTickets: (userId: string) => Promise<void>;
  updateRegistrationStatus: (eventId: string, userId: string, status: Registration['status']) => Promise<void>;
  cleanup: () => void;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set, get) => ({
      registrations: [],
  userTickets: [],
  currentRegistration: null,
  isRegistered: false,
  isLoading: false,
  error: null,
  registrationUnsubscribe: null,
  userTicketsUnsubscribe: null,
  checkRegistrationUnsubscribe: null,

  cleanup: () => {
    const { registrationUnsubscribe, userTicketsUnsubscribe, checkRegistrationUnsubscribe } = get();
    if (registrationUnsubscribe) registrationUnsubscribe();
    if (userTicketsUnsubscribe) userTicketsUnsubscribe();
    if (checkRegistrationUnsubscribe) checkRegistrationUnsubscribe();
    set({ registrationUnsubscribe: null, userTicketsUnsubscribe: null, checkRegistrationUnsubscribe: null, registrations: [], userTickets: [], currentRegistration: null, isRegistered: false, error: null });
  },

  registerForEvent: async (eventId, extraData) => {
    set({ isLoading: true, error: null });
    try {
      const { user, profile } = useUserStore.getState();
      if (!user || !profile) throw new Error("Must be logged in to register");

      const regRef = doc(db, 'posts', eventId, 'registrations', user.uid);
      const regDoc = await getDoc(regRef);
      if (regDoc.exists()) {
        throw new Error("You are already registered for this event.");
      }

      const registration: Registration = {
        id: user.uid,
        userId: user.uid,
        eventId,
        status: 'pending',
        registeredAt: Date.now(),
        userDisplayName: profile.displayName || 'Unknown User',
        userEmail: profile.email || '',
        userAvatar: profile.photoURL || '',
        studentId: extraData?.studentId || '',
        userUniversity: profile.university || 'Not specified',
        userBranch: profile.branch || 'Not specified',
        ...extraData,
      };

      const cleanedRegistration = JSON.parse(JSON.stringify(registration));

      await setDoc(regRef, cleanedRegistration);
      
      // Increment registeredCount on the event document
      const eventRef = doc(db, 'posts', eventId);
      await updateDoc(eventRef, {
        registeredCount: increment(1)
      });

      set({ isRegistered: true });
    } catch (err: any) {
      set({ error: err.message || 'Failed to register' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  checkRegistrationStatus: (eventId, userId) => {
    const { checkRegistrationUnsubscribe } = get();
    if (checkRegistrationUnsubscribe) checkRegistrationUnsubscribe();

    try {
      const regRef = doc(db, 'posts', eventId, 'registrations', userId);
      const unsubscribe = onSnapshot(regRef, (regDoc) => {
        if (regDoc.exists()) {
          set({ isRegistered: true, currentRegistration: { id: regDoc.id, ...regDoc.data() } as Registration });
        } else {
          set({ isRegistered: false, currentRegistration: null });
        }
      });
      set({ checkRegistrationUnsubscribe: unsubscribe });
    } catch (err) {
      console.error("Error checking registration status", err);
    }
  },

  fetchEventRegistrations: (eventId) => {
    const { registrationUnsubscribe } = get();
    if (registrationUnsubscribe) registrationUnsubscribe();

    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'posts', eventId, 'registrations'), orderBy('registeredAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const regs: Registration[] = [];
        snapshot.forEach((doc) => {
          regs.push({ id: doc.id, ...doc.data() } as Registration);
        });
        set({ registrations: regs, isLoading: false });
      }, (err) => {
        set({ error: err.message || 'Failed to fetch registrations', isLoading: false });
      });
      set({ registrationUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch registrations', isLoading: false });
    }
  },

  fetchUserTickets: (userId) => {
    return new Promise<void>((resolve, reject) => {
      set({ isLoading: true, error: null });
      
      // Unsubscribe from any previous listeners
      const { userTicketsUnsubscribe } = get();
      if (userTicketsUnsubscribe) {
        userTicketsUnsubscribe();
      }

      try {
        const q = query(
          collectionGroup(db, 'registrations'),
          where('userId', '==', userId)
        );

        let isFirstFetch = true;
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const tickets: Registration[] = [];
          snapshot.forEach((docSnap) => {
            tickets.push({ id: docSnap.id, ...docSnap.data() } as Registration);
          });
          
          tickets.sort((a, b) => b.registeredAt - a.registeredAt);
          set({ userTickets: tickets, isLoading: false });
          
          if (isFirstFetch) {
            isFirstFetch = false;
            resolve();
          }
        }, (err) => {
          console.error("Tickets listener error:", err);
          set({ error: err.message || 'Failed to fetch tickets', isLoading: false });
          if (isFirstFetch) {
            isFirstFetch = false;
            reject(err);
          }
        });

        set({ userTicketsUnsubscribe: unsubscribe });
      } catch (err: any) {
        console.error("Error fetching tickets:", err);
        set({ error: err.message || 'Failed to fetch tickets', isLoading: false });
        reject(err);
      }
    });
  },

  updateRegistrationStatus: async (eventId, userId, status) => {
    try {
      const regRef = doc(db, 'posts', eventId, 'registrations', userId);
      const eventRef = doc(db, 'posts', eventId);

      if (status === 'approved') {
        // Use a transaction to safely increment the participant number
        await runTransaction(db, async (transaction) => {
          const regDoc = await transaction.get(regRef);
          if (!regDoc.exists()) throw new Error("Registration not found");
          
          const eventDoc = await transaction.get(eventRef);
          if (!eventDoc.exists()) throw new Error("Event not found");

          const regData = regDoc.data() as Registration;
          const eventData = eventDoc.data();

          // If already approved and has a number, just update status
          if (regData.participantNumber) {
            transaction.update(regRef, { status });
            return;
          }

          // Get next incremental number
          const nextNumber = (eventData.lastParticipantNumber || 0) + 1;
          
          // Generate Prefix from Event Title (e.g. "AI Hackathon" -> "AIHA")
          const titleWords = (eventData.title || 'EVNT').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const prefix = titleWords.substring(0, 4).padEnd(4, 'X');
          
          // Format: AIHA-0001
          const participantNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
          
          // Generate a unique alphanumeric Ticket ID (e.g. TK-A9F8B2)
          const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
          const ticketId = `TK-${randomChars}`;

          // Update Event counter
          transaction.update(eventRef, { lastParticipantNumber: nextNumber });

          // Update Registration
          transaction.update(regRef, { 
            status, 
            participantNumber,
            ticketId,
            attendanceStatus: 'absent',
            eventTitle: eventData.title || 'Unknown Event'
          });
        });

        // NOTIFICATION TRIGGER: Send direct approval notification to the student
        try {
          const { useNotificationStore } = await import('./notificationStore');
          const eventDoc = await import('firebase/firestore').then(firestore => firestore.getDoc(eventRef));
          const title = eventDoc.exists() ? eventDoc.data().title : 'an event';
          
          await useNotificationStore.getState().createDirectNotification(
            userId,
            "Ticket Approved",
            `Congratulations! Your ticket for ${title} has been approved.`,
            "approval",
            eventId
          );
        } catch (notifErr) {
          console.error("Failed to send approval notification:", notifErr);
        }

      } else {
        // Just update status for rejected/pending
        await updateDoc(regRef, { status });

        // NOTIFICATION TRIGGER: Send direct rejection notification to the student
        if (status === 'rejected') {
          try {
            const { useNotificationStore } = await import('./notificationStore');
            const eventDoc = await import('firebase/firestore').then(firestore => firestore.getDoc(eventRef));
            const title = eventDoc.exists() ? eventDoc.data().title : 'an event';
            
            await useNotificationStore.getState().createDirectNotification(
              userId,
              "Registration Rejected",
              `Unfortunately, your registration for ${title} was not approved.`,
              "rejection",
              eventId
            );
          } catch (notifErr) {
            console.error("Failed to send rejection notification:", notifErr);
          }
        }
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update status' });
      throw err;
    }
  },
    }),
    {
      name: 'registration-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ userTickets: state.userTickets }),
    }
  )
);
