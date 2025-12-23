/**
 * useContinuationHandler Hook
 *
 * Handles multi-batch generation continuation logic.
 * Detects incomplete generations and triggers automatic continuation.
 */

import { useCallback } from 'react';
import { FileSystem } from '../types';
import { GenerationMeta } from '../utils/cleanCode';
import { FilePlan, ContinuationState } from './useGenerationState';

// ============================================================================
// Types
// ============================================================================

export interface UseContinuationHandlerOptions {
  files: FileSystem;
  existingApp: boolean;
  setStreamingStatus: (status: string) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  setContinuationState: (state: ContinuationState | null) => void;
  handleContinueGeneration: (
    state?: ContinuationState,
    originalFiles?: FileSystem
  ) => Promise<void>;
}

export interface UseContinuationHandlerReturn {
  /**
   * Check if files are missing from the plan and trigger continuation
   * Returns true if continuation was started
   */
  handleMissingFiles: (
    currentFilePlan: FilePlan,
    newFiles: Record<string, string>,
    prompt: string,
    systemInstruction: string
  ) => boolean;
  /**
   * Handle smart continuation from AI response metadata
   * Returns true if continuation was started
   */
  handleSmartContinuation: (
    generationMeta: GenerationMeta,
    newFiles: Record<string, string>,
    prompt: string,
    systemInstruction: string
  ) => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useContinuationHandler(
  options: UseContinuationHandlerOptions
): UseContinuationHandlerReturn {
  const {
    files,
    existingApp,
    setStreamingStatus,
    setFilePlan,
    setContinuationState,
    handleContinueGeneration,
  } = options;

  /**
   * Handle missing files - trigger continuation
   */
  const handleMissingFiles = useCallback(
    (
      currentFilePlan: FilePlan,
      newFiles: Record<string, string>,
      prompt: string,
      systemInstruction: string
    ): boolean => {
      const receivedFiles = Object.keys(newFiles);
      const missingFiles = currentFilePlan.create.filter((f) => !receivedFiles.includes(f));

      if (missingFiles.length === 0) return false;

      console.log('[ContinuationHandler] Missing files detected from plan:', missingFiles);

      const genMeta: GenerationMeta = {
        totalFilesPlanned: currentFilePlan.total,
        filesInThisBatch: receivedFiles,
        completedFiles: receivedFiles,
        remainingFiles: missingFiles,
        currentBatch: 1,
        totalBatches: Math.ceil(currentFilePlan.total / 5),
        isComplete: false,
      };

      setStreamingStatus(`✨ Generating... ${receivedFiles.length}/${currentFilePlan.total} files`);

      setFilePlan({
        create: currentFilePlan.create,
        delete: currentFilePlan.delete || [],
        total: currentFilePlan.total,
        completed: receivedFiles,
      });

      const contState: ContinuationState = {
        isActive: true,
        originalPrompt: prompt || 'Generate app',
        systemInstruction,
        generationMeta: genMeta,
        accumulatedFiles: newFiles,
        currentBatch: 1,
      };
      setContinuationState(contState);

      setTimeout(() => {
        handleContinueGeneration(contState, existingApp ? files : undefined);
      }, 100);

      return true;
    },
    [files, existingApp, setStreamingStatus, setFilePlan, setContinuationState, handleContinueGeneration]
  );

  /**
   * Handle smart continuation from AI response metadata
   */
  const handleSmartContinuation = useCallback(
    (
      generationMeta: GenerationMeta,
      newFiles: Record<string, string>,
      prompt: string,
      systemInstruction: string
    ): boolean => {
      if (generationMeta.isComplete || generationMeta.remainingFiles.length === 0) {
        return false;
      }

      console.log('[ContinuationHandler] Multi-batch generation detected:', {
        batch: `${generationMeta.currentBatch}/${generationMeta.totalBatches}`,
        completed: generationMeta.completedFiles.length,
        remaining: generationMeta.remainingFiles.length,
      });

      setStreamingStatus(
        `✨ Generating... ${generationMeta.completedFiles.length}/${generationMeta.totalFilesPlanned} files`
      );

      setFilePlan({
        create: [...generationMeta.completedFiles, ...generationMeta.remainingFiles],
        delete: [],
        total: generationMeta.totalFilesPlanned,
        completed: generationMeta.completedFiles,
      });

      const contState: ContinuationState = {
        isActive: true,
        originalPrompt: prompt || 'Generate app',
        systemInstruction,
        generationMeta,
        accumulatedFiles: newFiles,
        currentBatch: generationMeta.currentBatch,
      };
      setContinuationState(contState);

      setTimeout(() => {
        handleContinueGeneration(contState, existingApp ? files : undefined);
      }, 100);

      return true;
    },
    [files, existingApp, setStreamingStatus, setFilePlan, setContinuationState, handleContinueGeneration]
  );

  return {
    handleMissingFiles,
    handleSmartContinuation,
  };
}
