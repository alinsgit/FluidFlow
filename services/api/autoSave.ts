/**
 * Auto-Save Utility
 *
 * Thread-safe auto-save utility for debounced project file saving.
 * Features:
 * - Debounced saves to reduce API calls
 * - Lock mechanism to prevent concurrent saves
 * - Pending save queue with merge logic (BUG-006 fix)
 */

import { projectApi } from './projects';

// Thread-safe auto-save state
let autoSaveTimeout: NodeJS.Timeout | null = null;
let lastSavedFiles: string | null = null;
let lastSavedProjectId: string | null = null;
let isSaving = false; // Lock to prevent concurrent saves
let pendingSave: { projectId: string; files: Record<string, string> } | null = null;

/**
 * Internal save function that handles the lock
 * BUG-006 fix: Merge pending saves to prevent lost updates
 */
async function performSave(projectId: string, files: Record<string, string>): Promise<boolean> {
  // If already saving, merge this save with pending
  if (isSaving) {
    if (pendingSave) {
      // BUG-006 fix: Merge files instead of overwriting to prevent data loss
      // If project changed, start fresh; otherwise merge
      if (pendingSave.projectId === projectId) {
        pendingSave.files = { ...pendingSave.files, ...files };
        console.log('[AutoSave] Save merged with existing pending save');
      } else {
        // Different project - replace (can't merge across projects)
        pendingSave = { projectId, files };
        console.log('[AutoSave] Save queued (different project)');
      }
    } else {
      pendingSave = { projectId, files };
      console.log('[AutoSave] Save queued (another save in progress)');
    }
    return false;
  }

  isSaving = true;
  const filesJson = JSON.stringify(files);

  try {
    await projectApi.update(projectId, { files });
    lastSavedFiles = filesJson;
    lastSavedProjectId = projectId;
    console.log('[AutoSave] Project saved');
    return true;
  } catch (error) {
    console.error('[AutoSave] Failed to save:', error);
    return false;
  } finally {
    isSaving = false;
    // Process any queued save
    const queued = pendingSave;
    if (queued) {
      pendingSave = null;
      // Use setTimeout to avoid stack overflow on rapid saves
      setTimeout(() => performSave(queued.projectId, queued.files), 0);
    }
  }
}

export const autoSave = {
  /**
   * Schedule an auto-save (debounced, thread-safe)
   */
  schedule: (projectId: string, files: Record<string, string>, delay = 2000) => {
    const filesJson = JSON.stringify(files);

    // Skip if nothing changed (same project and same content)
    if (filesJson === lastSavedFiles && projectId === lastSavedProjectId) {
      return;
    }

    // If project changed, reset state to ensure we save to the correct project
    if (projectId !== lastSavedProjectId) {
      lastSavedFiles = null;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }

    // Schedule new save
    autoSaveTimeout = setTimeout(() => {
      autoSaveTimeout = null; // Clear ref before async operation
      performSave(projectId, files);
    }, delay);
  },

  /**
   * Force save immediately (thread-safe)
   */
  saveNow: async (projectId: string, files: Record<string, string>) => {
    // Clear any pending scheduled save
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }

    // If project changed, reset state
    if (projectId !== lastSavedProjectId) {
      lastSavedFiles = null;
    }

    const result = await performSave(projectId, files);
    if (result) {
      console.log('[AutoSave] Project saved (forced)');
    }
    return result;
  },

  /**
   * Reset auto-save state
   */
  reset: () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    lastSavedFiles = null;
    lastSavedProjectId = null;
    pendingSave = null;
    // Note: We do not reset isSaving here as an in-flight save should complete
  },

  /**
   * Check if a save is currently in progress
   */
  isSaving: () => isSaving,
};
