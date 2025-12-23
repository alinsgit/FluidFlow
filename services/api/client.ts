/**
 * API Client
 *
 * Base API client with helper functions for making API calls.
 */

// Use relative URL - Vite proxies /api to backend (avoids mixed content with HTTPS frontend)
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic API call helper with error handling
 */
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.details || 'API request failed');
  }

  return data;
}

/**
 * Check if the backend server is online
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
