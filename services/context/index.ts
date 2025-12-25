/**
 * Context Module Index
 *
 * Unified API for context management in FluidFlow:
 * - Conversation context: Message history tracking for AI conversations
 * - File context: Smart file tracking to avoid re-sending unchanged files
 * - Token estimation: Utilities for estimating token counts
 *
 * @example
 * ```ts
 * import {
 *   getFileContextTracker,
 *   clearFileTracker,
 *   estimateTokens,
 *   CONTEXT_IDS
 * } from '@/services/context';
 *
 * // Get tracker for main chat
 * const tracker = getFileContextTracker(CONTEXT_IDS.MAIN_CHAT);
 * const delta = tracker.getDelta(files);
 * console.log(`Changed: ${delta.changed.length}, Saved: ${delta.unchanged.length} files`);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type { ContextMessage, ConversationContext, ContextManagerConfig, ContextId } from './types';
export type {
  FileContextState,
  FileContextDelta,
  TrackerStats,
} from './fileContextTracker';

// ============================================================================
// Constants
// ============================================================================

export { CONTEXT_IDS } from './types';

// ============================================================================
// Token Estimation
// ============================================================================

export { estimateTokens, estimateMessagesTokens } from './tokenEstimation';

// ============================================================================
// File Context Tracking
// ============================================================================

export {
  FileContextTracker,
  getFileContextTracker,
  clearFileTracker,
  hasFileContext,
  clearAllFileTrackers,
} from './fileContextTracker';

// ============================================================================
// Convenience API
// ============================================================================

import { getFileContextTracker } from './fileContextTracker';
import { CONTEXT_IDS } from './types';
import type { FileSystem } from '../../types';

/**
 * Get file context stats for main chat
 * Convenience function for common use case
 */
export function getMainChatFileStats(files: FileSystem) {
  const tracker = getFileContextTracker(CONTEXT_IDS.MAIN_CHAT);
  return tracker.getStats(files);
}

/**
 * Check if main chat has any tracked files
 */
export function hasMainChatContext(): boolean {
  const tracker = getFileContextTracker(CONTEXT_IDS.MAIN_CHAT);
  return tracker.hasTrackedFiles();
}

/**
 * Get estimated token savings from file context tracking
 * Returns the number of tokens saved by not re-sending unchanged files
 */
export function getTokenSavings(files: FileSystem, contextId: string = CONTEXT_IDS.MAIN_CHAT): number {
  const tracker = getFileContextTracker(contextId);
  const stats = tracker.getStats(files);
  return stats.estimatedTokensSaved;
}
