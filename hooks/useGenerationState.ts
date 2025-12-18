/**
 * useGenerationState - AI generation state management
 *
 * Manages all state related to AI code generation:
 * - Streaming progress (status, chars, files)
 * - File plan detection and tracking
 * - Truncation retry handling
 * - Continuation state for multi-batch generation
 */

import { useState, useCallback } from 'react';
import type { FileSystem } from '@/types';

// Generation meta from AI response for multi-batch generation
export interface GenerationMeta {
  totalFilesPlanned: number;
  filesInThisBatch: string[];
  completedFiles: string[];
  remainingFiles: string[];
  currentBatch: number;
  totalBatches: number;
  isComplete: boolean;
}

// File progress during streaming
export interface FileProgress {
  path: string;
  action: 'create' | 'update' | 'delete';
  expectedLines: number;
  receivedChars: number;
  progress: number; // 0-100
  status: 'pending' | 'streaming' | 'complete';
}

// File plan detected from response start (// PLAN: {...})
export interface FilePlan {
  create: string[];
  delete: string[];
  total: number;
  completed: string[];
  sizes?: Record<string, number>; // Estimated line counts per file
}

// Truncation retry state
export interface TruncatedContent {
  rawResponse: string;
  prompt: string;
  systemInstruction: string;
  partialFiles?: {
    [filePath: string]: {
      content: string;
      isComplete: boolean;
    };
  };
  attempt: number;
}

// Continuation state for multi-batch generation
export interface ContinuationState {
  isActive: boolean;
  originalPrompt: string;
  systemInstruction: string;
  generationMeta: GenerationMeta;
  accumulatedFiles: FileSystem;
  currentBatch: number;
  retryAttempts?: number;
}

export interface UseGenerationStateReturn {
  // Streaming state
  streamingStatus: string;
  setStreamingStatus: (status: string) => void;
  streamingChars: number;
  setStreamingChars: (chars: number) => void;
  streamingFiles: string[];
  setStreamingFiles: (files: string[]) => void;

  // File progress (for progress bars during streaming)
  fileProgress: Map<string, FileProgress>;
  setFileProgress: (progress: Map<string, FileProgress>) => void;
  updateFileProgress: (path: string, updates: Partial<FileProgress>) => void;
  initFileProgressFromPlan: (plan: FilePlan) => void;

  // File plan
  filePlan: FilePlan | null;
  setFilePlan: (plan: FilePlan | null) => void;

  // Truncation
  truncatedContent: TruncatedContent | null;
  setTruncatedContent: (content: TruncatedContent | null) => void;

  // Continuation
  continuationState: ContinuationState | null;
  setContinuationState: (state: ContinuationState | null) => void;

  // External prompt (for auto-fill from continuation)
  externalPrompt: string;
  setExternalPrompt: (prompt: string) => void;

  // Utility functions
  resetStreamingState: () => void;
  resetAllState: () => void;
}

export function useGenerationState(): UseGenerationStateReturn {
  // Streaming state
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamingChars, setStreamingChars] = useState(0);
  const [streamingFiles, setStreamingFiles] = useState<string[]>([]);

  // File progress state - for progress bars during streaming
  const [fileProgress, setFileProgress] = useState<Map<string, FileProgress>>(new Map());

  // File plan state - detected from response start
  const [filePlan, setFilePlan] = useState<FilePlan | null>(null);

  // Truncation retry state
  const [truncatedContent, setTruncatedContent] = useState<TruncatedContent | null>(null);

  // Continuation state for multi-batch generation
  const [continuationState, setContinuationState] = useState<ContinuationState | null>(null);

  // External prompt for auto-fill
  const [externalPrompt, setExternalPrompt] = useState<string>('');

  // Initialize file progress from plan (called when PLAN is detected)
  const initFileProgressFromPlan = useCallback((plan: FilePlan) => {
    const progress = new Map<string, FileProgress>();

    // Add created files
    for (const path of plan.create) {
      progress.set(path, {
        path,
        action: 'create',
        expectedLines: plan.sizes?.[path] || 100,
        receivedChars: 0,
        progress: 0,
        status: 'pending'
      });
    }

    // Add deleted files (always complete)
    for (const path of plan.delete) {
      progress.set(path, {
        path,
        action: 'delete',
        expectedLines: 0,
        receivedChars: 0,
        progress: 100,
        status: 'complete'
      });
    }

    setFileProgress(progress);
  }, []);

  // Update progress for a specific file
  const updateFileProgress = useCallback((path: string, updates: Partial<FileProgress>) => {
    setFileProgress(prev => {
      const newProgress = new Map(prev);
      const existing = newProgress.get(path);
      if (existing) {
        newProgress.set(path, { ...existing, ...updates });
      }
      return newProgress;
    });
  }, []);

  // Reset streaming state (called after generation starts)
  const resetStreamingState = useCallback(() => {
    setStreamingStatus('');
    setStreamingChars(0);
    setStreamingFiles([]);
    setFilePlan(null);
    setFileProgress(new Map());
  }, []);

  // Reset all state (called on full reset)
  const resetAllState = useCallback(() => {
    resetStreamingState();
    setTruncatedContent(null);
    setContinuationState(null);
    setExternalPrompt('');
  }, [resetStreamingState]);

  return {
    // Streaming
    streamingStatus,
    setStreamingStatus,
    streamingChars,
    setStreamingChars,
    streamingFiles,
    setStreamingFiles,

    // File progress
    fileProgress,
    setFileProgress,
    updateFileProgress,
    initFileProgressFromPlan,

    // File plan
    filePlan,
    setFilePlan,

    // Truncation
    truncatedContent,
    setTruncatedContent,

    // Continuation
    continuationState,
    setContinuationState,

    // External prompt
    externalPrompt,
    setExternalPrompt,

    // Utilities
    resetStreamingState,
    resetAllState
  };
}
