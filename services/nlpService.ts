import axios from 'axios';
import { HUGGINGFACE_API_URL, HUGGINGFACE_API_KEY } from '../config/api';
import { Post } from '../store/feedStore';

// NLP Service using HuggingFace Inference API
// Falls back to keyword-based matching when API is unavailable

/**
 * Score a post based on user interests using keyword matching
 * (lightweight, works without API)
 */
function keywordScore(post: Post, interests: string[]): number {
  if (!interests.length) return 0;
  let score = 0;
  const text = `${post.title} ${post.summary} ${post.tags.join(' ')}`.toLowerCase();
  interests.forEach((interest) => {
    if (text.includes(interest.toLowerCase())) score += 1;
    post.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(interest.toLowerCase())) score += 0.5;
    });
  });
  return score;
}

/**
 * Classify text into IEEE topic categories using zero-shot classification
 */
export async function classifyText(text: string, candidateLabels: string[]): Promise<{ labels: string[]; scores: number[] }> {
  try {
    const response = await axios.post(
      `${HUGGINGFACE_API_URL}/facebook/bart-large-mnli`,
      {
        inputs: text,
        parameters: { candidate_labels: candidateLabels },
      },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (err) {
    // Return equal scores as fallback
    const score = 1 / candidateLabels.length;
    return {
      labels: candidateLabels,
      scores: candidateLabels.map(() => score),
    };
  }
}

/**
 * Get personalized feed ranked by user interests
 */
export function rankPostsByInterests(posts: Post[], interests: string[]): Post[] {
  if (!interests.length) return posts;
  const scored = posts.map((post) => ({
    post,
    score: keywordScore(post, interests),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.post);
}

/**
 * Extract keywords from user queries for smarter search
 */
export function extractSearchKeywords(query: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'is', 'are', 'for', 'and', 'or', 'of', 'to', 'with', 'about']);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Summarize a long text to a short description (simple extractive)
 */
export function summarizeText(text: string, maxWords = 30): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

/**
 * Get smart search suggestions based on input
 */
export function getSearchSuggestions(query: string, topics: string[]): string[] {
  if (!query.trim()) return topics.slice(0, 5);
  const lower = query.toLowerCase();
  return topics.filter((t) => t.toLowerCase().includes(lower)).slice(0, 6);
}
