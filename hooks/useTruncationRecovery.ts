/**
 * useTruncationRecovery Hook
 *
 * Handles recovery from truncated AI responses.
 * Attempts to extract partial files and trigger continuation when possible.
 */

import { useCallback } from 'react';
import { FileSystem, ChatMessage } from '../types';
import { GenerationResponse } from '../services/ai';
import { FilePlan, ContinuationState } from './useGenerationState';
import {
  CONTINUATION_SYSTEM_INSTRUCTION,
  CONTINUATION_SYSTEM_INSTRUCTION_MARKER,
} from '../components/ControlPanel/prompts';
import { getFluidFlowConfig } from '../services/fluidflowConfig';
import {
  analyzeTruncatedResponse,
  emergencyCodeBlockExtraction,
} from '../utils/truncationRecovery';
import { calculateFileChanges, createTokenUsage } from '../utils/generationUtils';

// ============================================================================
// Types
// ============================================================================

export interface UseTruncationRecoveryOptions {
  files: FileSystem;
  existingApp: boolean;
  setStreamingStatus: (status: string) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setContinuationState: (state: ContinuationState | null) => void;
  reviewChange: (
    label: string,
    newFiles: FileSystem,
    options?: { skipHistory?: boolean; incompleteFiles?: string[] }
  ) => void;
  handleContinueGeneration: (
    state?: ContinuationState,
    originalFiles?: FileSystem
  ) => Promise<void>;
}

export interface TruncationRecoveryResult {
  handled: boolean;
  continuationStarted: boolean;
}

export interface UseTruncationRecoveryReturn {
  /**
   * Handle truncation error - try to recover files
   * Returns whether the error was handled and if continuation started
   */
  handleTruncationError: (
    fullText: string,
    currentFilePlan: FilePlan | null,
    prompt: string,
    currentModel: string,
    providerName: string,
    genStartTime: number,
    streamResponse: GenerationResponse | null
  ) => Promise<TruncationRecoveryResult>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTruncationRecovery(
  options: UseTruncationRecoveryOptions
): UseTruncationRecoveryReturn {
  const {
    files,
    existingApp,
    setStreamingStatus,
    setFilePlan,
    setMessages,
    setContinuationState,
    reviewChange,
    handleContinueGeneration,
  } = options;

  /**
   * Handle truncation error - try to recover files using utility
   */
  const handleTruncationError = useCallback(
    async (
      fullText: string,
      currentFilePlan: FilePlan | null,
      prompt: string,
      currentModel: string,
      providerName: string,
      genStartTime: number,
      streamResponse: GenerationResponse | null
    ): Promise<TruncationRecoveryResult> => {
      // Use utility to analyze truncated response
      const result = analyzeTruncatedResponse(
        fullText,
        files,
        currentFilePlan
          ? { create: currentFilePlan.create, delete: currentFilePlan.delete || [], total: currentFilePlan.total }
          : null
      );

      console.log('[TruncationRecovery] Analysis result:', result.action);

      if (result.action === 'none') {
        // Try emergency code block extraction as last resort
        const emergencyFiles = emergencyCodeBlockExtraction(fullText);
        if (emergencyFiles) {
          console.log(`[TruncationRecovery] Emergency recovery: ${Object.keys(emergencyFiles).length} code blocks`);
          const recoveredFiles = { ...files, ...emergencyFiles };

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            explanation: `Generation was truncated but recovered ${Object.keys(emergencyFiles).length} code sections.`,
            files: emergencyFiles,
            fileChanges: calculateFileChanges(files, recoveredFiles),
            snapshotFiles: { ...files },
            model: currentModel,
            provider: providerName,
            generationTime: Date.now() - genStartTime,
            tokenUsage: createTokenUsage(streamResponse?.usage, undefined, fullText, emergencyFiles),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          setTimeout(() => {
            setFilePlan(null);
            reviewChange('Generated App (Recovered)', recoveredFiles);
          }, 150);

          return { handled: true, continuationStarted: false };
        }
        return { handled: false, continuationStarted: false };
      }

      if (result.action === 'continuation' && result.generationMeta) {
        setStreamingStatus(`✨ ${result.message}`);

        if (currentFilePlan) {
          setFilePlan({
            create: currentFilePlan.create,
            delete: currentFilePlan.delete || [],
            total: currentFilePlan.total,
            completed: result.generationMeta.completedFiles,
          });
        }

        // Use format-aware continuation instruction
        const currentResponseFormat = getFluidFlowConfig().getResponseFormat();
        const continuationInstruction =
          currentResponseFormat === 'marker'
            ? CONTINUATION_SYSTEM_INSTRUCTION_MARKER
            : CONTINUATION_SYSTEM_INSTRUCTION;

        const contState: ContinuationState = {
          isActive: true,
          originalPrompt: prompt || 'Generate app',
          systemInstruction: continuationInstruction,
          generationMeta: result.generationMeta,
          accumulatedFiles: result.recoveredFiles || {},
          currentBatch: 1,
        };
        setContinuationState(contState);

        setTimeout(() => {
          handleContinueGeneration(contState, existingApp ? files : undefined);
        }, 100);

        return { handled: true, continuationStarted: true };
      }

      if (result.action === 'success' || result.action === 'partial') {
        const recoveredFiles = result.recoveredFiles || {};
        const mergedFiles = { ...files, ...recoveredFiles };

        setStreamingStatus(`✅ ${result.message}`);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          timestamp: Date.now(),
          explanation:
            result.action === 'partial'
              ? 'Generation incomplete (recovered partial files).'
              : 'Generation complete.',
          files: recoveredFiles,
          fileChanges: calculateFileChanges(files, mergedFiles),
          snapshotFiles: { ...files },
          model: currentModel,
          provider: providerName,
          generationTime: Date.now() - genStartTime,
          tokenUsage: createTokenUsage(streamResponse?.usage, undefined, fullText, recoveredFiles),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setTimeout(() => {
          setFilePlan(null);
          reviewChange(
            result.action === 'partial' ? 'Generated App (Partial)' : 'Generated App',
            mergedFiles
          );
        }, 150);

        return { handled: true, continuationStarted: false };
      }

      return { handled: false, continuationStarted: false };
    },
    [
      files,
      existingApp,
      setStreamingStatus,
      setFilePlan,
      setMessages,
      setContinuationState,
      reviewChange,
      handleContinueGeneration,
    ]
  );

  return {
    handleTruncationError,
  };
}
