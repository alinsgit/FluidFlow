/**
 * useProjectGit Hook
 *
 * Handles Git operations: init, commit, refresh status.
 * Extracted from useProject for better separation of concerns.
 */

import { useCallback } from 'react';
import { projectApi, gitApi, ProjectMeta, GitStatus } from '@/services/projectApi';
import type { FileSystem } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface UseProjectGitOptions {
  /** Get current project */
  getCurrentProject: () => ProjectMeta | null;
  /** Get current files */
  getFiles: () => FileSystem;
  /** Get current git status */
  getGitStatus: () => GitStatus | null;
  /** Callback to update state */
  updateState: (updater: (prev: ProjectGitState) => Partial<ProjectGitState>) => void;
}

export interface ProjectGitState {
  gitStatus: GitStatus | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

export interface UseProjectGitReturn {
  /** Initialize git repository */
  initGit: (force?: boolean, filesToSync?: FileSystem) => Promise<boolean>;
  /** Create a commit */
  commit: (message: string, filesToCommit?: FileSystem) => Promise<boolean>;
  /** Refresh git status */
  refreshGitStatus: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProjectGit(options: UseProjectGitOptions): UseProjectGitReturn {
  const { getCurrentProject, getFiles, getGitStatus, updateState } = options;

  /**
   * Initialize git repository
   * force=true will delete and reinitialize corrupted repos
   * filesToSync: current working files to sync before init
   */
  const initGit = useCallback(
    async (force = false, filesToSync?: FileSystem): Promise<boolean> => {
      const currentProject = getCurrentProject();
      console.log('[ProjectGit] initGit called with force:', force);

      if (!currentProject) {
        console.warn('[ProjectGit] initGit failed - no current project');
        return false;
      }

      const files = filesToSync || getFiles();
      const fileCount = Object.keys(files).length;

      if (fileCount === 0) {
        console.warn('[ProjectGit] Cannot init git with empty files');
        updateState(() => ({ error: 'Cannot initialize: no files' }));
        return false;
      }

      updateState(() => ({ error: null, isSyncing: true }));

      try {
        // Step 1: Sync files to backend first (force=true to bypass confirmation)
        console.log('[ProjectGit] initGit - syncing', fileCount, 'files first...');
        const syncResponse = await projectApi.update(currentProject.id, { files, force: true });
        if (syncResponse.blocked) {
          console.error('[ProjectGit] Sync blocked before git init:', syncResponse.warning);
          updateState(() => ({ isSyncing: false, error: 'Sync blocked: ' + syncResponse.warning }));
          return false;
        }
        console.log('[ProjectGit] initGit - files synced');

        // Step 2: Initialize git (force=true for corrupted repos)
        console.log('[ProjectGit] initGit - calling gitApi.init...');
        await gitApi.init(currentProject.id, force);
        console.log('[ProjectGit] initGit - git initialized successfully');

        // Step 3: Refresh status - gitStatus.initialized will now be true
        console.log('[ProjectGit] initGit - refreshing git status...');
        const gitStatus = await gitApi.status(currentProject.id);
        console.log('[ProjectGit] initGit - got status:', gitStatus);

        updateState(() => ({
          gitStatus,
          isSyncing: false,
          lastSyncedAt: Date.now(),
        }));

        return true;
      } catch (_err) {
        console.error('[ProjectGit] initGit failed:', _err);
        updateState(() => ({ isSyncing: false, error: 'Failed to initialize git' }));
        return false;
      }
    },
    [getCurrentProject, getFiles, updateState]
  );

  /**
   * Create commit - syncs files to backend first, then commits
   * This is the ONLY time files are synced to backend (git-centric approach)
   */
  const commit = useCallback(
    async (message: string, filesToCommit?: FileSystem): Promise<boolean> => {
      const currentProject = getCurrentProject();
      const gitStatus = getGitStatus();

      if (!currentProject || !gitStatus?.initialized) return false;

      const files = filesToCommit || getFiles();
      const fileCount = Object.keys(files).length;

      if (fileCount === 0) {
        console.warn('[ProjectGit] Cannot commit empty files');
        updateState(() => ({ error: 'Cannot commit: no files' }));
        return false;
      }

      updateState(() => ({ error: null, isSyncing: true }));

      try {
        console.log('[ProjectGit] Committing', fileCount, 'files...');

        // Step 1: Sync files to backend (force=true to bypass confirmation)
        const syncResponse = await projectApi.update(currentProject.id, { files, force: true });
        if (syncResponse.blocked) {
          console.error('[ProjectGit] Sync blocked before commit:', syncResponse.warning);
          updateState(() => ({ isSyncing: false, error: 'Sync blocked: ' + syncResponse.warning }));
          return false;
        }
        console.log('[ProjectGit] Files synced to backend');

        // Step 2: Git commit
        await gitApi.commit(currentProject.id, message, files);
        console.log('[ProjectGit] Git commit created');

        // Step 3: Refresh status
        const newGitStatus = await gitApi.status(currentProject.id);
        updateState(() => ({
          gitStatus: newGitStatus,
          isSyncing: false,
          lastSyncedAt: Date.now(),
        }));

        console.log('[ProjectGit] Commit complete!');
        return true;
      } catch (_err) {
        console.error('[ProjectGit] Commit failed:', _err);
        updateState(() => ({ isSyncing: false, error: 'Failed to create commit' }));
        return false;
      }
    },
    [getCurrentProject, getFiles, getGitStatus, updateState]
  );

  /**
   * Refresh git status - this is the single source of truth for git state
   */
  const refreshGitStatus = useCallback(async () => {
    const currentProject = getCurrentProject();
    if (!currentProject) return;

    try {
      const gitStatus = await gitApi.status(currentProject.id);
      console.log('[ProjectGit] Git status response:', gitStatus);

      updateState(() => ({
        gitStatus,
      }));
    } catch (_err) {
      console.error('[ProjectGit] Failed to refresh git status:', _err);
      // On error, keep current gitStatus - do not reset to null
    }
  }, [getCurrentProject, updateState]);

  return {
    initGit,
    commit,
    refreshGitStatus,
  };
}
