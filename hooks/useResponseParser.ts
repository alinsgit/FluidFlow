/**
 * useResponseParser Hook
 *
 * Handles parsing AI responses in both standard and search/replace modes.
 * Extracted from useCodeGeneration to reduce complexity.
 */

import { useCallback } from 'react';
import { FileSystem } from '../types';
import {
  cleanGeneratedCode,
  parseMultiFileResponse,
  parseUnifiedResponse,
  GenerationMeta,
  parseSearchReplaceModeResponse,
  mergeSearchReplaceChanges,
} from '../utils/cleanCode';
import { emergencyCodeBlockExtraction } from '../utils/truncationRecovery';
import { debugLog } from './useDebugStore';
import type { StreamingFormat } from './useStreamingResponse';

export interface StandardParseResult {
  explanation: string;
  newFiles: Record<string, string>;
  deletedFiles: string[];
  mergedFiles: FileSystem;
  wasTruncated: boolean;
  generationMeta?: GenerationMeta;
  /** Response format detected */
  format?: 'json' | 'marker';
  /** Files that were started but not completed (will NOT be merged) */
  incompleteFiles?: string[];
  continuation?: {
    prompt: string;
    remainingFiles: string[];
    currentBatch: number;
    totalBatches: number;
  };
  /** True if format fallback was used (AI didn't follow expected format) */
  formatFallbackUsed?: boolean;
}

export interface SearchReplaceParseResult {
  explanation: string;
  newFiles: Record<string, string>;
  mergedFiles: FileSystem;
}

export interface UseResponseParserOptions {
  files: FileSystem;
  existingApp: boolean;
  setStreamingStatus: (status: string) => void;
}

export interface UseResponseParserReturn {
  parseStandardResponse: (
    fullText: string,
    genRequestId: string,
    genStartTime: number,
    currentModel: string,
    providerName: string,
    chunkCount: number,
    /** Format hint from streaming detection */
    formatHint?: StreamingFormat
  ) => StandardParseResult;

  parseSearchReplaceResponse: (
    fullText: string,
    genRequestId: string,
    genStartTime: number,
    currentModel: string,
    providerName: string,
    chunkCount: number
  ) => SearchReplaceParseResult | null;
}

export function useResponseParser(options: UseResponseParserOptions): UseResponseParserReturn {
  const { files, existingApp, setStreamingStatus } = options;

  /**
   * Parse response in standard full-file mode
   * Supports both JSON and marker formats via unified parser
   */
  const parseStandardResponse = useCallback(
    (
      fullText: string,
      genRequestId: string,
      genStartTime: number,
      currentModel: string,
      providerName: string,
      chunkCount: number,
      _formatHint?: StreamingFormat
    ): StandardParseResult => {
      // Try unified parser first (handles both JSON and marker formats)
      const unifiedResult = parseUnifiedResponse(fullText);
      let parseResult: ReturnType<typeof parseMultiFileResponse>;
      let detectedFormat: 'json' | 'marker' = 'json';

      let incompleteFiles: string[] | undefined;

      if (unifiedResult) {
        // Unified parser succeeded
        detectedFormat = unifiedResult.format;
        incompleteFiles = unifiedResult.incompleteFiles;
        parseResult = {
          files: unifiedResult.files,
          explanation: unifiedResult.explanation,
          truncated: unifiedResult.truncated,
          deletedFiles: unifiedResult.deletedFiles,
          generationMeta: unifiedResult.generationMeta,
        };
        console.log(`[ResponseParser] Using unified parser, format: ${detectedFormat}`);
      } else {
        // Fallback to direct JSON parser
        parseResult = parseMultiFileResponse(fullText);
        console.log('[ResponseParser] Unified parser failed, using JSON parser');
      }

      // Track if format fallback was used
      let formatFallbackUsed = false;

      // If both parsers failed, try emergency code block extraction
      // This handles cases where AI returns conversational text with markdown code blocks
      if (!parseResult || Object.keys(parseResult.files || {}).length === 0) {
        console.log('[ResponseParser] Standard parsers failed, trying emergency code block extraction...');
        const emergencyFiles = emergencyCodeBlockExtraction(fullText, true);

        if (emergencyFiles && Object.keys(emergencyFiles).length > 0) {
          console.log(`[ResponseParser] Emergency extraction recovered ${Object.keys(emergencyFiles).length} files:`, Object.keys(emergencyFiles));
          setStreamingStatus(`⚠️ Format fallback: Recovered ${Object.keys(emergencyFiles).length} files from code blocks`);
          formatFallbackUsed = true;
          detectedFormat = 'json'; // Mark as recovered
          parseResult = {
            files: emergencyFiles,
            explanation: 'Files recovered from code blocks (AI did not follow expected format)',
            truncated: false,
          };
        }
      }

      if (!parseResult || Object.keys(parseResult.files || {}).length === 0) {
        throw new Error('Could not parse response - no valid file content found. AI may not have followed the expected format.');
      }

      const explanation = parseResult.explanation || 'App generated successfully.';
      const newFiles = parseResult.files;
      const deletedFiles = parseResult.deletedFiles || [];
      const wasTruncated = parseResult.truncated || false;
      const generationMeta = parseResult.generationMeta;
      const continuation = parseResult.continuation;

      // Warn about incomplete files (NOT included in merge)
      if (incompleteFiles && incompleteFiles.length > 0) {
        console.error('[Generation] ⚠️ INCOMPLETE FILES DETECTED - these will NOT be merged:', incompleteFiles);
        setStreamingStatus(`⚠️ ${incompleteFiles.length} file(s) incomplete and excluded: ${incompleteFiles.join(', ')}`);
      }

      // Warn if response was truncated but we recovered
      if (wasTruncated) {
        console.warn('[Generation] Response was truncated but partially recovered');
        if (!incompleteFiles || incompleteFiles.length === 0) {
          setStreamingStatus('⚠️ Response truncated - showing recovered files');
        }
      }

      // Log the efficiency (token savings)
      if (deletedFiles.length > 0 || (existingApp && Object.keys(newFiles).length < Object.keys(files).length)) {
        console.log(
          `🚀 Efficient update: Only ${Object.keys(newFiles).length} files modified, ${deletedFiles.length} deleted`
        );
      }

      debugLog.response('generation', {
        id: genRequestId,
        model: currentModel,
        duration: Date.now() - genStartTime,
        response: JSON.stringify({
          explanation,
          fileCount: Object.keys(newFiles).length,
          deletedCount: deletedFiles.length,
          files: Object.keys(newFiles),
          deletedFiles,
        }),
        metadata: {
          mode: 'generator',
          totalChunks: chunkCount,
          totalChars: fullText.length,
          provider: providerName,
          efficientUpdate: existingApp && Object.keys(newFiles).length < Object.keys(files).length,
        },
      });

      // Clean code in each file
      for (const [path, content] of Object.entries(newFiles)) {
        if (typeof content === 'string') {
          newFiles[path] = cleanGeneratedCode(content);
        }
      }

      // For new projects, ensure we have src/App.tsx
      if (!existingApp && !newFiles['src/App.tsx']) {
        throw new Error('No src/App.tsx in response');
      }

      // Merge files efficiently - ALWAYS preserve existing files
      let mergedFiles: FileSystem;
      const hasExistingFiles = Object.keys(files).length > 0;

      if (hasExistingFiles) {
        // Start with existing files and apply updates
        mergedFiles = { ...files };

        // Apply new/modified files
        Object.assign(mergedFiles, newFiles);

        // Remove deleted files (only if explicitly marked for deletion)
        for (const deletedPath of deletedFiles) {
          delete mergedFiles[deletedPath];
        }
      } else {
        // Truly new project with no files - use generated files
        mergedFiles = newFiles;
      }

      return {
        explanation,
        newFiles,
        deletedFiles,
        mergedFiles,
        wasTruncated,
        generationMeta,
        format: detectedFormat,
        continuation,
        incompleteFiles,
        formatFallbackUsed,
      };
    },
    [files, existingApp, setStreamingStatus]
  );

  /**
   * Parse response in search/replace mode (BETA)
   */
  const parseSearchReplaceResponse = useCallback(
    (
      fullText: string,
      genRequestId: string,
      genStartTime: number,
      currentModel: string,
      providerName: string,
      chunkCount: number
    ): SearchReplaceParseResult | null => {
      console.log('[SearchReplaceMode] Parsing search/replace response...');
      const srResult = parseSearchReplaceModeResponse(fullText);

      if (!srResult) {
        console.warn('[SearchReplaceMode] Failed to parse response, falling back to full mode');
        return null;
      }

      // Successfully parsed search/replace mode response
      const explanation = srResult.explanation || 'Changes applied successfully.';
      const deletedFiles = srResult.deletedFiles || [];

      // Use merge with detailed error reporting
      const mergeResult = mergeSearchReplaceChanges(files, srResult);

      if (!mergeResult.success) {
        console.warn('[SearchReplaceMode] Some replacements failed:', mergeResult.errors);
        setStreamingStatus(`⚠️ ${mergeResult.stats.replacementsFailed} replacement(s) failed`);
      }

      const mergedFiles = mergeResult.files;

      // Calculate which files actually changed
      const newFiles: Record<string, string> = {};
      for (const [path, content] of Object.entries(mergedFiles)) {
        if (files[path] !== content) {
          newFiles[path] = content;
        }
      }

      // Remove deleted files from merged
      for (const deletedPath of deletedFiles) {
        delete mergedFiles[deletedPath];
      }

      // Log search/replace mode efficiency
      console.log(
        `🔥 [SearchReplaceMode] Efficient update: ${mergeResult.stats.created} created, ${mergeResult.stats.updated} updated, ${mergeResult.stats.deleted} deleted, ${mergeResult.stats.replacementsApplied} replacements applied`
      );
      console.log(`[SearchReplaceMode] Changed files: ${Object.keys(newFiles).join(', ')}`);

      debugLog.response('generation', {
        id: genRequestId,
        model: currentModel,
        duration: Date.now() - genStartTime,
        response: JSON.stringify({
          explanation,
          mode: 'search-replace',
          stats: mergeResult.stats,
          errors: mergeResult.errors,
        }),
        metadata: {
          mode: 'search-replace-mode',
          totalChunks: chunkCount,
          totalChars: fullText.length,
          provider: providerName,
          srStats: mergeResult.stats,
        },
      });

      return { explanation, newFiles, mergedFiles };
    },
    [files, setStreamingStatus]
  );

  return {
    parseStandardResponse,
    parseSearchReplaceResponse,
  };
}
