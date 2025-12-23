/**
 * Marker Format Types
 *
 * Type definitions for the marker format parser.
 */

import type { GenerationMeta } from '../cleanCode';

// ============================================================================
// Core Types
// ============================================================================

/**
 * META block - Format metadata
 *
 * <!-- META -->
 * format: marker
 * version: 2.0
 * timestamp: 2025-01-15T10:30:00Z
 * <!-- /META -->
 */
export interface MarkerMeta {
  format: string;
  version: string;
  timestamp?: string;
}

/**
 * MANIFEST entry - File details from table
 *
 * | File | Action | Lines | Tokens | Status |
 * | src/App.tsx | create | 45 | ~320 | included |
 */
export interface MarkerManifestEntry {
  file: string;
  action: 'create' | 'update' | 'delete';
  lines: number;
  tokens: number;
  status: 'included' | 'marked' | 'pending' | 'skipped';
}

/**
 * BATCH block - Multi-batch generation info
 *
 * <!-- BATCH -->
 * current: 1
 * total: 3
 * isComplete: false
 * completed: src/App.tsx, src/components/Header.tsx
 * remaining: src/utils/helpers.ts, src/hooks/useAuth.ts
 * nextBatchHint: Utility functions and type definitions
 * <!-- /BATCH -->
 */
export interface MarkerBatch {
  current: number;
  total: number;
  isComplete: boolean;
  completed: string[];
  remaining: string[];
  nextBatchHint?: string;
}

/**
 * File plan structure from marker format
 */
export interface MarkerFilePlan {
  create: string[];
  update: string[];
  delete: string[];
  total: number;
  sizes?: Record<string, number>;
}

/**
 * Validation result for manifest
 */
export interface ManifestValidation {
  expected: string[];
  received: string[];
  missing: string[];
  extra: string[];
  isValid: boolean;
}

/**
 * Parsed marker format response (v2 enhanced)
 */
export interface MarkerFormatResponse {
  files: Record<string, string>;
  explanation?: string;
  plan?: MarkerFilePlan;
  generationMeta?: GenerationMeta;
  truncated?: boolean;
  /** Files that were started but not completed (missing closing marker) */
  incompleteFiles?: string[];
  // V2 additions
  meta?: MarkerMeta;
  manifest?: MarkerManifestEntry[];
  batch?: MarkerBatch;
  /** Validation result: files in manifest vs files actually included */
  validation?: ManifestValidation;
}

/**
 * Streaming parse result
 */
export interface StreamingParseResult {
  complete: Record<string, string>;
  streaming: Record<string, string>;
  currentFile: string | null;
}

/**
 * Streaming status
 */
export interface StreamingStatus {
  pending: string[];
  streaming: string[];
  complete: string[];
}
