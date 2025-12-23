/**
 * useProjectSync Hook
 *
 * Handles file sync operations and pending sync confirmations.
 * Extracted from useProject for better separation of concerns.
 */

import { useCallback } from 'react';
import { projectApi, ProjectMeta } from '@/services/projectApi';
import type { FileSystem } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface PendingSyncConfirmation {
  files: FileSystem;
  existingFileCount: number;
  newFileCount: number;
  message: string;
}

export interface UseProjectSyncOptions {
  /** Get current project */
  getCurrentProject: () => ProjectMeta | null;
  /** Get current files */
  getFiles: () => FileSystem;
  /** Get pending sync confirmation */
  getPendingSyncConfirmation: () => PendingSyncConfirmation | null;
  /** Callback to update state */
  updateState: (updater: (prev: ProjectSyncState) => Partial<ProjectSyncState>) => void;
  /** Refs for tracking */
  refs: {
    lastFilesRef: React.MutableRefObject<string>;
    isInitializedRef: React.MutableRefObject<boolean>;
    syncTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  };
}

export interface ProjectSyncState {
  files: FileSystem;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingSyncConfirmation: PendingSyncConfirmation | null;
  error: string | null;
}

export interface UseProjectSyncReturn {
  /** Update files locally (no backend sync) */
  updateFiles: (files: FileSystem) => void;
  /** Force sync files to backend */
  syncFiles: () => Promise<boolean>;
  /** Confirm pending sync after user approval */
  confirmPendingSync: () => Promise<boolean>;
  /** Cancel pending sync */
  cancelPendingSync: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProjectSync(options: UseProjectSyncOptions): UseProjectSyncReturn {
  const { getCurrentProject, getFiles, getPendingSyncConfirmation, updateState, refs } = options;

  /**
   * Update files (LOCAL ONLY - no auto-sync to backend)
   * Files sync to backend only on COMMIT (git-centric approach)
   */
  const updateFiles = useCallback(
    (files: FileSystem) => {
      // Just update local state - no backend sync
      updateState(() => ({ files }));
    },
    [updateState]
  );

  /**
   * Force sync files immediately
   */
  const syncFiles = useCallback(async (): Promise<boolean> => {
    const currentProject = getCurrentProject();
    const files = getFiles();

    if (!currentProject) {
      console.warn('[ProjectSync] Ignoring syncFiles - no current project');
      return false;
    }

    // CRITICAL: do not sync until initialized
    if (!refs.isInitializedRef.current) {
      console.warn('[ProjectSync] Ignoring syncFiles - not initialized yet');
      updateState(() => ({ error: 'Cannot sync: project still initializing' }));
      return false;
    }

    // CRITICAL: Never sync empty files - protect against data loss
    const fileCount = Object.keys(files).length;
    if (fileCount === 0) {
      console.warn('[ProjectSync] Blocking empty files sync - would cause data loss!');
      updateState(() => ({ error: 'Cannot sync: no files to save (data loss protection)' }));
      return false;
    }

    // Clear pending sync
    if (refs.syncTimeoutRef.current) {
      clearTimeout(refs.syncTimeoutRef.current);
      refs.syncTimeoutRef.current = null;
    }

    updateState(() => ({ isSyncing: true, error: null }));

    try {
      const response = await projectApi.update(currentProject.id, { files });

      // Check if confirmation is required
      if (response.confirmationRequired) {
        console.log('[ProjectSync] Sync requires confirmation:', response.message);
        updateState(() => ({
          isSyncing: false,
          pendingSyncConfirmation: {
            files,
            existingFileCount: response.existingFileCount || 0,
            newFileCount: response.newFileCount || 0,
            message: response.message || 'Significant file reduction detected. Do you want to continue?',
          },
        }));
        return false; // Not synced yet, waiting for confirmation
      }

      // Check if blocked
      if (response.blocked) {
        console.warn('[ProjectSync] Sync blocked:', response.warning);
        updateState(() => ({ isSyncing: false, error: response.warning || 'Sync blocked by server' }));
        return false;
      }

      refs.lastFilesRef.current = JSON.stringify(files);
      updateState(() => ({
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
      return true;
    } catch (_err) {
      updateState(() => ({
        isSyncing: false,
        error: 'Failed to sync files',
      }));
      return false;
    }
  }, [getCurrentProject, getFiles, updateState, refs]);

  /**
   * Confirm pending sync (force update after user confirmation)
   */
  const confirmPendingSync = useCallback(async (): Promise<boolean> => {
    const currentProject = getCurrentProject();
    const pendingSyncConfirmation = getPendingSyncConfirmation();

    if (!currentProject || !pendingSyncConfirmation) {
      return false;
    }

    const { files } = pendingSyncConfirmation;

    updateState(() => ({ isSyncing: true, pendingSyncConfirmation: null }));

    try {
      // Send with force=true to bypass the confirmation check
      const response = await projectApi.update(currentProject.id, { files, force: true });

      if (response.blocked) {
        console.warn('[ProjectSync] Force sync still blocked:', response.warning);
        updateState(() => ({ isSyncing: false, error: response.warning || 'Force sync blocked' }));
        return false;
      }

      refs.lastFilesRef.current = JSON.stringify(files);
      updateState(() => ({
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
      console.log('[ProjectSync] Force sync completed after confirmation');
      return true;
    } catch (_err) {
      updateState(() => ({
        isSyncing: false,
        error: 'Failed to sync files',
      }));
      return false;
    }
  }, [getCurrentProject, getPendingSyncConfirmation, updateState, refs]);

  /**
   * Cancel pending sync
   */
  const cancelPendingSync = useCallback(() => {
    updateState(() => ({ pendingSyncConfirmation: null }));
    console.log('[ProjectSync] Pending sync cancelled by user');
  }, [updateState]);

  return {
    updateFiles,
    syncFiles,
    confirmPendingSync,
    cancelPendingSync,
  };
}
