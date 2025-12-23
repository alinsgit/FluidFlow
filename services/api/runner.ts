/**
 * Runner API
 *
 * API client for project runner operations (npm install, npm run dev, etc.)
 */

import { apiCall } from './client';
import type { RunningProjectInfo } from './types';

export const runnerApi = {
  /**
   * List all running projects
   */
  list: () => apiCall<RunningProjectInfo[]>('/runner'),

  /**
   * Get status of a specific project
   */
  status: (projectId: string) => apiCall<RunningProjectInfo>(`/runner/${projectId}`),

  /**
   * Start a project (npm install + npm run dev)
   * @param projectId - Project ID or '_temp' for uncommitted VFS runs
   * @param files - Optional VFS files to sync to disk before running
   */
  start: (projectId: string, files?: Record<string, string>) =>
    apiCall<{ message: string; port: number; url: string; status: string }>(`/runner/${projectId}/start`, {
      method: 'POST',
      body: files ? JSON.stringify({ files }) : undefined,
    }),

  /**
   * Stop a running project
   */
  stop: (projectId: string) =>
    apiCall<{ message: string; status: string }>(`/runner/${projectId}/stop`, {
      method: 'POST',
    }),

  /**
   * Get logs for a running project
   */
  logs: (projectId: string, since?: number) =>
    apiCall<{ logs: string[]; errorLogs: string[]; status: string; totalLogs: number }>(
      `/runner/${projectId}/logs${since ? `?since=${since}` : ''}`
    ),

  /**
   * Stop all running projects
   */
  stopAll: () =>
    apiCall<{ message: string; stopped: string[] }>('/runner/stop-all', {
      method: 'POST',
    }),

  /**
   * Cleanup orphan processes on runner ports
   */
  cleanup: () =>
    apiCall<{ message: string }>('/runner/cleanup', {
      method: 'POST',
    }),
};
