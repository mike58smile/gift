import { ProcessedPost } from '../types';

// ============================================================
// SHARED IN-MEMORY STORE (simulates a web service/database)
// This global store is shared across all users accessing the site
// In a production app, this would be replaced with a real backend API
// ============================================================

// Declare global store on window object for persistence across module reloads
declare global {
  interface Window {
    __SHARED_POSTS_STORE__: Record<string, ProcessedPost>;
  }
}

// Initialize the shared store if it doesn't exist
if (typeof window !== 'undefined' && !window.__SHARED_POSTS_STORE__) {
  window.__SHARED_POSTS_STORE__ = {};
}

// Get the shared store
const getSharedStore = (): Record<string, ProcessedPost> => {
  if (typeof window !== 'undefined') {
    return window.__SHARED_POSTS_STORE__;
  }
  return {};
};

// ============================================================
// PUBLIC API - These functions work with the shared store
// ============================================================

export const savePost = (post: ProcessedPost): void => {
  try {
    const store = getSharedStore();
    store[post.id] = post;
    console.log(`[SharedStore] Post saved with ID: ${post.id}`);
    console.log(`[SharedStore] Total posts in store: ${Object.keys(store).length}`);
  } catch (e) {
    console.error("Failed to save post to shared store", e);
  }
};

export const getPost = (id: string): ProcessedPost | null => {
  try {
    const store = getSharedStore();
    const post = store[id] || null;
    console.log(`[SharedStore] Fetching post ID: ${id}, Found: ${post !== null}`);
    return post;
  } catch (e) {
    console.error("Failed to load post from shared store", e);
    return null;
  }
};

export const getAllPosts = (): ProcessedPost[] => {
  try {
    const store = getSharedStore();
    return Object.values(store);
  } catch (e) {
    console.error("Failed to get all posts", e);
    return [];
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};
