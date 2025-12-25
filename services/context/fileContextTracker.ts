/**
 * File Context Tracker
 *
 * Tracks which files have been shared with the AI in the current conversation.
 * Only sends files that have changed since last prompt to optimize token usage.
 *
 * Features:
 * - Content hash tracking to detect changes
 * - Turn-based tracking to know when files were shared
 * - Delta detection for efficient context updates
 * - Persistence across page refreshes (optional)
 */

import { FileSystem } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface FileContextState {
  /** Hash of file content when last shared */
  contentHash: string;
  /** Timestamp when file was last shared */
  lastSharedAt: number;
  /** Turn number when file was shared */
  sharedInTurn: number;
  /** Size in characters when shared */
  size: number;
}

export interface FileContextDelta {
  /** Files not previously shared or content changed */
  changed: string[];
  /** Files with same content as when shared */
  unchanged: string[];
  /** Files that were shared but no longer exist */
  deleted: string[];
  /** Files being shared for the first time */
  new: string[];
}

export interface TrackerStats {
  totalTracked: number;
  changedFiles: number;
  unchangedFiles: number;
  estimatedTokensSaved: number;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a simple hash of file content
 * Uses FNV-1a hash for speed
 */
function hashContent(content: string): string {
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Estimate tokens from character count
 */
function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

// ============================================================================
// FileContextTracker Class
// ============================================================================

export class FileContextTracker {
  private contextId: string;
  private files: Map<string, FileContextState> = new Map();
  private currentTurn: number = 0;
  private persistToStorage: boolean;
  private storageKey: string;

  constructor(contextId: string, persistToStorage: boolean = true) {
    this.contextId = contextId;
    this.persistToStorage = persistToStorage;
    this.storageKey = `fluidflow_file_context_${contextId}`;
    this.loadFromStorage();
  }

  // ============================================================================
  // Storage Operations
  // ============================================================================

  private loadFromStorage(): void {
    if (!this.persistToStorage) return;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.files = new Map(Object.entries(data.files || {}));
        this.currentTurn = data.currentTurn || 0;
        console.log(`[FileContextTracker] Loaded ${this.files.size} tracked files for "${this.contextId}"`);
      }
    } catch (e) {
      console.warn('[FileContextTracker] Failed to load from storage:', e);
    }
  }

  private saveToStorage(): void {
    if (!this.persistToStorage) return;

    try {
      const data = {
        files: Object.fromEntries(this.files),
        currentTurn: this.currentTurn,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[FileContextTracker] Failed to save to storage:', e);
    }
  }

  // ============================================================================
  // Core Operations
  // ============================================================================

  /**
   * Analyze current files and determine what has changed since last context
   */
  getDelta(currentFiles: FileSystem): FileContextDelta {
    const delta: FileContextDelta = {
      changed: [],
      unchanged: [],
      deleted: [],
      new: [],
    };

    const currentPaths = new Set(Object.keys(currentFiles));
    const trackedPaths = new Set(this.files.keys());

    // Check each current file
    for (const [path, content] of Object.entries(currentFiles)) {
      const contentStr = typeof content === 'string' ? content : String(content);
      const currentHash = hashContent(contentStr);
      const tracked = this.files.get(path);

      if (!tracked) {
        // New file
        delta.new.push(path);
        delta.changed.push(path);
      } else if (tracked.contentHash !== currentHash) {
        // Content changed
        delta.changed.push(path);
      } else {
        // Unchanged
        delta.unchanged.push(path);
      }
    }

    // Check for deleted files
    for (const path of trackedPaths) {
      if (!currentPaths.has(path)) {
        delta.deleted.push(path);
      }
    }

    return delta;
  }

  /**
   * Mark files as shared in the current turn
   * Call this after successfully sending a prompt
   */
  markFilesAsShared(files: FileSystem, paths?: string[]): void {
    this.currentTurn++;
    const now = Date.now();

    const pathsToMark = paths || Object.keys(files);

    for (const path of pathsToMark) {
      const content = files[path];
      if (content !== undefined) {
        const contentStr = typeof content === 'string' ? content : String(content);
        this.files.set(path, {
          contentHash: hashContent(contentStr),
          lastSharedAt: now,
          sharedInTurn: this.currentTurn,
          size: contentStr.length,
        });
      }
    }

    this.saveToStorage();
    console.log(`[FileContextTracker] Marked ${pathsToMark.length} files as shared in turn ${this.currentTurn}`);
  }

  /**
   * Remove tracking for deleted files
   */
  removeDeletedFiles(deletedPaths: string[]): void {
    for (const path of deletedPaths) {
      this.files.delete(path);
    }
    this.saveToStorage();
  }

  /**
   * Get statistics about tracked files
   */
  getStats(currentFiles: FileSystem): TrackerStats {
    const delta = this.getDelta(currentFiles);

    // Calculate token savings
    let unchangedChars = 0;
    for (const path of delta.unchanged) {
      const tracked = this.files.get(path);
      if (tracked) {
        unchangedChars += tracked.size;
      }
    }

    return {
      totalTracked: this.files.size,
      changedFiles: delta.changed.length,
      unchangedFiles: delta.unchanged.length,
      estimatedTokensSaved: estimateTokens(unchangedChars),
    };
  }

  /**
   * Get current turn number
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }

  /**
   * Check if any files have been tracked yet
   */
  hasTrackedFiles(): boolean {
    return this.files.size > 0;
  }

  /**
   * Get list of tracked file paths
   */
  getTrackedPaths(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * Get file state for a specific path
   */
  getFileState(path: string): FileContextState | undefined {
    return this.files.get(path);
  }

  /**
   * Clear all tracking (useful for "Start Fresh")
   */
  clear(): void {
    this.files.clear();
    this.currentTurn = 0;
    this.saveToStorage();
    console.log(`[FileContextTracker] Cleared all tracking for "${this.contextId}"`);
  }
}

// ============================================================================
// Singleton Management
// ============================================================================

const trackers: Map<string, FileContextTracker> = new Map();

/**
 * Get or create a FileContextTracker for a specific context
 */
export function getFileContextTracker(contextId: string): FileContextTracker {
  let tracker = trackers.get(contextId);
  if (!tracker) {
    tracker = new FileContextTracker(contextId);
    trackers.set(contextId, tracker);
  }
  return tracker;
}

/**
 * Clear a specific tracker by context ID
 * Use this when switching projects or clearing conversation context
 */
export function clearFileTracker(contextId: string): void {
  const tracker = trackers.get(contextId);
  if (tracker) {
    tracker.clear();
    console.log(`[FileContextTracker] Cleared tracker for "${contextId}"`);
  }
}

/**
 * Check if a tracker exists and has tracked files
 */
export function hasFileContext(contextId: string): boolean {
  const tracker = trackers.get(contextId);
  return tracker ? tracker.hasTrackedFiles() : false;
}

/**
 * Clear all trackers (useful for app reset)
 */
export function clearAllFileTrackers(): void {
  for (const tracker of trackers.values()) {
    tracker.clear();
  }
  trackers.clear();
  console.log('[FileContextTracker] All trackers cleared');
}

export default FileContextTracker;
