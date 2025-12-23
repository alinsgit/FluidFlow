/**
 * useGenerationSuccess Hook
 *
 * Handles successful code generation completion.
 * Creates messages, triggers context compaction, and shows diff modal.
 */

import { useCallback } from 'react';
import { FileSystem, ChatMessage } from '../types';
import { GenerationResponse } from '../services/ai';
import { FilePlan } from './useGenerationState';
import { checkAndAutoCompact } from '../services/contextCompaction';
import { calculateFileChanges, createTokenUsage } from '../utils/generationUtils';

// ============================================================================
// Types
// ============================================================================

export interface UseGenerationSuccessOptions {
  files: FileSystem;
  existingApp: boolean;
  sessionId?: string;
  setStreamingStatus: (status: string) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  reviewChange: (
    label: string,
    newFiles: FileSystem,
    options?: { skipHistory?: boolean; incompleteFiles?: string[] }
  ) => void;
}

export interface UseGenerationSuccessReturn {
  /**
   * Handle generation success - create message and show diff modal
   */
  handleGenerationSuccess: (
    newFiles: Record<string, string>,
    mergedFiles: FileSystem,
    explanation: string,
    genStartTime: number,
    currentModel: string,
    providerName: string,
    streamResponse: GenerationResponse | null,
    fullText: string,
    continuation?: {
      prompt: string;
      remainingFiles: string[];
      currentBatch: number;
      totalBatches: number;
    },
    incompleteFiles?: string[]
  ) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGenerationSuccess(
  options: UseGenerationSuccessOptions
): UseGenerationSuccessReturn {
  const {
    files,
    existingApp,
    sessionId,
    setStreamingStatus,
    setFilePlan,
    setMessages,
    reviewChange,
  } = options;

  /**
   * Handle generation success - create message and show diff modal
   */
  const handleGenerationSuccess = useCallback(
    (
      newFiles: Record<string, string>,
      mergedFiles: FileSystem,
      explanation: string,
      genStartTime: number,
      currentModel: string,
      providerName: string,
      streamResponse: GenerationResponse | null,
      fullText: string,
      continuation?: {
        prompt: string;
        remainingFiles: string[];
        currentBatch: number;
        totalBatches: number;
      },
      incompleteFiles?: string[]
    ) => {
      const fileChanges = calculateFileChanges(files, mergedFiles);
      const generatedFileList = Object.keys(newFiles);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        timestamp: Date.now(),
        explanation: explanation || 'Generation complete.',
        files: newFiles,
        fileChanges,
        snapshotFiles: { ...files },
        model: currentModel,
        provider: providerName,
        generationTime: Date.now() - genStartTime,
        continuation: continuation,
        tokenUsage: createTokenUsage(streamResponse?.usage, undefined, fullText, newFiles),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if context needs compaction and trigger based on settings
      if (sessionId) {
        checkAndAutoCompact(sessionId)
          .then((result) => {
            if (result) {
              if (result.compacted) {
                console.log('[GenerationSuccess] Context compacted:', result);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    timestamp: Date.now(),
                    content: `📦 Context compacted: ${result.beforeTokens.toLocaleString()} → ${result.afterTokens.toLocaleString()} tokens`,
                  },
                ]);
              }
            }
          })
          .catch((err) => {
            console.error('[GenerationSuccess] Compaction check failed:', err);
          });
      }

      // Show warning if there are incomplete files
      if (incompleteFiles && incompleteFiles.length > 0) {
        setStreamingStatus(
          `⚠️ Generated ${generatedFileList.length} files (${incompleteFiles.length} incomplete, excluded)`
        );
      } else {
        setStreamingStatus(`✅ Generated ${generatedFileList.length} files!`);
      }

      console.log('[GenerationSuccess] Success - adding message and showing diff modal:', {
        fileCount: generatedFileList.length,
        files: generatedFileList,
        incompleteFiles,
      });

      setTimeout(() => {
        setFilePlan(null);
        reviewChange(
          existingApp ? 'Updated App' : 'Generated Initial App',
          mergedFiles,
          { incompleteFiles }
        );
      }, 150);
    },
    [files, existingApp, setMessages, setStreamingStatus, setFilePlan, reviewChange, sessionId]
  );

  return {
    handleGenerationSuccess,
  };
}
