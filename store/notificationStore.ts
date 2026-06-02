import { create } from 'zustand';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { useUserStore } from './userStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically require expo-notifications to prevent Expo Go SDK 53+ crashes
let Notifications: any = null;
try {
  if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
    
    // Configure how notifications appear when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn('Expo Go does not support custom push notifications in SDK 53+. Falling back to in-app notifications only.');
  Notifications = null;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'announcement' | 'approval' | 'verification' | 'rejection' | 'event_approval';
  relatedEventId?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
  notificationsUnsubscribe: (() => void) | null;
  lastSeenTimestamp: number;

  initializeListeners: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendAnnouncementToAttendees: (eventId: string, title: string, body: string) => Promise<void>;
  createDirectNotification: (userId: string, title: string, body: string, type: AppNotification['type'], relatedEventId?: string) => Promise<void>;
  cleanup: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  initialized: false,
  error: null,
  notificationsUnsubscribe: null,
  lastSeenTimestamp: Date.now(), // Only trigger local push for events after store init

  cleanup: () => {
    const { notificationsUnsubscribe } = get();
    if (notificationsUnsubscribe) notificationsUnsubscribe();
    set({ 
      notificationsUnsubscribe: null, 
      notifications: [], 
      unreadCount: 0, 
      initialized: false, 
      error: null 
    });
  },

  initializeListeners: async () => {
    const { notificationsUnsubscribe, initialized } = get();
    if (initialized) return; // Prevent duplicate listeners
    if (notificationsUnsubscribe) notificationsUnsubscribe();

    const { user } = useUserStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null, initialized: true });
    
    // Request permissions on boot (Wrapped in try/catch for Expo Go SDK 53+ compatibility)
    if (Platform.OS !== 'web' && Notifications) {
      try {
        const permission = await Notifications.getPermissionsAsync();
        let finalStatus = permission.status || (permission.granted ? 'granted' : 'denied');
        if (finalStatus !== 'granted') {
          const newPermission = await Notifications.requestPermissionsAsync();
          finalStatus = newPermission.status || (newPermission.granted ? 'granted' : 'denied');
        }
        
        if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance?.MAX || 5,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (e) {
        console.warn('Push notifications are disabled in Expo Go. Skipping permission requests.');
      }
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = [];
        let unread = 0;
        const currentLastSeen = get().lastSeenTimestamp;

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as AppNotification;
            
            // Trigger local push popup if it's completely new and unread
            if (data.createdAt > currentLastSeen && !data.read) {
              if (Platform.OS !== 'web' && Notifications) {
                try {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: data.title,
                      body: data.body,
                      data: { eventId: data.relatedEventId },
                    },
                    trigger: null, // trigger immediately
                  });
                } catch (e) {
                  // Silently fail in Expo Go
                }
              }
            }
          }
        });

        snapshot.docs.forEach(docSnap => {
          const data = { id: docSnap.id, ...docSnap.data() } as AppNotification;
          notifs.push(data);
          if (!data.read) unread++;
        });

        set({ 
          notifications: notifs, 
          unreadCount: unread, 
          isLoading: false 
        });
      }, (err) => {
        console.error("Notification listener error", err);
        set({ error: err.message, isLoading: false });
      });

      set({ notificationsUnsubscribe: unsubscribe });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  markAllAsRead: async () => {
    const { notifications, unreadCount } = get();
    if (unreadCount === 0) return;

    set({ unreadCount: 0 }); // Optimistic update

    const batch = writeBatch(db);
    let batchCount = 0;

    notifications.forEach((notif) => {
      if (!notif.read) {
        const docRef = doc(db, 'notifications', notif.id);
        batch.update(docRef, { read: true });
        batchCount++;
      }
    });

    if (batchCount > 0) {
      try {
        await batch.commit();
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
      }
    }
  },

  createDirectNotification: async (userId, title, body, type, relatedEventId) => {
    try {
      const newDocRef = doc(collection(db, 'notifications'));
      const newNotification: AppNotification = {
        id: newDocRef.id,
        userId,
        title,
        body,
        type,
        read: false,
        createdAt: Date.now(),
      };
      if (relatedEventId) {
        newNotification.relatedEventId = relatedEventId;
      }
      await setDoc(newDocRef, newNotification);
    } catch (err) {
      console.error("Failed to create direct notification", err);
    }
  },

  sendAnnouncementToAttendees: async (eventId, title, body) => {
    try {
      const { user } = useUserStore.getState();
      if (!user) throw new Error("Must be logged in to send announcement");

      // Query all approved attendees for this event
      const { collectionGroup } = await import('firebase/firestore');
      const regQuery = query(
        collectionGroup(db, 'registrations'),
        where('eventId', '==', eventId),
        where('status', 'in', ['approved', 'checked-in'])
      );
      
      const regSnap = await getDocs(regQuery);
      if (regSnap.empty) return;

      const batch = writeBatch(db);
      
      regSnap.forEach((docSnap) => {
        const attendeeUserId = docSnap.data().userId;
        const notifRef = doc(collection(db, 'notifications'));
        
        batch.set(notifRef, {
          id: notifRef.id,
          userId: attendeeUserId,
          title,
          body,
          type: 'announcement',
          relatedEventId: eventId,
          read: false,
          createdAt: Date.now(),
        });
      });

      await batch.commit();
    } catch (err: any) {
      console.error('Failed to fan out announcement', err);
      throw err;
    }
  }
}));
