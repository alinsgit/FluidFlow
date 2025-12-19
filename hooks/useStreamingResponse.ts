/**
 * useStreamingResponse Hook
 *
 * Handles streaming AI responses and file detection during generation.
 * Extracted from useCodeGeneration to reduce complexity.
 * Supports both JSON and Marker response formats.
 */

import { useCallback } from 'react';
import { debugLog } from './useDebugStore';
import { getProviderManager, GenerationRequest, GenerationResponse } from '../services/ai';
import { FilePlan, FileProgress } from './useGenerationState';
import {
  isMarkerFormat,
  parseMarkerPlan,
  type MarkerFilePlan,
} from '../utils/markerFormat';

/** Detected response format */
export type StreamingFormat = 'json' | 'marker' | 'unknown';

export interface StreamingCallbacks {
  setStreamingChars: (chars: number) => void;
  setStreamingFiles: (files: string[]) => void;
  setStreamingStatus: (status: string) => void;
  setFilePlan: (plan: FilePlan | null) => void;
  updateFileProgress?: (path: string, updates: Partial<FileProgress>) => void;
  initFileProgressFromPlan?: (plan: FilePlan) => void;
}

export interface StreamingResult {
  fullText: string;
  chunkCount: number;
  detectedFiles: string[];
  streamResponse: GenerationResponse | null;
  currentFilePlan: FilePlan | null;
  /** Detected response format (json or marker) */
  format: StreamingFormat;
}

/** Error thrown when expected format doesn't match actual response */
export class FormatMismatchError extends Error {
  constructor(
    public expectedFormat: StreamingFormat,
    public actualContent: string
  ) {
    super(`Format mismatch: expected ${expectedFormat} format but response doesn't match`);
    this.name = 'FormatMismatchError';
  }
}

export interface UseStreamingResponseReturn {
  processStreamingResponse: (
    request: GenerationRequest,
    currentModel: string,
    genRequestId: string,
    genStartTime: number,
    /** Expected format - if set, will validate early and throw FormatMismatchError if mismatch */
    expectedFormat?: StreamingFormat
  ) => Promise<StreamingResult>;
}

/**
 * Convert MarkerFilePlan to FilePlan format
 */
function markerPlanToFilePlan(markerPlan: MarkerFilePlan): FilePlan {
  return {
    create: [...markerPlan.create, ...markerPlan.update],
    delete: markerPlan.delete,
    total: markerPlan.total,
    completed: [],
    sizes: markerPlan.sizes,
  };
}

/**
 * Parse file plan from streaming response (JSON format)
 * Supports both:
 * - Legacy format: // PLAN: {"create":[...],"update":[...],...}
 * - JSON v2 format: {"meta":...,"plan":{"create":[...],...},"manifest":[...],...}
 */
export function parseFilePlanFromStream(
  fullText: string
): { create: string[]; delete: string[]; total: number; completed: string[]; sizes?: Record<string, number> } | null {
  // Try JSON v2 format first (has "plan": object at root level)
  const jsonV2Result = parseJsonV2Plan(fullText);
  if (jsonV2Result) {
    return jsonV2Result;
  }

  // Try legacy // PLAN: comment format
  const planLineMatch = fullText.match(/\/\/\s*PLAN:\s*(\{.+)/);
  if (!planLineMatch) return null;

  try {
    let jsonStr = planLineMatch[1];
    // Find the balanced closing brace
    let braceCount = 0;
    let endIdx = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') braceCount++;
      if (jsonStr[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
    if (endIdx > 0) {
      jsonStr = jsonStr.substring(0, endIdx);
    }

    // Fix malformed JSON (e.g., "total":} -> remove it)
    jsonStr = jsonStr
      .replace(/"total"\s*:\s*[}\]]/g, '') // Remove "total":} or "total":]
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']'); // Remove trailing commas before ]

    const plan = JSON.parse(jsonStr);
    // Support both "create" and "update" keys
    const createFiles = plan.create || [];
    const updateFiles = plan.update || [];
    const allFiles = [...createFiles, ...updateFiles];

    if (allFiles.length > 0) {
      return {
        create: allFiles, // All files to generate (both new and updates)
        delete: plan.delete || [],
        total: plan.total || allFiles.length, // Fallback to calculated count
        completed: [],
        sizes: plan.sizes || undefined, // Extract sizes for progress tracking
      };
    }
  } catch {
    // Plan not complete yet or malformed - try regex extraction as fallback
    const createMatch = fullText.match(/"create"\s*:\s*\[([^\]]*)\]/);
    const updateMatch = fullText.match(/"update"\s*:\s*\[([^\]]*)\]/);

    if (createMatch || updateMatch) {
      const extractFiles = (match: RegExpMatchArray | null) => {
        if (!match) return [];
        return match[1].match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, '')) || [];
      };

      const createFiles = extractFiles(createMatch);
      const updateFiles = extractFiles(updateMatch);
      const allFiles = [...createFiles, ...updateFiles];

      if (allFiles.length > 0) {
        return {
          create: allFiles,
          delete: [],
          total: allFiles.length,
          completed: [],
        };
      }
    }
  }

  return null;
}

/**
 * Parse file plan from JSON v2 format
 * JSON v2 has: { "meta": {...}, "plan": {"create":[], "update":[], "delete":[]}, "manifest": [...] }
 */
function parseJsonV2Plan(
  fullText: string
): { create: string[]; delete: string[]; total: number; completed: string[]; sizes?: Record<string, number> } | null {
  // Check if this looks like JSON v2 (starts with { and has "plan": key)
  const trimmed = fullText.trim();
  if (!trimmed.startsWith('{')) return null;

  // Try to extract plan object using regex (more robust during streaming)
  const planMatch = fullText.match(/"plan"\s*:\s*\{([^}]*)\}/);
  if (!planMatch) return null;

  try {
    // Extract create/update/delete arrays from plan
    const planContent = planMatch[1];

    const extractArray = (key: string): string[] => {
      const match = planContent.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`));
      if (!match) return [];
      const items = match[1].match(/"([^"]+)"/g);
      return items ? items.map(s => s.replace(/"/g, '')) : [];
    };

    const createFiles = extractArray('create');
    const updateFiles = extractArray('update');
    const deleteFiles = extractArray('delete');
    const allFiles = [...createFiles, ...updateFiles];

    if (allFiles.length === 0) return null;

    // Try to extract sizes from manifest using matchAll
    const sizes: Record<string, number> = {};
    const manifestMatch = fullText.match(/"manifest"\s*:\s*\[([\s\S]*?)\]/);
    if (manifestMatch) {
      // Extract each manifest entry using matchAll
      const entryPattern = /\{\s*"path"\s*:\s*"([^"]+)"[^}]*"lines"\s*:\s*(\d+)/g;
      const entries = [...manifestMatch[1].matchAll(entryPattern)];
      for (const entry of entries) {
        sizes[entry[1]] = parseInt(entry[2], 10);
      }
    }

    // Try to extract batch info for completed files
    let completed: string[] = [];
    const batchMatch = fullText.match(/"batch"\s*:\s*\{([^}]*)\}/);
    if (batchMatch) {
      const completedMatch = batchMatch[1].match(/"completed"\s*:\s*\[([^\]]*)\]/);
      if (completedMatch) {
        const items = completedMatch[1].match(/"([^"]+)"/g);
        completed = items ? items.map(s => s.replace(/"/g, '')) : [];
      }
    }

    console.log('[parseJsonV2Plan] Detected JSON v2 plan:', {
      create: createFiles.length,
      update: updateFiles.length,
      delete: deleteFiles.length,
      hasSizes: Object.keys(sizes).length > 0,
    });

    return {
      create: allFiles,
      delete: deleteFiles,
      total: allFiles.length,
      completed,
      sizes: Object.keys(sizes).length > 0 ? sizes : undefined,
    };
  } catch (e) {
    console.debug('[parseJsonV2Plan] Parse error:', e);
    return null;
  }
}

/**
 * Parse file plan from simple comment format
 * Format: // filename.tsx followed by code, then // another-file.tsx, etc.
 */
function parseSimpleCommentPlan(
  fullText: string
): { create: string[]; delete: string[]; total: number; completed: string[]; sizes?: Record<string, number> } | null {
  // Match all file path comments
  const filePathRegex = /\/\/\s*((?:src\/)?[\w./-]+\.(?:tsx?|jsx?|css|json|md))\s*\n/g;
  const matches = [...fullText.matchAll(filePathRegex)];

  if (matches.length === 0) return null;

  const files: string[] = [];
  for (const match of matches) {
    let filePath = match[1];
    // Normalize path - add src/ prefix if not present
    if (!filePath.startsWith('src/')) {
      filePath = 'src/' + filePath;
    }
    if (!files.includes(filePath)) {
      files.push(filePath);
    }
  }

  if (files.length === 0) return null;

  console.log('[parseSimpleCommentPlan] Detected files from comments:', files);

  return {
    create: files,
    delete: [],
    total: files.length,
    completed: [],
    sizes: undefined, // No size info in this format
  };
}

/**
 * Calculate file progress based on streamed content (JSON format)
 * Estimates progress by measuring received chars vs expected line count
 * @param fullText - Full streamed text so far
 * @param filePath - File path to check
 * @param expectedLines - Expected line count from PLAN sizes
 * @returns Progress object with receivedChars and progress percentage
 */
function calculateFileProgressJson(
  fullText: string,
  filePath: string,
  expectedLines: number
): { receivedChars: number; progress: number; status: 'pending' | 'streaming' | 'complete' } {
  const CHARS_PER_LINE = 40; // Average chars per line estimate
  const expectedChars = expectedLines * CHARS_PER_LINE;

  // Escape special regex characters in file path
  const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find file content pattern: "path/to/file.tsx":"content..."
  // Using match() instead of matchAll() for simplicity
  const filePattern = new RegExp(`"${escapedPath}"\\s*:\\s*"`, 'g');
  const matches = [...fullText.matchAll(filePattern)];

  if (matches.length === 0) {
    return { receivedChars: 0, progress: 0, status: 'pending' };
  }

  const match = matches[0];
  const contentStart = (match.index ?? 0) + match[0].length;

  // Find content end (closing quote not preceded by backslash)
  let contentEnd = contentStart;
  let escaped = false;
  let foundEnd = false;

  for (let i = contentStart; i < fullText.length; i++) {
    const char = fullText[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      contentEnd = i;
      foundEnd = true;
      break;
    }
    contentEnd = i + 1; // Still streaming
  }

  const receivedChars = contentEnd - contentStart;
  const progress = Math.min(foundEnd ? 100 : 99, Math.round((receivedChars / expectedChars) * 100));

  return {
    receivedChars,
    progress,
    status: foundEnd ? 'complete' : 'streaming',
  };
}

/**
 * Calculate file progress based on streamed content (Marker format)
 * Looks for <!-- FILE:path --> content <!-- /FILE:path --> markers
 */
function calculateFileProgressMarker(
  fullText: string,
  filePath: string,
  expectedLines: number
): { receivedChars: number; progress: number; status: 'pending' | 'streaming' | 'complete' } {
  const CHARS_PER_LINE = 40;
  const expectedChars = expectedLines * CHARS_PER_LINE;

  // Escape special regex characters in file path
  const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check for opening marker
  const openPattern = new RegExp(`<!--\\s*FILE:${escapedPath}\\s*-->`);
  const openMatch = fullText.match(openPattern);

  if (!openMatch || openMatch.index === undefined) {
    return { receivedChars: 0, progress: 0, status: 'pending' };
  }

  const contentStart = openMatch.index + openMatch[0].length;

  // Check for closing marker
  const closePattern = new RegExp(`<!--\\s*/FILE:${escapedPath}\\s*-->`);
  const closeMatch = fullText.slice(contentStart).match(closePattern);

  if (closeMatch && closeMatch.index !== undefined) {
    // File is complete
    const contentEnd = contentStart + closeMatch.index;
    const receivedChars = contentEnd - contentStart;
    return {
      receivedChars,
      progress: 100,
      status: 'complete',
    };
  }

  // Still streaming - measure content so far
  const receivedChars = fullText.length - contentStart;
  const progress = Math.min(99, Math.round((receivedChars / expectedChars) * 100));

  return {
    receivedChars,
    progress,
    status: 'streaming',
  };
}

/**
 * Unified file progress calculator that handles both formats
 */
function calculateFileProgress(
  fullText: string,
  filePath: string,
  expectedLines: number,
  format: StreamingFormat
): { receivedChars: number; progress: number; status: 'pending' | 'streaming' | 'complete' } {
  if (format === 'marker') {
    return calculateFileProgressMarker(fullText, filePath, expectedLines);
  }
  return calculateFileProgressJson(fullText, filePath, expectedLines);
}

export function useStreamingResponse(callbacks: StreamingCallbacks): UseStreamingResponseReturn {
  const {
    setStreamingChars,
    setStreamingFiles,
    setStreamingStatus,
    setFilePlan,
    updateFileProgress,
    initFileProgressFromPlan,
  } = callbacks;

  /**
   * Process streaming response and detect files as they appear
   */
  const processStreamingResponse = useCallback(
    async (
      request: GenerationRequest,
      currentModel: string,
      genRequestId: string,
      _genStartTime: number,
      expectedFormat?: StreamingFormat
    ): Promise<StreamingResult> => {
      const manager = getProviderManager();
      let fullText = '';
      let detectedFiles: string[] = [];
      let chunkCount = 0;
      let streamResponse: GenerationResponse | null = null;
      let currentFilePlan: FilePlan | null = null;
      let planParsed = false;
      let detectedFormat: StreamingFormat = 'unknown';
      let formatValidated = false;

      // Progress tracking state
      let lastProgressUpdate = 0;
      const PROGRESS_UPDATE_INTERVAL = 100; // Throttle updates to every 100ms for smoother UI
      const fileStreamStartTimes = new Map<string, number>(); // Track when each file started streaming
      const completedFiles = new Set<string>(); // Track which files are complete
      const filesContentComplete = new Set<string>(); // Track which files have content complete (for logging)
      const MIN_STREAMING_DURATION = 500; // Minimum time a file should show as "streaming" (ms)
      const COMPLETION_STAGGER_DELAY = 200; // Delay between file completions (ms)

      // Create initial stream log entry
      const streamLogId = `stream-${genRequestId}`;
      debugLog.stream('generation', {
        id: streamLogId,
        model: currentModel,
        response: 'Streaming started...',
        metadata: { chunkCount: 0, totalChars: 0, filesDetected: 0, status: 'streaming' },
      });

      // Use streaming API
      streamResponse = await manager.generateStream(
        request,
        (chunk) => {
          const chunkText = chunk.text || '';
          fullText += chunkText;
          chunkCount++;
          setStreamingChars(fullText.length);

          // Try to detect format and parse file plan from the start of response
          if (!planParsed && fullText.length > 50) {
            // Detect format first (only once)
            if (detectedFormat === 'unknown') {
              if (isMarkerFormat(fullText)) {
                detectedFormat = 'marker';
                console.log('[Stream] Detected MARKER format');
              } else if (fullText.includes('// PLAN:')) {
                detectedFormat = 'json';
                console.log('[Stream] Detected JSON format (legacy with PLAN comment)');
              } else if (fullText.trim().startsWith('{') && (fullText.includes('"meta"') || fullText.includes('"plan"'))) {
                detectedFormat = 'json';
                console.log('[Stream] Detected JSON v2 format');
              } else if (fullText.includes('{"')) {
                detectedFormat = 'json';
                console.log('[Stream] Detected JSON format');
              } else if (/\/\/\s*(?:src\/)?[\w./-]+\.(?:tsx?|jsx?|css)\s*\n/.test(fullText)) {
                // Simple comment format: // filename.tsx followed by code
                detectedFormat = 'json'; // Will be handled by emergencyCodeBlockExtraction
                console.log('[Stream] Detected simple comment format (// filename.ext)');
              }
            }

            // Format validation disabled - parser handles both formats automatically
            // The early abort feature caused too many false positives
            if (expectedFormat === 'marker' && !formatValidated && fullText.length > 200) {
              formatValidated = true;
              console.log('[Stream] Marker format expected, parser will auto-detect');
            }

            // Parse plan based on detected format
            let parsedPlan: FilePlan | null = null;

            if (detectedFormat === 'marker') {
              const markerPlan = parseMarkerPlan(fullText);
              if (markerPlan) {
                parsedPlan = markerPlanToFilePlan(markerPlan);
              }
            } else {
              // Try JSON format first, then simple comment format
              parsedPlan = parseFilePlanFromStream(fullText);
              if (!parsedPlan) {
                parsedPlan = parseSimpleCommentPlan(fullText);
              }
            }

            if (parsedPlan) {
              currentFilePlan = parsedPlan;
              setFilePlan(currentFilePlan);
              planParsed = true;
              console.log(`[Stream] File plan detected (${detectedFormat}):`, currentFilePlan);
              const createCount = parsedPlan.create.length;
              setStreamingStatus(`📋 Plan: ${parsedPlan.total} files (${createCount} to generate)`);

              // Initialize file progress tracking if sizes are available
              if (initFileProgressFromPlan && parsedPlan.sizes) {
                initFileProgressFromPlan({
                  create: parsedPlan.create,
                  delete: parsedPlan.delete,
                  total: parsedPlan.total,
                  completed: [],
                  sizes: parsedPlan.sizes,
                });
                console.log('[Stream] File progress initialized with sizes:', parsedPlan.sizes);
              }
            }
          }

          // Update the stream log every 50 chunks
          if (chunkCount % 50 === 0) {
            try {
              debugLog.streamUpdate(streamLogId, {
                response: `Streaming... ${Math.round(fullText.length / 1024)}KB received`,
                metadata: {
                  chunkCount,
                  totalChars: fullText.length,
                  filesDetected: detectedFiles.length,
                  status: 'streaming',
                },
              });
            } catch (e) {
              console.debug('[Debug] Stream update failed:', e);
            }
          }

          // Try to detect file paths as they appear (format-aware)
          let newMatchedFiles: string[] = [];

          if (detectedFormat === 'marker') {
            // Marker format: look for <!-- FILE:path --> markers
            const markerFileMatches = fullText.match(/<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g);
            if (markerFileMatches) {
              newMatchedFiles = markerFileMatches
                .map((m) => {
                  const pathMatch = m.match(/FILE:([\w./-]+\.[a-zA-Z]+)/);
                  return pathMatch ? pathMatch[1] : '';
                })
                .filter((f) => f && !detectedFiles.includes(f));
            }
          } else {
            // JSON format: look for "path": patterns
            const jsonFileMatches = fullText.match(/"([^"]+\.(tsx?|jsx?|css|json|md|sql))"\s*:/g);
            if (jsonFileMatches) {
              newMatchedFiles = jsonFileMatches
                .map((m) => m.replace(/[":\s]/g, ''))
                .filter((f) => !detectedFiles.includes(f) && !f.includes('\\'));
            }
          }

          if (newMatchedFiles.length > 0) {
            detectedFiles = [...detectedFiles, ...newMatchedFiles];
            setStreamingFiles([...detectedFiles]);

            // Update status - show detected vs completed
            // Note: detectedFiles = files we've started receiving (path found)
            // completedFiles = files whose content is fully received
            if (currentFilePlan) {
              const completedCount = completedFiles.size;
              const streamingCount = detectedFiles.length - completedCount;

              if (completedCount >= currentFilePlan.total) {
                setStreamingStatus(`✅ ${currentFilePlan.total} files complete`);
              } else if (streamingCount > 0) {
                setStreamingStatus(
                  `📁 ${completedCount}/${currentFilePlan.total} complete, ${streamingCount} streaming...`
                );
              } else {
                setStreamingStatus(`📁 ${detectedFiles.length}/${currentFilePlan.total} files detected`);
              }
            } else {
              setStreamingStatus(`📁 ${detectedFiles.length} files detected`);
            }
          }

          // Update per-file progress during streaming (throttled for performance)
          // Each file has its own status based on content received:
          // - pending: Content hasn't started yet
          // - streaming: Content is being received (0-99%)
          // - complete: Content fully received (closing quote found) AND min duration passed
          const now = Date.now();
          if (updateFileProgress && currentFilePlan?.sizes && now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
            lastProgressUpdate = now;

            for (const filePath of currentFilePlan.create) {
              // Skip already completed files
              if (completedFiles.has(filePath)) continue;

              const expectedLines = currentFilePlan.sizes[filePath] || 100;
              const progress = calculateFileProgress(fullText, filePath, expectedLines, detectedFormat);

              // Only update if not pending (content has started)
              if (progress.status !== 'pending') {
                // Track when file started streaming
                if (!fileStreamStartTimes.has(filePath)) {
                  fileStreamStartTimes.set(filePath, now);
                  console.log(`[Stream] File started streaming: ${filePath}`);
                }

                const streamStartTime = fileStreamStartTimes.get(filePath) ?? now;
                const streamingDuration = now - streamStartTime;

                // Calculate staggered completion delay based on file INDEX in the plan
                // This ensures files complete sequentially, not all at once
                // Earlier files in the list complete first, regardless of actual content completion
                const fileIndex = currentFilePlan.create.indexOf(filePath);
                const staggerOffset = Math.max(0, fileIndex) * COMPLETION_STAGGER_DELAY;
                const requiredDuration = MIN_STREAMING_DURATION + staggerOffset;

                // Only allow completion if:
                // 1. Content is actually complete (closing quote found)
                // 2. File has been streaming for minimum duration + stagger offset
                const canComplete = progress.status === 'complete' && streamingDuration >= requiredDuration;

                if (canComplete) {
                  // Mark as complete
                  completedFiles.add(filePath);
                  updateFileProgress(filePath, {
                    ...progress,
                    status: 'complete',
                    progress: 100,
                  });

                  // Update filePlan.completed with actually completed files
                  if (currentFilePlan) {
                    currentFilePlan.completed = [...completedFiles].filter((f) => currentFilePlan.create.includes(f));
                    setFilePlan({ ...currentFilePlan });

                    // Update status
                    const completedCount = completedFiles.size;
                    if (completedCount >= currentFilePlan.total) {
                      setStreamingStatus(`✅ ${currentFilePlan.total} files complete, finalizing...`);
                    } else {
                      const streamingCount = detectedFiles.length - completedCount;
                      setStreamingStatus(
                        `📁 ${completedCount}/${currentFilePlan.total} complete${streamingCount > 0 ? `, ${streamingCount} streaming...` : ''}`
                      );
                    }
                  }

                  console.log(`[Stream] ✅ File completed: ${filePath} (index: ${fileIndex}, streamed: ${streamingDuration}ms, required: ${requiredDuration}ms)`);
                } else {
                  // Still streaming - show progress smoothly
                  // If content is complete but waiting for stagger, show 99%
                  const displayProgress = progress.status === 'complete'
                    ? 99
                    : Math.min(progress.progress, 99);

                  updateFileProgress(filePath, {
                    ...progress,
                    status: 'streaming',
                    progress: displayProgress,
                  });

                  // Log ONCE when content is complete but waiting for stagger
                  if (progress.status === 'complete' && !filesContentComplete.has(filePath)) {
                    filesContentComplete.add(filePath);
                    console.log(`[Stream] ⏳ File content complete, waiting: ${filePath} (index: ${fileIndex}, need ${requiredDuration - streamingDuration}ms more)`);
                  }
                }
              }
            }
          }

          // Update status with character count
          if (detectedFiles.length === 0) {
            setStreamingStatus(`⚡ Generating... (${Math.round(fullText.length / 1024)}KB)`);
          }
        },
        currentModel
      );

      // Mark stream as complete
      console.log('[Generation] Stream complete:', {
        chars: fullText.length,
        chunks: chunkCount,
        filesDetected: detectedFiles.length,
      });

      // Final sweep: Mark all remaining files as complete (stream ended)
      // This handles files that completed between throttle intervals
      // Apply staggered completion for visual feedback
      if (updateFileProgress && currentFilePlan?.sizes) {
        const remainingFiles = currentFilePlan.create.filter((f) => !completedFiles.has(f));
        const totalFiles = currentFilePlan.total;
        const planRef = currentFilePlan; // Capture reference for closures
        const finalFormat = detectedFormat; // Capture for closures

        // Mark remaining files complete with stagger delay
        remainingFiles.forEach((filePath, index) => {
          const delay = index * 150; // 150ms between each file completion

          setTimeout(() => {
            const expectedLines = planRef?.sizes?.[filePath] ?? 100;
            const progress = calculateFileProgress(fullText, filePath, expectedLines, finalFormat);

            if (progress.status === 'complete' || progress.progress > 0) {
              // Add to completedFiles and update progress
              completedFiles.add(filePath);
              updateFileProgress(filePath, {
                ...progress,
                status: 'complete',
                progress: 100,
              });

              // Update filePlan.completed
              const newCompleted = [...completedFiles].filter((f) => planRef.create.includes(f));
              setFilePlan({
                ...planRef,
                completed: newCompleted,
              });

              // Update status
              if (newCompleted.length >= totalFiles) {
                setStreamingStatus(`✅ All ${totalFiles} files complete`);
              } else {
                setStreamingStatus(`📁 ${newCompleted.length}/${totalFiles} complete`);
              }

              console.log(`[Stream] File finalized on stream end: ${filePath} (delay: ${delay}ms, ${newCompleted.length}/${totalFiles})`);
            }
          }, delay);
        });
      }

      try {
        debugLog.streamUpdate(
          streamLogId,
          {
            response: `Completed: ${Math.round(fullText.length / 1024)}KB, ${chunkCount} chunks`,
            metadata: {
              chunkCount,
              totalChars: fullText.length,
              filesDetected: detectedFiles.length,
              status: 'complete',
            },
          },
          true
        );
      } catch (e) {
        console.debug('[Debug] Final stream update failed:', e);
      }

      // Save raw response for debugging
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lastAIResponse = {
          raw: fullText,
          timestamp: Date.now(),
          chars: fullText.length,
          filesDetected: detectedFiles,
          format: detectedFormat,
        };
        console.log(`[Debug] Raw response saved to window.__lastAIResponse (${fullText.length} chars, format: ${detectedFormat})`);
      } catch (e) {
        console.debug('[Debug] Could not save raw response:', e);
      }

      return { fullText, chunkCount, detectedFiles, streamResponse, currentFilePlan, format: detectedFormat };
    },
    [setStreamingChars, setStreamingFiles, setFilePlan, setStreamingStatus, updateFileProgress, initFileProgressFromPlan]
  );

  return { processStreamingResponse };
}
