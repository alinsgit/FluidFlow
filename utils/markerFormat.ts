/**
 * Marker Format Parser
 *
 * Alternative response format using HTML-style markers instead of JSON.
 * Benefits:
 * - No JSON escaping needed (newlines, quotes work naturally)
 * - Easy file boundary detection for streaming
 * - Partial responses still parseable
 * - Less prone to AI formatting errors
 *
 * @module utils/markerFormat
 *
 * Structure:
 * - utils/markerFormat/types.ts        - Type definitions
 * - utils/markerFormat/detection.ts    - Format detection
 * - utils/markerFormat/blockParsers.ts - Block parsing (PLAN, META, etc.)
 * - utils/markerFormat/fileParsers.ts  - FILE block parsing
 * - utils/markerFormat/utils.ts        - Utility functions
 */

import type { GenerationMeta } from './cleanCode';

// Re-export types
export type {
  MarkerMeta,
  MarkerManifestEntry,
  MarkerBatch,
  MarkerFilePlan,
  MarkerFormatResponse,
} from './markerFormat/types';

// Re-export detection functions
export { isMarkerFormat, isMarkerFormatV2 } from './markerFormat/detection';

// Re-export block parsers
export {
  parseMarkerPlan,
  parseMarkerExplanation,
  parseMarkerGenerationMeta,
  parseMarkerMeta,
  parseMarkerManifest,
  parseMarkerBatch,
} from './markerFormat/blockParsers';

// Re-export file parsers
export { parseMarkerFiles, parseStreamingMarkerFiles } from './markerFormat/fileParsers';

// Re-export utilities
export {
  validateManifest,
  extractMarkerFileList,
  getMarkerStreamingStatus,
  stripMarkerMetadata,
} from './markerFormat/utils';

// Import for local use
import { isMarkerFormat } from './markerFormat/detection';
import {
  parseMarkerPlan,
  parseMarkerExplanation,
  parseMarkerGenerationMeta,
  parseMarkerMeta,
  parseMarkerManifest,
  parseMarkerBatch,
} from './markerFormat/blockParsers';
import { parseMarkerFiles, parseStreamingMarkerFiles } from './markerFormat/fileParsers';
import { validateManifest } from './markerFormat/utils';
import type { MarkerFormatResponse } from './markerFormat/types';

// Re-export GenerationMeta for backward compatibility
export type { GenerationMeta } from './cleanCode';

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Main parser for marker format responses
 */
export function parseMarkerFormatResponse(response: string): MarkerFormatResponse | null {
  if (!response || !isMarkerFormat(response)) {
    return null;
  }

  try {
    // Parse all components (v1 + v2)
    const plan = parseMarkerPlan(response);
    const explanation = parseMarkerExplanation(response);
    const generationMeta = parseMarkerGenerationMeta(response) as GenerationMeta | undefined;
    const files = parseMarkerFiles(response);

    // Parse v2 blocks (optional - backwards compatible)
    const meta = parseMarkerMeta(response);
    const manifest = parseMarkerManifest(response);
    const batch = parseMarkerBatch(response);

    // Log v2 format detection
    if (meta) {
      console.log(`[parseMarkerFormatResponse] Marker format v${meta.version} detected`);
    }

    // Check if we have any files
    if (Object.keys(files).length === 0) {
      // Check for streaming/incomplete files
      const { complete, streaming } = parseStreamingMarkerFiles(response);

      // Log incomplete files as warnings
      if (Object.keys(streaming).length > 0) {
        console.warn('[parseMarkerFormatResponse] INCOMPLETE FILES DETECTED (will be excluded):', Object.keys(streaming));
      }

      if (Object.keys(complete).length === 0) {
        console.warn('[parseMarkerFormatResponse] No complete files found in marker format response');
        // Only return null if no complete files AND no streaming files
        if (Object.keys(streaming).length === 0) {
          return null;
        }
        // If we have streaming files but no complete ones, return truncated result with ONLY complete files
        return {
          files: complete,
          explanation,
          plan: plan || undefined,
          generationMeta,
          truncated: true,
          incompleteFiles: Object.keys(streaming), // Track which files are incomplete
          // V2 additions
          meta,
          manifest,
          batch,
          validation: validateManifest(manifest, complete),
        };
      }

      // Validate against manifest
      const validation = validateManifest(manifest, complete);
      if (manifest && !validation.isValid) {
        console.warn('[parseMarkerFormatResponse] MANIFEST VALIDATION FAILED - missing files:', validation.missing);
      }

      // Return ONLY complete files - do NOT include streaming/incomplete files
      return {
        files: complete,
        explanation,
        plan: plan || undefined,
        generationMeta,
        truncated: Object.keys(streaming).length > 0,
        incompleteFiles: Object.keys(streaming).length > 0 ? Object.keys(streaming) : undefined,
        // V2 additions
        meta,
        manifest,
        batch,
        validation,
      };
    }

    // Check for any incomplete files even when we have complete ones
    const { streaming } = parseStreamingMarkerFiles(response);
    const incompleteFiles = Object.keys(streaming).filter(f => !files[f]);

    if (incompleteFiles.length > 0) {
      console.warn('[parseMarkerFormatResponse] Some files are incomplete:', incompleteFiles);
    }

    // Validate against manifest
    const validation = validateManifest(manifest, files);
    if (manifest && !validation.isValid) {
      console.warn('[parseMarkerFormatResponse] MANIFEST VALIDATION FAILED - missing files:', validation.missing);
    }

    // Log batch info if present
    if (batch && !batch.isComplete) {
      console.log(`[parseMarkerFormatResponse] Batch ${batch.current}/${batch.total} - remaining: ${batch.remaining.length} files`);
    }

    return {
      files,
      explanation,
      plan: plan || undefined,
      generationMeta,
      truncated: incompleteFiles.length > 0,
      incompleteFiles: incompleteFiles.length > 0 ? incompleteFiles : undefined,
      // V2 additions
      meta,
      manifest,
      batch,
      validation,
    };
  } catch (error) {
    console.error('[parseMarkerFormatResponse] Parse error:', error);
    return null;
  }
}
