import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  onSnapshot,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import axios from 'axios';
import { NEWSAPI_BASE_URL, NEWSAPI_KEY } from '../config/api';

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  pdfUrl?: string;
  websiteUrl?: string;
  author: string;
  authorId: string;
  branch: string;
  tags: string[];
  likes: string[];
  comments: number;
  createdAt: number;
  type: 'event' | 'article' | 'announcement' | 'news';
  eventDate?: number;
  eventLocation?: string;
  registrationOpen?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  participantLimit?: number;
  rules?: string;
  category?: string;
  eventStatus?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registeredCount?: number;
  registrationStartDate?: number;
  registrationEndDate?: number;
  // Article Specific Fields
  readTime?: number;
  updatedAt?: number;
  published?: boolean;
  featured?: boolean;
  registrationConfig?: {
    requiresStudentId?: boolean;
    requiresResume?: boolean;
    requiresIeeeProof?: boolean;
    customQuestions?: string[];
    isTeamEvent?: boolean;
    maxTeamSize?: number;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: string;
  category: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: number;
}

interface FeedStore {
  posts: Post[];
  news: NewsItem[];
  comments: Record<string, Comment[]>;
  isLoading: boolean;
  error: string | null;
  userInterests: string[];

  fetchPosts: (interests?: string[]) => Promise<void>;
  fetchIEEENews: (topic?: string) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  createPost: (post: Omit<Post, 'id'>) => Promise<string>;
  deletePost: (postId: string) => Promise<void>;
  seedDatabase: () => Promise<void>;
  fetchComments: (postId: string) => () => void;
  addComment: (postId: string, text: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  clearError: () => void;
  postsUnsubscribe: (() => void) | null;
  cleanup: () => void;
}

// Mock posts for when Firebase isn't connected
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'IEEE AI Workshop 2026 - Registration Open!',
    summary: 'Join us for an intensive two-day workshop on Machine Learning and AI applications in engineering.',
    content: 'The IEEE Computer Society is proud to announce our flagship AI Workshop 2026. This two-day intensive program will cover the latest advances in machine learning, neural networks, and practical AI applications.',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    author: 'IEEE SLIIT Branch',
    authorId: 'admin',
    branch: 'sliit',
    tags: ['AI', 'Machine Learning', 'Workshop'],
    likes: [],
    comments: 0,
    createdAt: Date.now() - 86400000,
    type: 'event',
    eventDate: Date.now() + 7 * 86400000,
    eventLocation: 'SLIIT Campus, Malabe',
    registrationOpen: true,
  },
  {
    id: '2',
    title: 'Breakthrough in Quantum Computing Research',
    summary: 'Researchers at MIT achieve a major milestone in quantum error correction that could revolutionize computing.',
    content: 'In a landmark achievement for quantum computing, researchers have demonstrated a 99.9% fidelity in qubit operations, bringing practical quantum computers one step closer to reality.',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    author: 'IEEE Tech Digest',
    authorId: 'digest',
    branch: 'all',
    tags: ['Quantum Computing', 'Research', 'Innovation'],
    likes: [],
    comments: 0,
    createdAt: Date.now() - 3600000 * 3,
    type: 'article',
  },
  {
    id: '3',
    title: 'CompConnect Hackathon 2026 — Win LKR 500,000!',
    summary: '48-hour hackathon open to all IEEE student members. Build solutions for real-world engineering challenges.',
    content: 'IEEE CompConnect is hosting its annual 48-hour hackathon. Teams of 2-4 members will tackle real-world challenges in areas of Smart Cities, Healthcare Technology, and Sustainable Energy.',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    author: 'IEEE Moratuwa',
    authorId: 'admin_mrt',
    branch: 'mrt',
    tags: ['Hackathon', 'Competition', 'Networking'],
    likes: [],
    comments: 0,
    createdAt: Date.now() - 86400000 * 2,
    type: 'event',
    eventDate: Date.now() + 14 * 86400000,
    eventLocation: 'University of Moratuwa',
    registrationOpen: true,
  },
  {
    id: '4',
    title: 'Cybersecurity Seminar: Defending AI Systems',
    summary: 'An expert panel discusses the growing threat of adversarial attacks on machine learning models.',
    content: 'As AI systems become more pervasive, securing them against adversarial attacks becomes critical. Join our panel of experts for a deep dive into AI security.',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    author: 'IEEE Colombo Branch',
    authorId: 'admin_cmb',
    branch: 'cmb',
    tags: ['Cybersecurity', 'AI', 'Seminar'],
    likes: [],
    comments: 0,
    createdAt: Date.now() - 86400000 * 3,
    type: 'event',
    eventDate: Date.now() + 3 * 86400000,
    eventLocation: 'Online (Zoom)',
    registrationOpen: true,
  },
  {
    id: '5',
    title: 'IEEE R10 Award: Sri Lanka Branches Excel',
    summary: 'Multiple Sri Lankan IEEE branches recognized for outstanding student activities and community impact.',
    content: 'The IEEE Region 10 has recognized several Sri Lankan branches for their exceptional performance in student activities, technical programs, and community engagement.',
    imageUrl: 'https://images.unsplash.com/photo-1559024094-4a1e4495c3c1?w=800',
    author: 'IEEE Sri Lanka Section',
    authorId: 'sl_section',
    branch: 'all',
    tags: ['Award', 'Achievement', 'IEEE Region 10'],
    likes: [],
    comments: 0,
    createdAt: Date.now() - 86400000 * 5,
    type: 'announcement',
  },
];

const MOCK_NEWS: NewsItem[] = [
  {
    id: 'mock-news-1',
    title: 'IEEE Announces Global Expansion of Quantum Computing Initiatives',
    description: 'IEEE launches a comprehensive program to accelerate research and standardization in quantum computing globally.',
    url: 'https://ieee.org',
    urlToImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'IEEE Spectrum',
    category: 'technology',
  },
  {
    id: 'mock-news-2',
    title: 'New Advancements in AI Ethics Standards',
    description: 'The IEEE Standards Association has published a new framework for evaluating the ethical implications of autonomous systems.',
    url: 'https://ieee.org',
    urlToImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    source: 'IEEE News',
    category: 'technology',
  },
];

export const useFeedStore = create<FeedStore>()(
  persist(
    (set, get) => ({
      posts: MOCK_POSTS,
  news: [],
  comments: {},
  isLoading: false,
  error: null,
  userInterests: [],
  postsUnsubscribe: null,

  cleanup: () => {
    const { postsUnsubscribe } = get();
    if (postsUnsubscribe) postsUnsubscribe();
    set({ postsUnsubscribe: null });
  },

  fetchPosts: (interests = []) => {
    return new Promise<void>((resolve, reject) => {
      const { postsUnsubscribe } = get();
      if (postsUnsubscribe) postsUnsubscribe();

      set({ isLoading: true, error: null });
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(50));
        
        let isFirstFetch = true;
        const unsubscribe = onSnapshot(q, (snap) => {
          if (snap.empty) {
            // Seed the database with mock data if it's completely empty
            console.log('Firestore is empty. Seeding database with initial data...');
            get().seedDatabase();
            if (isFirstFetch) {
              isFirstFetch = false;
              resolve();
            }
          } else {
            let fetchedPosts = snap.docs.map((d) => {
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
            // Filter out pending and rejected events
            fetchedPosts = fetchedPosts.filter((p) => p.status !== 'pending' && p.status !== 'rejected');
            set({ posts: fetchedPosts, isLoading: false });
            
            if (isFirstFetch) {
              isFirstFetch = false;
              resolve();
            }
          }
        }, (err) => {
          console.error("Feed error:", err);
          set({ error: err.message, isLoading: false });
          if (isFirstFetch) {
            isFirstFetch = false;
            reject(err);
          }
        });

        set({ postsUnsubscribe: unsubscribe });
      } catch (err: any) {
        console.error(err);
        set({ error: err.message, isLoading: false });
        reject(err);
      }
    });
  },

  fetchIEEENews: async (topic = 'IEEE technology') => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${NEWSAPI_BASE_URL}/everything`, {
        params: {
          q: topic,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10,
          apiKey: NEWSAPI_KEY,
        },
      });
      const articles = response.data.articles.map((a: any, i: number) => ({
        id: `news-${i}`,
        title: a.title,
        description: a.description || '',
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        source: a.source?.name || 'Unknown',
        category: topic,
      }));
      set({ news: articles });
    } catch (err) {
      console.log('NewsAPI unavailable, using mock data');
      set({ news: MOCK_NEWS });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLike: async (postId, userId) => {
    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.likes.includes(userId);
    const updatedPosts = posts.map((p) =>
      p.id === postId
        ? { ...p, likes: liked ? p.likes.filter((id) => id !== userId) : [...p.likes, userId] }
        : p
    );
    set({ posts: updatedPosts });
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: liked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (err) {
      console.log('Firestore like update skipped (demo mode)');
    }
  },

  createPost: async (postData) => {
    try {
      const ref = await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: Timestamp.now(),
      });
      return ref.id;
    } catch (err) {
      console.error('Failed to create post', err);
      return `local-${Date.now()}`;
    }
  },

  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      
      // Update local state to remove the post immediately
      const { posts } = get();
      set({ posts: posts.filter(p => p.id !== postId) });
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      throw new Error(err.message || 'Failed to delete post');
    }
  },

  seedDatabase: async () => {
    set({ isLoading: true });
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      MOCK_POSTS.forEach(post => {
        const ref = doc(db, 'posts', post.id);
        batch.set(ref, post);
      });
      
      await batch.commit();
      console.log('Database seeded successfully!');
    } catch (err) {
      console.error('Failed to seed database:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchComments: (postId) => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
      const fetchedComments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
      set((state) => ({
        comments: { ...state.comments, [postId]: fetchedComments },
      }));
    }, (err) => {
      console.error("Comments error:", err);
    });
  },

  addComment: async (postId, text) => {
    try {
      const { useUserStore } = await import('./userStore');
      const { user, profile } = useUserStore.getState();
      
      // If profile not loaded yet, wait a moment for it to load
      if (!user || !profile) {
        // Retry after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const { user: retryUser, profile: retryProfile } = useUserStore.getState();
        if (!retryUser || !retryProfile) {
          throw new Error("Please wait for profile to load before posting comments.");
        }
      }

      const { user: finalUser, profile: finalProfile } = useUserStore.getState();
      
      // We don't optimistically update here because the onSnapshot will catch it immediately
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        postId,
        userId: finalUser!.uid,
        userName: finalProfile!.displayName || 'User',
        text,
        createdAt: Date.now(),
      });
      
      // Also increment the comment count on the post document
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      console.error("Failed to add comment:", errorMessage);
      set({ error: errorMessage });
    }
  },

  deleteComment: async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      
      // Decrement the comment count
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(-1)
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      console.error("Failed to delete comment:", errorMessage);
      set({ error: errorMessage });
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: 'feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ posts: state.posts, news: state.news }),
    }
  )
);
