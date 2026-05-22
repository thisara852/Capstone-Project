// Firebase configuration using hard-coded values (provided by user)
import { initializeApp, getApps } from 'firebase/app';
import { Platform } from 'react-native';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AI123123131231aSyA2CCjZknuE0hp112313212312K8LVm1Crvf-FgQwV6Y",
  authDomain: "ieeecompconnect.firebaseapp.com",
  projectId: "ieeecompconnect",
  storageBucket: "ieeecompconnect.firebasestorage.app",
  messagingSenderId: "434701516497",
  appId: "1:434701516497:web:ca459beff84cafaf6bcff0",
  measurementId: "G-C5Y4J0KYWD",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Import getAnalytics lazily only in the browser (web environment)
let analytics;
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn('Firebase Analytics initialization failed:', e);
  }
}

// Initialize Auth with platform-specific persistence
export const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };
export default app;
