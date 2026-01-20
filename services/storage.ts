import { ProcessedPost } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const buildUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const savePost = async (post: ProcessedPost): Promise<void> => {
  await parseResponse<{ status: string; id: string }>(
    await fetch(buildUrl('/api/posts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
  );
};

export const getPost = async (id: string): Promise<ProcessedPost | null> => {
  const response = await fetch(buildUrl(`/api/posts/${id}`));
  if (response.status === 404) return null;
  return parseResponse<ProcessedPost>(response);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};
