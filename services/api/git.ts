/**
 * Git API
 *
 * API client for Git operations.
 */

import { apiCall } from './client';
import type { GitStatus, GitCommit, CommitDetails } from './types';

export const gitApi = {
  /**
   * Initialize git in a project
   * @param projectId - The project ID
   * @param force - If true, delete existing .git and reinitialize (for corrupted repos)
   */
  init: (projectId: string, force = false) =>
    apiCall<{ message: string; initialized: boolean }>(`/git/${projectId}/init`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  /**
   * Get git status
   */
  status: (projectId: string) => apiCall<GitStatus>(`/git/${projectId}/status`),

  /**
   * Get commit log
   */
  log: (projectId: string, limit = 20) =>
    apiCall<{ initialized: boolean; commits: GitCommit[] }>(`/git/${projectId}/log?limit=${limit}`),

  /**
   * Create a commit
   */
  commit: (projectId: string, message: string, files?: Record<string, string>) =>
    apiCall<{ message: string; commit?: { hash: string; summary: Record<string, unknown> }; clean?: boolean }>(`/git/${projectId}/commit`, {
      method: 'POST',
      body: JSON.stringify({ message, files }),
    }),

  /**
   * Get diff
   */
  diff: (projectId: string, cached = false) =>
    apiCall<{ diff: string }>(`/git/${projectId}/diff?cached=${cached}`),

  /**
   * Checkout to a commit
   */
  checkout: (projectId: string, commit: string) =>
    apiCall<{ message: string }>(`/git/${projectId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ commit }),
    }),

  /**
   * Create a branch
   */
  createBranch: (projectId: string, name: string, checkout = true) =>
    apiCall<{ message: string; checkout: boolean }>(`/git/${projectId}/branch`, {
      method: 'POST',
      body: JSON.stringify({ name, checkout }),
    }),

  /**
   * List branches
   */
  branches: (projectId: string) =>
    apiCall<{ initialized: boolean; current?: string; branches: string[] }>(`/git/${projectId}/branches`),

  /**
   * Get commit details (changed files, stats)
   */
  commitDetails: (projectId: string, hash: string) =>
    apiCall<CommitDetails>(`/git/${projectId}/commit/${hash}`),

  /**
   * Get diff for a specific commit
   */
  commitDiff: (projectId: string, hash: string, file?: string) =>
    apiCall<{ diff: string; hash: string; file: string | null }>(
      `/git/${projectId}/commit/${hash}/diff${file ? `?file=${encodeURIComponent(file)}` : ''}`
    ),

  /**
   * Get file content at specific commit
   */
  fileAtCommit: (projectId: string, hash: string, filePath: string) =>
    apiCall<{ content: string | null; path: string; hash: string; notFound?: boolean }>(
      `/git/${projectId}/commit/${hash}/file?path=${encodeURIComponent(filePath)}`
    ),
};
