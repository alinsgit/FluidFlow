/**
 * useContinuationGeneration Hook
 *
 * Handles multi-batch generation, continuation, truncation recovery,
 * and missing file requests. Extracted from ControlPanel to reduce complexity.
 */

import { useCallback, useEffect, useRef } from 'react';
import { FileSystem, ChatMessage } from '../types';
import { parseMultiFileResponse, parseUnifiedResponse, GenerationMeta } from '../utils/cleanCode';
import { FILE_GENERATION_SCHEMA, supportsAdditionalProperties } from '../services/ai/utils/schemas';
import { FilePlan, ContinuationState, TruncatedContent } from './useGenerationState';
import { calculateFileChanges, createTokenUsage, getActiveProvider } from '../utils/generationUtils';
import { getFluidFlowConfig } from '../services/fluidflowConfig';

// ============ Internal Helpers ============

/**
 * Validate generated files, filtering out empty/malformed entries.
 * Returns valid files and a list of invalid file paths.
 */
function validateGeneratedFiles(
  files: FileSystem
): { validFiles: FileSystem; invalidFiles: string[] } {
  const validFiles: FileSystem = {};
  const invalidFiles: string[] = [];

  for (const [path, content] of Object.entries(files)) {
    if (!path || path.includes('/.') || !path.match(/\.[a-z]+$/i)) {
      console.warn('[Continuation] Invalid file path:', path);
      invalidFiles.push(path);
      continue;
    }

    const contentStr = typeof content === 'string' ? content : '';
    if (
      contentStr.length < 20 ||
      /^(tsx|jsx|ts|js|css|json|md);?$/.test(contentStr.trim())
    ) {
      console.warn('[Continuation] Empty or malformed file content:', path, '- content:', contentStr.slice(0, 50));
      invalidFiles.push(path);
      continue;
    }

    validFiles[path] = contentStr;
  }

  return { validFiles, invalidFiles };
}

/**
 * Create a ChatMessage for generation completion or error.
 */
function createCompletionMessage(
  opts: {
    explanation: string;
    files?: FileSystem;
    currentFiles: FileSystem;
    model?: string;
    provider?: string;
    startTime: number;
    tokenUsage?: ChatMessage['tokenUsage'];
    error?: string;
  }
): ChatMessage {
  const fileChanges = opts.files ? calculateFileChanges(opts.currentFiles, opts.files) : undefined;
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    timestamp: Date.now(),
    explanation: opts.explanation,
    ...(opts.error && { error: opts.error }),
    ...(opts.files && { files: opts.files }),
    ...(fileChanges && { fileChanges }),
    snapshotFiles: { ...opts.currentFiles },
    ...(opts.model && { model: opts.model }),
    ...(opts.provider && { provider: opts.provider }),
    generationTime: Date.now() - opts.startTime,
    ...(opts.tokenUsage && { tokenUsage: opts.tokenUsage }),
  };
}

// Types for the hook
export interface ContinuationGenerationOptions {
  files: FileSystem;
  selectedModel: string;
  setIsGenerating: (value: boolean) => void;
  setStreamingStatus: (status: string) => void;
  setStreamingChars: (chars: number) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  setContinuationState: (state: ContinuationState | null) => void;
  setTruncatedContent: (content: TruncatedContent | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  reviewChange: (label: string, newFiles: FileSystem) => void;
}

export interface UseContinuationGenerationReturn {
  handleContinueGeneration: (
    contState?: ContinuationState | null,
    existingFiles?: FileSystem
  ) => Promise<void>;
  requestMissingFiles: (
    missingFiles: string[],
    accumulatedFiles: FileSystem,
    systemInstruction: string
  ) => Promise<{ success: boolean; files: FileSystem; explanation?: string }>;
  handleTruncationRetry: (
    truncatedContent: TruncatedContent,
    reviewChange: (label: string, newFiles: FileSystem) => void
  ) => Promise<void>;
}

export function useContinuationGeneration(
  options: ContinuationGenerationOptions
): UseContinuationGenerationReturn {
  const {
    files,
    selectedModel,
    setIsGenerating,
    setStreamingStatus,
    setStreamingChars,
    setFilePlan,
    setContinuationState,
    setTruncatedContent,
    setMessages,
    reviewChange,
  } = options;

  // Track mounted state and active timers to prevent state updates after unmount
  const mountedRef = useRef(true);
  const activeTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear all active timers - used on unmount and when clearing pending operations
  const clearAllTimers = useCallback(() => {
    activeTimers.current.forEach(t => clearTimeout(t));
    activeTimers.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const safeSetTimeout = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      activeTimers.current.delete(timer);
      if (mountedRef.current) fn();
    }, ms);
    activeTimers.current.add(timer);
    return timer;
  }, []);

  /**
   * Targeted request for specific missing files - more focused than general continuation
   */
  const requestMissingFiles = useCallback(
    async (
      missingFiles: string[],
      accumulatedFiles: FileSystem,
      systemInstruction: string
    ): Promise<{ success: boolean; files: FileSystem; explanation?: string }> => {
      if (missingFiles.length === 0) {
        return { success: true, files: accumulatedFiles };
      }

      console.log('[MissingFiles] Requesting specific files:', missingFiles);
      setStreamingStatus(`🎯 Requesting ${missingFiles.length} missing file(s)...`);

      const { manager, model: currentModel, providerType } = getActiveProvider(selectedModel);

      // Very focused prompt - only ask for the missing files
      const targetedPrompt = `Generate ONLY the following specific files. These files are missing from the project.

## REQUIRED FILES (generate ALL of these):
${missingFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## CONTEXT
These files should integrate with the existing project structure. Use the same patterns and styles.

## EXISTING FILES FOR REFERENCE:
${Object.keys(accumulatedFiles).slice(0, 5).map((f) => `- ${f}`).join('\n')}
${Object.keys(accumulatedFiles).length > 5 ? `... and ${Object.keys(accumulatedFiles).length - 5} more files` : ''}

## CRITICAL INSTRUCTIONS:
1. Generate EXACTLY the ${missingFiles.length} files listed above
2. Use relative imports (./component, ../utils)
3. Return complete file contents - no truncation
4. Use Tailwind CSS for styling
5. Include data-ff-group and data-ff-id attributes on interactive elements

Return ONLY a JSON object with the files:
{
  "files": {
    "${missingFiles[0]}": "// complete file content...",
    ${missingFiles.length > 1 ? `"${missingFiles[1]}": "// complete file content..."` : ''}
  },
  "explanation": "Generated ${missingFiles.length} missing files"
}`;

      try {
        let fullText = '';
        const currentFormat = getFluidFlowConfig().getResponseFormat();
        await manager.generateStream(
          {
            prompt: targetedPrompt,
            systemInstruction,
            maxTokens: 32768,
            temperature: 0.7,
            responseFormat: currentFormat === 'marker' ? undefined : 'json',
            responseSchema:
              currentFormat !== 'marker' && providerType && supportsAdditionalProperties(providerType)
                ? FILE_GENERATION_SCHEMA
                : undefined,
          },
          (chunk) => {
            if (chunk.text) {
              fullText += chunk.text;
            }
          },
          currentModel
        );

        const parseResult = parseMultiFileResponse(fullText);

        if (parseResult && parseResult.files && Object.keys(parseResult.files).length > 0) {
          const newFiles = { ...accumulatedFiles, ...parseResult.files };
          console.log('[MissingFiles] Successfully generated:', Object.keys(parseResult.files));
          return { success: true, files: newFiles, explanation: parseResult.explanation };
        }

        console.warn('[MissingFiles] No files in response');
        return { success: false, files: accumulatedFiles };
      } catch (error) {
        console.error('[MissingFiles] Request failed:', error);
        return { success: false, files: accumulatedFiles };
      }
    },
    [selectedModel, setStreamingStatus]
  );

  /**
   * Smart continuation handler - automatically continues generation for remaining files
   */
  const handleContinueGeneration = useCallback(
    async (contState?: ContinuationState | null, existingFiles?: FileSystem) => {
      // Clear pending timers from previous continuation attempts to prevent leaks
      clearAllTimers();

      const state = contState;
      if (!state || state.generationMeta.isComplete) {
        console.log('[Continuation] No continuation needed or already complete');
        setContinuationState(null);
        return;
      }

      const { originalPrompt, systemInstruction, generationMeta, accumulatedFiles } = state;
      const { remainingFiles, currentBatch, totalBatches, completedFiles } = generationMeta;

      if (remainingFiles.length === 0) {
        console.log('[Continuation] All files completed');
        setContinuationState(null);
        return;
      }

      setIsGenerating(true);
      setStreamingStatus(
        `✨ Generating... ${completedFiles.length}/${generationMeta.totalFilesPlanned} files`
      );

      const { manager, model: currentModel, providerName, providerType } = getActiveProvider(selectedModel);
      const continuationStartTime = Date.now();

      try {
        // Build continuation prompt (internal - user doesn't see this)
        const continuationPrompt = `Continue generating the remaining files for the project.

## GENERATION CONTEXT
Already completed: ${completedFiles.length} files
Remaining: ${remainingFiles.length} files

### ALREADY COMPLETED FILES:
${completedFiles.map((f) => `- ${f}`).join('\n')}

### REMAINING FILES TO GENERATE:
${remainingFiles.map((f) => `- ${f}`).join('\n')}

### ORIGINAL REQUEST:
${originalPrompt}

Generate the remaining files. Each file must be COMPLETE and FUNCTIONAL.`;

        let fullText = '';
        let chunkCount = 0;
        const contFormat = getFluidFlowConfig().getResponseFormat();

        const response = await manager.generateStream(
          {
            prompt: continuationPrompt,
            systemInstruction,
            maxTokens: 32768,
            temperature: 0.7,
            responseFormat: contFormat === 'marker' ? undefined : 'json',
            responseSchema:
              contFormat !== 'marker' && providerType && supportsAdditionalProperties(providerType)
                ? FILE_GENERATION_SCHEMA
                : undefined,
          },
          (chunk) => {
            fullText += chunk.text || '';
            chunkCount++;
            setStreamingChars(fullText.length);

            // Only update status occasionally to avoid flickering
            if (chunkCount % 50 === 0) {
              setStreamingStatus(
                `✨ Generating... ${completedFiles.length}/${generationMeta.totalFilesPlanned} files (${Math.round(fullText.length / 1024)}KB)`
              );
            }
          },
          currentModel
        );

        setStreamingStatus('✨ Finalizing...');
        console.log('[Continuation] Raw response length:', fullText.length);

        // Use unified parser to support both JSON and marker formats
        const unifiedResult = parseUnifiedResponse(fullText);
        const parseResult = unifiedResult ? {
          files: unifiedResult.files,
          explanation: unifiedResult.explanation,
          truncated: unifiedResult.truncated,
          generationMeta: unifiedResult.generationMeta,
        } : parseMultiFileResponse(fullText); // Fallback to JSON-only parser

        console.log('[Continuation] Parse result:', {
          hasFiles: !!parseResult?.files,
          fileCount: parseResult ? Object.keys(parseResult.files).length : 0,
          fileNames: parseResult ? Object.keys(parseResult.files) : [],
          format: unifiedResult?.format || 'json-fallback',
          generationMeta: parseResult?.generationMeta,
        });

        if (!parseResult || !parseResult.files || Object.keys(parseResult.files).length === 0) {
          console.error('[Continuation] Failed to parse - no files found');
          throw new Error('Failed to parse continuation response - no files found');
        }

        // Check for truncation and auto-retry if needed
        if (parseResult.truncated) {
          const currentRetryAttempts = state.retryAttempts || 0;
          const maxRetryAttempts = 3;

          if (currentRetryAttempts < maxRetryAttempts) {
            console.log(
              `[Continuation] Response truncated, auto-retry attempt ${currentRetryAttempts + 1}/${maxRetryAttempts}`
            );
            setStreamingStatus(
              `🔄 Response truncated, retrying (${currentRetryAttempts + 1}/${maxRetryAttempts})...`
            );

            // Merge any partial files we got before retrying
            const partialAccumulatedFiles = { ...accumulatedFiles, ...parseResult.files };

            const retryState: ContinuationState = {
              ...state,
              accumulatedFiles: partialAccumulatedFiles,
              retryAttempts: currentRetryAttempts + 1,
            };
            setContinuationState(retryState);

            // Wait before retrying (exponential backoff)
            safeSetTimeout(() => {
              handleContinueGeneration(retryState, existingFiles);
            }, 1000 * (currentRetryAttempts + 1));

            return; // Exit this attempt
          } else {
            console.warn(
              '[Continuation] Max retries for truncation reached, proceeding with partial files'
            );
          }
        }

        // Merge new files with accumulated files
        const newAccumulatedFiles = { ...accumulatedFiles, ...parseResult.files };
        const newCompletedFiles = [
          ...new Set([...completedFiles, ...Object.keys(parseResult.files)]),
        ];

        // Update remaining files - check against ALL accumulated files (not just current batch)
        // This fixes the bug where continuation keeps running even when files were received in earlier batches
        const allAccumulatedFileNames = Object.keys(newAccumulatedFiles).map((f) => f.split('/').pop());
        const newRemainingFiles = remainingFiles.filter((f) => {
          const fileName = f.split('/').pop();
          // Check against ALL accumulated files, not just current batch
          const exactMatch = newAccumulatedFiles[f];
          const nameMatch = allAccumulatedFileNames.includes(fileName);
          return !exactMatch && !nameMatch;
        });

        // If we generated ANY new files, consider progress made
        const madeProgress = Object.keys(parseResult.files).length > 0;

        // Check if generation is complete - multiple completion signals
        const noRemainingFiles = newRemainingFiles.length === 0;
        const aiMarkedComplete = parseResult.generationMeta?.isComplete === true;
        const allPlannedFilesReceived = Object.keys(newAccumulatedFiles).length >= generationMeta.totalFilesPlanned;
        // NEW: Also check if AI's GENERATION_META says remainingFiles is empty
        const aiSaysNoRemaining = parseResult.generationMeta?.remainingFiles?.length === 0;
        const isComplete = noRemainingFiles || aiMarkedComplete || allPlannedFilesReceived || aiSaysNoRemaining;

        console.log('[Continuation] Batch complete:', {
          newFilesThisBatch: Object.keys(parseResult.files).length,
          totalAccumulated: Object.keys(newAccumulatedFiles).length,
          totalPlanned: generationMeta.totalFilesPlanned,
          totalCompleted: newCompletedFiles.length,
          remaining: newRemainingFiles.length,
          remainingFiles: newRemainingFiles,
          aiGenerationMeta: parseResult.generationMeta,
          completionSignals: { noRemainingFiles, aiMarkedComplete, allPlannedFilesReceived, aiSaysNoRemaining },
          isComplete,
          madeProgress,
        });

        // Seamless progress update
        setStreamingStatus(
          `✨ Generating... ${newCompletedFiles.length}/${generationMeta.totalFilesPlanned} files`
        );

        // Safety: Force complete if we've done too many batches or no progress
        const maxBatches = 5;
        const shouldForceComplete = currentBatch >= maxBatches || !madeProgress;

        if (isComplete || shouldForceComplete) {
          // All done! Show final result
          if (shouldForceComplete && !isComplete) {
            console.log('[Continuation] Forcing completion - max batches reached or no progress');
          }

          // VALIDATE: Filter out empty or malformed files
          const { validFiles, invalidFiles } = validateGeneratedFiles(newAccumulatedFiles);

          console.log('[Continuation] File validation:', {
            total: Object.keys(newAccumulatedFiles).length,
            valid: Object.keys(validFiles).length,
            invalid: invalidFiles,
          });

          // If no valid files, show error
          if (Object.keys(validFiles).length === 0) {
            console.error('[Continuation] No valid files generated!');
            setStreamingStatus('❌ Generation failed - no valid files received');
            setIsGenerating(false);
            setContinuationState(null);
            setFilePlan(null);

            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              timestamp: Date.now(),
              error: `Generation failed - files were empty or malformed.\n\nInvalid files: ${invalidFiles.join(', ')}\n\nPlease try again.`,
              snapshotFiles: { ...files },
            };
            setMessages((prev) => [...prev, errorMessage]);
            return;
          }

          // Merge with existing project files
          const finalFiles = existingFiles ? { ...existingFiles, ...validFiles } : validFiles;
          const generatedFileList = Object.keys(validFiles);

          console.log('[Continuation] Complete:', {
            fileCount: Object.keys(finalFiles).length,
            validFiles: generatedFileList,
            invalidFiles,
            forced: shouldForceComplete && !isComplete,
          });

          // Calculate file changes for display
          const fileChanges = calculateFileChanges(files, finalFiles);

          // Build comprehensive explanation
          let explanationText = parseResult.explanation || 'Generation complete.';

          if (invalidFiles.length > 0) {
            explanationText += `\n\n⚠️ **${invalidFiles.length} files were invalid and excluded.**`;
          }

          // Add completion message
          const completionMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            explanation: explanationText,
            files: validFiles,
            fileChanges,
            snapshotFiles: { ...files },
            model: currentModel,
            provider: providerName,
            generationTime: Date.now() - continuationStartTime,
            tokenUsage: response?.usage
              ? {
                  inputTokens: response.usage.inputTokens || 0,
                  outputTokens: response.usage.outputTokens || 0,
                  totalTokens:
                    (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0),
                }
              : undefined,
          };
          setMessages((prev) => [...prev, completionMessage]);

          // Update status to show completion
          setStreamingStatus(`✅ Generated ${generatedFileList.length} files!`);

          // Small delay to ensure message renders before modal opens
          safeSetTimeout(() => {
            setContinuationState(null);
            setIsGenerating(false);
            setFilePlan(null);

            // Apply changes (shows diff modal if auto-accept is off)
            reviewChange('Generated App', finalFiles);
          }, 100);

          return;
        } else {
          // Continue seamlessly - user doesn't notice the transition
          const newGenerationMeta: GenerationMeta = {
            totalFilesPlanned: generationMeta.totalFilesPlanned,
            filesInThisBatch: Object.keys(parseResult.files),
            completedFiles: newCompletedFiles,
            remainingFiles: newRemainingFiles,
            currentBatch: currentBatch + 1,
            totalBatches,
            isComplete: false,
          };

          const newContState: ContinuationState = {
            isActive: true,
            originalPrompt,
            systemInstruction,
            generationMeta: newGenerationMeta,
            accumulatedFiles: newAccumulatedFiles,
            currentBatch: currentBatch + 1,
            retryAttempts: 0, // Reset retry counter for new batch
          };

          setContinuationState(newContState);

          console.log('[Continuation] Starting next batch:', currentBatch + 1);

          // Continue immediately - seamless experience
          safeSetTimeout(() => {
            handleContinueGeneration(newContState, existingFiles);
          }, 50);
        }
      } catch (error) {
        console.error('[Continuation] Error:', error);

        // Auto-retry logic - retry up to 3 times before giving up
        const currentRetryAttempts = state.retryAttempts || 0;
        const maxRetryAttempts = 3;

        if (currentRetryAttempts < maxRetryAttempts && generationMeta.remainingFiles.length > 0) {
          console.log(
            `[Continuation] Auto-retry attempt ${currentRetryAttempts + 1}/${maxRetryAttempts}`
          );
          setStreamingStatus(
            `🔄 Retrying batch (attempt ${currentRetryAttempts + 1}/${maxRetryAttempts})...`
          );

          // Create new state with incremented retry counter
          const retryState: ContinuationState = {
            ...state,
            retryAttempts: currentRetryAttempts + 1,
          };
          setContinuationState(retryState);

          // Wait before retrying (exponential backoff)
          safeSetTimeout(() => {
            handleContinueGeneration(retryState, existingFiles);
          }, 1000 * (currentRetryAttempts + 1));

          return;
        }

        // All retries exhausted - try targeted request for missing files
        if (
          generationMeta.remainingFiles.length > 0 &&
          Object.keys(accumulatedFiles).length > 0
        ) {
          console.log(
            '[Continuation] Retries exhausted, trying targeted request for:',
            generationMeta.remainingFiles
          );
          setStreamingStatus(
            `🎯 Requesting ${generationMeta.remainingFiles.length} missing file(s) directly...`
          );

          // Try targeted request for missing files
          const targetedResult = await requestMissingFiles(
            generationMeta.remainingFiles,
            accumulatedFiles,
            systemInstruction
          );

          if (targetedResult.success) {
            const stillMissing = generationMeta.remainingFiles.filter(
              (f) => !targetedResult.files[f]
            );
            const generatedFileList = Object.keys(targetedResult.files);
            const finalFiles = existingFiles
              ? { ...existingFiles, ...targetedResult.files }
              : targetedResult.files;

            let explanationText = targetedResult.explanation || 'Generation complete.';
            if (stillMissing.length > 0) {
              explanationText += `\n\n⚠️ **${stillMissing.length} files could not be generated:** ${stillMissing.join(', ')}`;
            }

            setMessages((prev) => [...prev, createCompletionMessage({
              explanation: explanationText,
              files: targetedResult.files,
              currentFiles: files,
              model: currentModel,
              provider: providerName,
              startTime: continuationStartTime,
              tokenUsage: createTokenUsage(undefined, undefined, explanationText, targetedResult.files),
            })]);
            setStreamingStatus(
              `✅ Generated ${generatedFileList.length} files${stillMissing.length > 0 ? ` (${stillMissing.length} missing)` : ''}`
            );

            safeSetTimeout(() => {
              setContinuationState(null);
              setIsGenerating(false);
              setFilePlan(null);
              reviewChange('Generated App', finalFiles);
            }, 100);
            return;
          }
        }

        // Targeted request also failed or no accumulated files - show what we have
        if (Object.keys(accumulatedFiles).length > 0) {
          console.log(
            '[Continuation] All attempts exhausted, showing accumulated files:',
            Object.keys(accumulatedFiles)
          );

          const generatedFileList = Object.keys(accumulatedFiles);
          const finalFiles = existingFiles
            ? { ...existingFiles, ...accumulatedFiles }
            : accumulatedFiles;

          const explanationText = `Generation complete.\n\n⚠️ **${generationMeta.remainingFiles.length} files could not be generated:** ${generationMeta.remainingFiles.join(', ')}`;

          const completionMessage = createCompletionMessage({
            explanation: explanationText,
            files: accumulatedFiles,
            currentFiles: files,
            model: currentModel,
            provider: providerName,
            startTime: continuationStartTime,
            tokenUsage: createTokenUsage(undefined, undefined, explanationText, accumulatedFiles),
          });
          setMessages((prev) => [...prev, completionMessage]);

          setStreamingStatus(
            `✅ Generated ${generatedFileList.length} files (${generationMeta.remainingFiles.length} missing)`
          );

          safeSetTimeout(() => {
            setContinuationState(null);
            setIsGenerating(false);
            setFilePlan(null);
            reviewChange('Generated App', finalFiles);
          }, 100);
        } else {
          setStreamingStatus(
            '❌ Generation failed: ' +
              (error instanceof Error ? error.message : 'Unknown error')
          );
          setIsGenerating(false);
          setContinuationState(null);
          setFilePlan(null);

          // Show error message
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            explanation: `❌ **Generation failed:** ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`,
            snapshotFiles: { ...files },
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    },
    [
      files,
      selectedModel,
      setIsGenerating,
      setStreamingStatus,
      setStreamingChars,
      setFilePlan,
      setContinuationState,
      setMessages,
      reviewChange,
      requestMissingFiles,
      safeSetTimeout,
      clearAllTimers,
    ]
  );

  /**
   * Handle truncation retry - retries generation when response was truncated
   */
  const handleTruncationRetry = useCallback(
    async (
      truncatedContent: TruncatedContent,
      reviewChangeFn: (label: string, newFiles: FileSystem) => void
    ) => {
      // Clear pending timers from previous retry attempts
      clearAllTimers();

      const { rawResponse, prompt, systemInstruction, attempt } = truncatedContent;

      // Limit retry attempts to prevent infinite loops
      if (attempt >= 3) {
        setStreamingStatus('❌ Maximum retry attempts reached. Please try a shorter prompt.');
        setTruncatedContent(null);
        return;
      }

      setStreamingStatus(`🔄 Retrying generation (attempt ${attempt + 1}/3)...`);
      setIsGenerating(true);

      try {
        // Extract what was being generated when truncated
        const incompleteResponse = rawResponse;

        // Create a continuation prompt
        const continuationPrompt = `Continue generating from where you left off. Your previous response was truncated:

**Previous incomplete response (first 2000 chars):**
${incompleteResponse.slice(0, 2000)}

**Last 500 chars of incomplete response:**
${incompleteResponse.slice(-500)}

Please continue from exactly where you stopped and complete the response. Make sure to:
1. Complete any incomplete JSON structure
2. Finish any cut-off file content
3. Provide all remaining files
4. Ensure the response is properly formatted JSON

Original prompt: ${prompt}`;

        const { manager, model: currentModel } = getActiveProvider(selectedModel);

        let fullText = '';

        await manager.generateStream(
          {
            prompt: continuationPrompt,
            systemInstruction,
            maxTokens: 32768,
            temperature: 0.7,
          },
          (chunk) => {
            if (chunk.text) {
              fullText += chunk.text;
            }
          },
          currentModel
        );

        // Combine original response with continuation
        const combinedResponse = incompleteResponse + fullText;

        setStreamingStatus('✨ Parsing combined response...');

        // Try to parse the combined response
        const parseResult = parseMultiFileResponse(combinedResponse);

        if (parseResult && parseResult.files) {
          // Apply the changes
          reviewChangeFn('Retried Generation (combined)', parseResult.files);
          setStreamingStatus('✅ Successfully recovered from truncation!');
          setTruncatedContent(null);
        } else {
          // Still failed, update truncated content for another retry
          setTruncatedContent({
            rawResponse: combinedResponse,
            prompt,
            systemInstruction,
            partialFiles: truncatedContent.partialFiles,
            attempt: attempt + 1,
          });
          setStreamingStatus('⚠️ Response still truncated after retry. Click "Retry" to try again.');
        }
      } catch (error) {
        console.error('Retry failed:', error);
        setStreamingStatus(
          '❌ Retry failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedModel, setIsGenerating, setStreamingStatus, setTruncatedContent, clearAllTimers]
  );

  return {
    handleContinueGeneration,
    requestMissingFiles,
    handleTruncationRetry,
  };
}
