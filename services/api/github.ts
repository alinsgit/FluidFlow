/**
 * GitHub API
 *
 * API client for GitHub operations.
 */

import { apiCall } from './client';
import type { ProjectMeta, GitHubUser, GitHubRepo, GitRemote } from './types';

export const githubApi = {
  /**
   * Verify GitHub token
   */
  verifyToken: (token: string) =>
    apiCall<{ valid: boolean; user?: GitHubUser; error?: string }>('/github/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  /**
   * Clone a repository
   */
  clone: (url: string, name?: string) =>
    apiCall<{ message: string; project: ProjectMeta }>('/github/clone', {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    }),

  /**
   * Set remote origin
   */
  setRemote: (projectId: string, url: string, name = 'origin') =>
    apiCall<{ message: string }>(`/github/${projectId}/remote`, {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    }),

  /**
   * Get remotes
   */
  getRemotes: (projectId: string) =>
    apiCall<{ initialized: boolean; remotes: GitRemote[] }>(`/github/${projectId}/remote`),

  /**
   * Push to remote
   */
  push: (projectId: string, options?: { remote?: string; branch?: string; force?: boolean }) =>
    apiCall<{ message: string; remote: string; branch: string }>(`/github/${projectId}/push`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),

  /**
   * Pull from remote
   */
  pull: (projectId: string, options?: { remote?: string; branch?: string }) =>
    apiCall<{ message: string; summary: Record<string, unknown> }>(`/github/${projectId}/pull`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),

  /**
   * Fetch from remote
   */
  fetch: (projectId: string, options?: { remote?: string; prune?: boolean }) =>
    apiCall<{ message: string }>(`/github/${projectId}/fetch`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),

  /**
   * Create a GitHub repository
   */
  createRepo: (projectId: string, token: string, options?: { name?: string; description?: string; isPrivate?: boolean }) =>
    apiCall<{ message: string; repository: GitHubRepo }>(`/github/${projectId}/create-repo`, {
      method: 'POST',
      body: JSON.stringify({ token, ...options }),
    }),
};
