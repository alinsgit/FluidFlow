/**
 * useCodeGeneration Hook
 *
 * Handles the main code generation logic for the AI chat.
 * Orchestrates streaming, parsing, and continuation handling.
 *
 * Delegates to focused sub-hooks:
 * - useContinuationHandler: Multi-batch generation continuation
 * - useTruncationRecovery: Recovery from truncated responses
 * - useGenerationSuccess: Success handling and diff modal
 */

import { useCallback } from 'react';
import { FileSystem, ChatMessage, ChatAttachment } from '../types';
import { GenerationMeta } from '../utils/cleanCode';
import { debugLog } from './useDebugStore';
import { getProviderManager, GenerationRequest } from '../services/ai';
import {
  FILE_GENERATION_SCHEMA,
  supportsAdditionalProperties,
} from '../services/ai/utils/schemas';
import { FilePlan, TruncatedContent, ContinuationState, FileProgress } from './useGenerationState';
import { useStreamingResponse } from './useStreamingResponse';
import { useResponseParser } from './useResponseParser';
import { useContinuationHandler } from './useContinuationHandler';
import { useTruncationRecovery } from './useTruncationRecovery';
import { useGenerationSuccess } from './useGenerationSuccess';
import { buildSystemInstruction, buildPromptParts } from '../utils/generationUtils';
import { getFluidFlowConfig } from '../services/fluidflowConfig';

export interface CodeGenerationOptions {
  prompt: string;
  attachments: ChatAttachment[];
  isEducationMode: boolean;
  diffModeEnabled?: boolean;
  conversationHistory?: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface CodeGenerationResult {
  success: boolean;
  continuationStarted?: boolean;
  error?: string;
}

export interface AIHistoryEntry {
  timestamp: number;
  prompt: string;
  model: string;
  provider: string;
  hasSketch: boolean;
  hasBrand: boolean;
  isUpdate: boolean;
  rawResponse: string;
  responseChars: number;
  responseChunks: number;
  durationMs: number;
  success: boolean;
  truncated?: boolean;
  filesGenerated?: string[];
  explanation?: string;
  error?: string;
}

export interface UseCodeGenerationOptions {
  files: FileSystem;
  selectedModel: string;
  sessionId?: string;  // For context compaction
  generateSystemInstruction: () => string;
  setStreamingStatus: (status: string) => void;
  setStreamingChars: (chars: number) => void;
  setStreamingFiles: (files: string[]) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  setContinuationState: (state: ContinuationState | null) => void;
  setTruncatedContent: (content: TruncatedContent | null) => void;
  setIsGenerating: (value: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  reviewChange: (label: string, newFiles: FileSystem, options?: { skipHistory?: boolean; incompleteFiles?: string[] }) => void;
  handleContinueGeneration: (
    state?: ContinuationState,
    originalFiles?: FileSystem
  ) => Promise<void>;
  addAIHistoryEntry: (entry: AIHistoryEntry) => void;
  // File progress tracking callbacks (optional)
  updateFileProgress?: (path: string, updates: Partial<FileProgress>) => void;
  initFileProgressFromPlan?: (plan: FilePlan) => void;
  setFileProgress?: (progress: Map<string, FileProgress>) => void;
}

export interface UseCodeGenerationReturn {
  generateCode: (options: CodeGenerationOptions) => Promise<CodeGenerationResult>;
}

export function useCodeGeneration(options: UseCodeGenerationOptions): UseCodeGenerationReturn {
  const {
    files,
    selectedModel,
    sessionId,
    generateSystemInstruction,
    setStreamingStatus,
    setStreamingChars,
    setStreamingFiles,
    setFilePlan,
    setContinuationState,
    setTruncatedContent: _setTruncatedContent,
    setIsGenerating: _setIsGenerating,
    setMessages,
    reviewChange,
    handleContinueGeneration,
    addAIHistoryEntry,
    updateFileProgress,
    initFileProgressFromPlan,
    setFileProgress,
  } = options;

  const existingApp = files['src/App.tsx'];

  // Use extracted hooks
  const { processStreamingResponse } = useStreamingResponse({
    setStreamingChars,
    setStreamingFiles,
    setStreamingStatus,
    setFilePlan,
    updateFileProgress,
    initFileProgressFromPlan,
  });

  const { parseStandardResponse, parseSearchReplaceResponse } = useResponseParser({
    files,
    existingApp: !!existingApp,
    setStreamingStatus,
  });

  // Use extracted hooks for focused responsibilities
  const { handleMissingFiles, handleSmartContinuation } = useContinuationHandler({
    files,
    existingApp: !!existingApp,
    setStreamingStatus,
    setFilePlan,
    setContinuationState,
    handleContinueGeneration,
  });

  const { handleTruncationError } = useTruncationRecovery({
    files,
    existingApp: !!existingApp,
    setStreamingStatus,
    setFilePlan,
    setMessages,
    setContinuationState,
    reviewChange,
    handleContinueGeneration,
  });

  const { handleGenerationSuccess } = useGenerationSuccess({
    files,
    existingApp: !!existingApp,
    sessionId,
    setStreamingStatus,
    setFilePlan,
    setMessages,
    reviewChange,
  });

  /**
   * Main code generation function
   */
  const generateCode = useCallback(
    async (genOptions: CodeGenerationOptions): Promise<CodeGenerationResult> => {
      const { prompt, attachments, isEducationMode, diffModeEnabled, conversationHistory } = genOptions;

      const sketchAtt = attachments.find((a) => a.type === 'sketch');
      const brandAtt = attachments.find((a) => a.type === 'brand');

      const manager = getProviderManager();
      const activeProvider = manager.getActiveConfig();
      const currentModel = activeProvider?.defaultModel || selectedModel;
      const providerName = activeProvider?.name || 'AI';

      // Build system instruction with configured response format
      const responseFormat = getFluidFlowConfig().getResponseFormat();
      console.log(`[CodeGeneration] Using response format: ${responseFormat}`);

      const systemInstruction = buildSystemInstruction(
        !!existingApp,
        !!brandAtt,
        isEducationMode,
        !!diffModeEnabled,
        generateSystemInstruction(),
        responseFormat
      );

      // Build prompt parts
      const { promptParts, images } = buildPromptParts(prompt, attachments, files, !!existingApp);

      const request: GenerationRequest = {
        prompt: promptParts.join('\n\n'),
        systemInstruction,
        images,
        responseFormat: responseFormat === 'marker' ? undefined : 'json',
        responseSchema:
          responseFormat !== 'marker' && activeProvider?.type && supportsAdditionalProperties(activeProvider.type)
            ? FILE_GENERATION_SCHEMA
            : undefined,
        conversationHistory:
          conversationHistory && conversationHistory.length > 0 ? conversationHistory : undefined,
      };

      // Initialize streaming state
      setStreamingStatus(`🚀 Starting generation with ${providerName}...`);
      setStreamingChars(0);
      setStreamingFiles([]);
      setFilePlan(null);
      // Clear file progress from previous generation
      if (setFileProgress) {
        setFileProgress(new Map());
      }

      const genRequestId = debugLog.request('generation', {
        model: currentModel,
        prompt: prompt || 'Generate/Update app',
        systemInstruction,
        attachments: attachments.map((a) => ({ type: a.type, size: a.file.size })),
        metadata: {
          mode: 'generator',
          hasExistingApp: !!existingApp,
          provider: providerName,
        },
      });
      const genStartTime = Date.now();

      try {
        // Process streaming response
        // Pass expected format for early validation (abort if mismatch)
        const expectedFormat = responseFormat === 'marker' ? 'marker' : undefined;
        const { fullText, chunkCount, detectedFiles, streamResponse, currentFilePlan } =
          await processStreamingResponse(request, currentModel, genRequestId, genStartTime, expectedFormat);

        // Show parsing status
        setStreamingStatus(`✨ Processing ${detectedFiles.length} files...`);

        // Parse response based on mode
        let explanation: string;
        let mergedFiles: FileSystem;
        let newFiles: Record<string, string>;
        let wasTruncated = false;
        let generationMeta: GenerationMeta | undefined;
        let incompleteFiles: string[] | undefined;
        let continuation:
          | {
              prompt: string;
              remainingFiles: string[];
              currentBatch: number;
              totalBatches: number;
            }
          | undefined;

        if (diffModeEnabled && existingApp) {
          // SEARCH/REPLACE MODE (BETA)
          const srResult = parseSearchReplaceResponse(
            fullText,
            genRequestId,
            genStartTime,
            currentModel,
            providerName,
            chunkCount
          );

          if (srResult) {
            explanation = srResult.explanation;
            newFiles = srResult.newFiles;
            mergedFiles = srResult.mergedFiles;
          } else {
            // Fallback to standard parsing
            const stdResult = parseStandardResponse(
              fullText,
              genRequestId,
              genStartTime,
              currentModel,
              providerName,
              chunkCount
            );
            explanation = stdResult.explanation;
            newFiles = stdResult.newFiles;
            mergedFiles = stdResult.mergedFiles;
            wasTruncated = stdResult.wasTruncated;
            generationMeta = stdResult.generationMeta;
            continuation = stdResult.continuation;
            incompleteFiles = stdResult.incompleteFiles;
          }
        } else {
          // Standard full-file mode
          const stdResult = parseStandardResponse(
            fullText,
            genRequestId,
            genStartTime,
            currentModel,
            providerName,
            chunkCount
          );
          explanation = stdResult.explanation;
          newFiles = stdResult.newFiles;
          mergedFiles = stdResult.mergedFiles;
          wasTruncated = stdResult.wasTruncated;
          generationMeta = stdResult.generationMeta;
          continuation = stdResult.continuation;
          incompleteFiles = stdResult.incompleteFiles;
        }

        // Check for missing files based on filePlan
        if (currentFilePlan && currentFilePlan.create.length > 0) {
          if (handleMissingFiles(currentFilePlan, newFiles, prompt, systemInstruction)) {
            return { success: true, continuationStarted: true };
          }
        }

        // Check for smart continuation
        if (generationMeta && !generationMeta.isComplete && generationMeta.remainingFiles.length > 0) {
          if (handleSmartContinuation(generationMeta, newFiles, prompt, systemInstruction)) {
            return { success: true, continuationStarted: true };
          }
        }

        // Save to AI history
        addAIHistoryEntry({
          timestamp: Date.now(),
          prompt: prompt || 'Generate app',
          model: currentModel,
          provider: providerName,
          hasSketch: !!sketchAtt,
          hasBrand: !!brandAtt,
          isUpdate: !!existingApp,
          rawResponse: fullText,
          responseChars: fullText.length,
          responseChunks: chunkCount,
          durationMs: Date.now() - genStartTime,
          success: true,
          truncated: wasTruncated,
          filesGenerated: Object.keys(newFiles),
          explanation,
        });

        // Handle success
        handleGenerationSuccess(
          newFiles,
          mergedFiles,
          explanation,
          genStartTime,
          currentModel,
          providerName,
          streamResponse,
          fullText,
          continuation,
          incompleteFiles
        );

        return { success: true, continuationStarted: false };
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Parse error';
        console.error('Parse error:', errorMsg);

        // Check if this is a truncation error
        const isTruncationError =
          errorMsg.includes('truncated') || errorMsg.includes('token limits');

        if (isTruncationError) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lastResponse = (window as any).__lastAIResponse;
          const fullText = lastResponse?.raw || '';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentFilePlan = (window as any).__currentFilePlan || null;

          const truncResult = await handleTruncationError(
            fullText,
            currentFilePlan,
            prompt,
            currentModel,
            providerName,
            genStartTime,
            null
          );

          if (truncResult.handled) {
            return { success: true, continuationStarted: truncResult.continuationStarted };
          }
        }

        // Log error
        debugLog.error('generation', errorMsg, {
          model: currentModel,
          duration: Date.now() - genStartTime,
          metadata: {
            mode: 'generator',
            provider: providerName,
            hasTruncationError: isTruncationError,
          },
        });

        // Save failed attempt to AI history
        addAIHistoryEntry({
          timestamp: Date.now(),
          prompt: prompt || 'Generate app',
          model: currentModel,
          provider: providerName,
          hasSketch: !!sketchAtt,
          hasBrand: !!brandAtt,
          isUpdate: !!existingApp,
          rawResponse: '',
          responseChars: 0,
          responseChunks: 0,
          durationMs: Date.now() - genStartTime,
          success: false,
          error: errorMsg,
          truncated: isTruncationError,
        });

        setStreamingStatus('❌ ' + errorMsg);

        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          timestamp: Date.now(),
          error: errorMsg + ' (Check browser console for raw response)',
          snapshotFiles: { ...files },
        };
        setMessages((prev) => [...prev, errorMessage]);

        return { success: false, continuationStarted: false, error: errorMsg };
      }
    },
    [
      files,
      existingApp,
      selectedModel,
      generateSystemInstruction,
      setStreamingStatus,
      setStreamingChars,
      setStreamingFiles,
      setFilePlan,
      setFileProgress,
      setMessages,
      processStreamingResponse,
      parseStandardResponse,
      parseSearchReplaceResponse,
      handleMissingFiles,
      handleSmartContinuation,
      handleTruncationError,
      handleGenerationSuccess,
      addAIHistoryEntry,
    ]
  );

  return {
    generateCode,
  };
}
