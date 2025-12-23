/**
 * Parser Types
 *
 * Type definitions for the AI response parser.
 */

/** Detected response format */
export type ResponseFormat =
  | 'json-v1'
  | 'json-v2'
  | 'marker-v1'
  | 'marker-v2'
  | 'fallback'
  | 'unknown';

/** File action type */
export type FileAction = 'create' | 'update' | 'delete';

/** Parsed file entry */
export interface ParsedFile {
  path: string;
  content: string;
  action: FileAction;
  lines?: number;
  tokens?: number;
  status?: 'included' | 'pending' | 'marked' | 'skipped';
  /** True if file was recovered from incomplete/malformed response */
  recovered?: boolean;
}

/** Batch information */
export interface BatchInfo {
  current: number;
  total: number;
  isComplete: boolean;
  completed: string[];
  remaining: string[];
  nextBatchHint?: string;
}

/** Plan information */
export interface PlanInfo {
  create: string[];
  update: string[];
  delete: string[];
}

/** Manifest entry */
export interface ManifestEntry {
  path: string;
  action: FileAction;
  lines: number;
  tokens: number;
  status: 'included' | 'pending' | 'marked' | 'skipped';
}

/** Meta information */
export interface MetaInfo {
  format: string;
  version: string;
  timestamp?: string;
}

/** Parse result */
export interface ParseResult {
  /** Detected format */
  format: ResponseFormat;
  /** Successfully parsed files */
  files: Record<string, string>;
  /** Explanation text */
  explanation?: string;
  /** Plan information */
  plan?: PlanInfo;
  /** Manifest entries */
  manifest?: ManifestEntry[];
  /** Batch information */
  batch?: BatchInfo;
  /** Meta information */
  meta?: MetaInfo;
  /** Whether response was truncated */
  truncated: boolean;
  /** Files that started but weren't completed */
  incompleteFiles?: string[];
  /** Files that were recovered from malformed response */
  recoveredFiles?: string[];
  /** Parse warnings */
  warnings: string[];
  /** Parse errors (non-fatal) */
  errors: string[];
  /** Deleted files */
  deletedFiles?: string[];
  /** Raw response for debugging */
  rawResponse?: string;
}

/** Parser options */
export interface ParserOptions {
  /** Include raw response in result */
  includeRaw?: boolean;
  /** Maximum response size to process (default: 500KB) */
  maxSize?: number;
  /** Attempt aggressive recovery on parse failure */
  aggressiveRecovery?: boolean;
}

/**
 * Create an empty parse result
 */
export function createEmptyResult(): ParseResult {
  return {
    format: 'unknown',
    files: {},
    truncated: false,
    warnings: [],
    errors: [],
  };
}
