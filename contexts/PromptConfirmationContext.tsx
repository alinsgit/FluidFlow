/**
 * PromptConfirmationContext
 *
 * Global context for intercepting AI prompts before they are sent.
 * When enabled, shows a confirmation modal with prompt details.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

// ============================================================================
// Types
// ============================================================================

export interface FileContextInfo {
  /** Total number of files in the project */
  totalFiles: number;
  /** Files included in this prompt (with full content) */
  filesInPrompt: number;
  /** Files already known to AI context (unchanged) */
  filesInContext: number;
  /** New files being shared for the first time */
  newFiles: number;
  /** Modified files being re-sent */
  modifiedFiles: number;
  /** Deleted files being notified */
  deletedFiles: number;
  /** Estimated tokens saved by not re-sending unchanged files */
  tokensSaved: number;
  /** Whether this is the first turn (no prior context) */
  isFirstTurn: boolean;
  /** Whether delta mode is enabled */
  deltaEnabled: boolean;
}

export interface PromptDetails {
  prompt: string;
  systemInstruction?: string;
  model: string;
  provider?: string;
  category?: string;
  contextTokens?: number;
  estimatedTokens?: number;
  attachments?: Array<{ type: string; size: number }>;
  /** File context information */
  fileContext?: FileContextInfo;
  /** Batch/session ID for grouped operations (e.g., multi-file edits) */
  batchId?: string;
}

export interface PromptConfirmationRequest {
  id: string;
  details: PromptDetails;
  resolve: (confirmed: boolean) => void;
}

interface PromptConfirmationContextType {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  pendingRequest: PromptConfirmationRequest | null;
  confirmPrompt: (details: PromptDetails) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
  /** Clear all confirmed batch sessions */
  clearBatchSessions: () => void;
}

// ============================================================================
// Context
// ============================================================================

const PromptConfirmationContext = createContext<PromptConfirmationContextType | null>(null);

// ============================================================================
// Global Interceptor (for non-React code like ProviderManager)
// ============================================================================

type PromptInterceptor = (details: PromptDetails) => Promise<boolean>;
let globalInterceptor: PromptInterceptor | null = null;
let isConfirmationEnabled = false;

// Batch session tracking - once a batch is confirmed, subsequent prompts in that batch skip confirmation
const confirmedBatches = new Set<string>();
const BATCH_SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const batchTimeouts = new Map<string, NodeJS.Timeout>();

// Load initial state from localStorage
try {
  isConfirmationEnabled = localStorage.getItem(STORAGE_KEYS.PROMPT_CONFIRMATION) === 'true';
} catch {
  // Ignore localStorage errors
}

/**
 * Mark a batch as confirmed (called when user confirms first prompt in batch)
 */
export function confirmBatchSession(batchId: string): void {
  confirmedBatches.add(batchId);

  // Clear any existing timeout
  const existingTimeout = batchTimeouts.get(batchId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Auto-expire batch session after timeout
  const timeout = setTimeout(() => {
    confirmedBatches.delete(batchId);
    batchTimeouts.delete(batchId);
    console.log('[PromptConfirmation] Batch session expired:', batchId);
  }, BATCH_SESSION_TIMEOUT);

  batchTimeouts.set(batchId, timeout);
  console.log('[PromptConfirmation] Batch session confirmed:', batchId);
}

/**
 * Check if a batch session is already confirmed
 */
export function isBatchConfirmed(batchId: string): boolean {
  return confirmedBatches.has(batchId);
}

/**
 * Clear all confirmed batch sessions
 */
export function clearAllBatchSessions(): void {
  confirmedBatches.clear();
  batchTimeouts.forEach((timeout) => clearTimeout(timeout));
  batchTimeouts.clear();
  console.log('[PromptConfirmation] All batch sessions cleared');
}

/**
 * Set the global prompt interceptor (called by PromptConfirmationProvider)
 */
export function setGlobalPromptInterceptor(interceptor: PromptInterceptor | null): void {
  globalInterceptor = interceptor;
  console.log('[PromptConfirmation] Interceptor set:', !!interceptor, 'enabled:', isConfirmationEnabled);
}

/**
 * Check if prompt confirmation is enabled
 */
export function isPromptConfirmationEnabled(): boolean {
  return isConfirmationEnabled;
}

/**
 * Set whether prompt confirmation is enabled (for use outside React)
 */
export function setPromptConfirmationEnabled(enabled: boolean): void {
  isConfirmationEnabled = enabled;
}

// Categories that should skip confirmation (auto-generated prompts)
const AUTO_CATEGORIES = ['git-commit', 'auto-commit', 'prompt-improver'];

/**
 * Request prompt confirmation (called from ProviderManager)
 * Returns true if confirmed, false if cancelled
 * If confirmation is disabled or no interceptor, returns true immediately
 * Auto-generated prompts (git commit, etc.) skip confirmation
 * Batch operations skip confirmation after first prompt is confirmed
 */
export async function requestPromptConfirmation(details: PromptDetails): Promise<boolean> {
  // Skip confirmation for auto-generated categories
  if (details.category && AUTO_CATEGORIES.includes(details.category)) {
    console.log('[PromptConfirmation] Auto category, skipping:', details.category);
    return true;
  }

  // Skip confirmation for already-confirmed batch sessions
  if (details.batchId && isBatchConfirmed(details.batchId)) {
    console.log('[PromptConfirmation] Batch already confirmed, skipping:', details.batchId);
    return true;
  }

  console.log('[PromptConfirmation] Request received:', {
    enabled: isConfirmationEnabled,
    hasInterceptor: !!globalInterceptor,
    category: details.category,
    model: details.model,
    batchId: details.batchId,
  });

  if (!isConfirmationEnabled || !globalInterceptor) {
    console.log('[PromptConfirmation] Skipping - enabled:', isConfirmationEnabled, 'interceptor:', !!globalInterceptor);
    return true; // No confirmation needed
  }

  console.log('[PromptConfirmation] Showing modal...');
  const confirmed = await globalInterceptor(details);

  // If confirmed and part of a batch, mark the batch as confirmed for future prompts
  if (confirmed && details.batchId) {
    confirmBatchSession(details.batchId);
  }

  return confirmed;
}

// ============================================================================
// Provider Component
// ============================================================================

export const PromptConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(isConfirmationEnabled);
  const [pendingRequest, setPendingRequest] = useState<PromptConfirmationRequest | null>(null);
  const requestIdRef = useRef(0);

  // Sync enabled state with localStorage and global flag
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    isConfirmationEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.PROMPT_CONFIRMATION, enabled ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // The confirmation function that will be called by the global interceptor
  const confirmPrompt = useCallback((details: PromptDetails): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = `prompt-${++requestIdRef.current}-${Date.now()}`;
      setPendingRequest({
        id,
        details,
        resolve,
      });
    });
  }, []);

  // Handle user confirmation
  const handleConfirm = useCallback(() => {
    if (pendingRequest) {
      pendingRequest.resolve(true);
      setPendingRequest(null);
    }
  }, [pendingRequest]);

  // Handle user cancellation
  const handleCancel = useCallback(() => {
    if (pendingRequest) {
      pendingRequest.resolve(false);
      setPendingRequest(null);
    }
  }, [pendingRequest]);

  // Clear all batch sessions
  const clearBatchSessions = useCallback(() => {
    clearAllBatchSessions();
  }, []);

  // Register the global interceptor
  useEffect(() => {
    setGlobalPromptInterceptor(confirmPrompt);
    return () => {
      setGlobalPromptInterceptor(null);
    };
  }, [confirmPrompt]);

  // Sync initial state
  useEffect(() => {
    isConfirmationEnabled = isEnabled;
  }, [isEnabled]);

  return (
    <PromptConfirmationContext.Provider
      value={{
        isEnabled,
        setEnabled,
        pendingRequest,
        confirmPrompt,
        handleConfirm,
        handleCancel,
        clearBatchSessions,
      }}
    >
      {children}
    </PromptConfirmationContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export function usePromptConfirmation(): PromptConfirmationContextType {
  const context = useContext(PromptConfirmationContext);
  if (!context) {
    throw new Error('usePromptConfirmation must be used within PromptConfirmationProvider');
  }
  return context;
}

export default PromptConfirmationContext;
