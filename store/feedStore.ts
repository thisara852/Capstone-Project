import { create } from 'zustand';
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
} from 'firebase/firestore';
import axios from 'axios';
import { NEWSAPI_BASE_URL, NEWSAPI_KEY } from '../config/api';

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
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

interface FeedStore {
  posts: Post[];
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  userInterests: string[];

  fetchPosts: (interests?: string[]) => Promise<void>;
  fetchIEEENews: (topic?: string) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  createPost: (post: Omit<Post, 'id'>) => Promise<string>;
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
    comments: 14,
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
    comments: 32,
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
    comments: 56,
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
    comments: 8,
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
    comments: 41,
    createdAt: Date.now() - 86400000 * 5,
    type: 'announcement',
  },
];

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: MOCK_POSTS,
  news: [],
  isLoading: false,
  error: null,
  userInterests: [],

  fetchPosts: async (interests = []) => {
    set({ isLoading: true, error: null });
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Use mock data if no Firestore data
        set({ posts: MOCK_POSTS });
      } else {
        const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        set({ posts });
      }
    } catch (err) {
      // Fallback to mock data
      set({ posts: MOCK_POSTS });
    } finally {
      set({ isLoading: false });
    }
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
}));
