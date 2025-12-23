/**
 * Settings API
 *
 * API client for global settings management.
 */

import { apiCall } from './client';
import type { StoredProviderConfig, CustomSnippet, GlobalSettings } from './types';

export const settingsApi = {
  /**
   * Get all settings
   */
  get: () => apiCall<GlobalSettings>('/settings'),

  /**
   * Update settings
   */
  update: (settings: Partial<GlobalSettings>) =>
    apiCall<{ message: string; updatedAt: number }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  /**
   * Get AI providers
   */
  getAIProviders: () =>
    apiCall<{ providers: StoredProviderConfig[]; activeId: string }>('/settings/ai-providers'),

  /**
   * Save AI providers
   */
  saveAIProviders: (providers: StoredProviderConfig[], activeId: string) =>
    apiCall<{ message: string; updatedAt: number }>('/settings/ai-providers', {
      method: 'PUT',
      body: JSON.stringify({ providers, activeId }),
    }),

  /**
   * Get custom snippets
   */
  getSnippets: () => apiCall<CustomSnippet[]>('/settings/snippets'),

  /**
   * Save all snippets
   */
  saveSnippets: (snippets: CustomSnippet[]) =>
    apiCall<{ message: string; updatedAt: number }>('/settings/snippets', {
      method: 'PUT',
      body: JSON.stringify({ snippets }),
    }),

  /**
   * Add a snippet
   */
  addSnippet: (snippet: { name: string; code: string; category?: string }) =>
    apiCall<CustomSnippet>('/settings/snippets', {
      method: 'POST',
      body: JSON.stringify(snippet),
    }),

  /**
   * Delete a snippet
   */
  deleteSnippet: (id: string) =>
    apiCall<{ message: string }>(`/settings/snippets/${id}`, {
      method: 'DELETE',
    }),
};
