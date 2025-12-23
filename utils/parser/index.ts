/**
 * Parser Module Index
 *
 * Barrel export for AI response parser utilities.
 */

// Types
export type {
  ResponseFormat,
  FileAction,
  ParsedFile,
  BatchInfo,
  PlanInfo,
  ManifestEntry,
  MetaInfo,
  ParseResult,
  ParserOptions,
} from './types';

export { createEmptyResult } from './types';

// Patterns
export {
  findAllMatches,
  findFirstMatch,
} from './patterns';

// Format Detection
export { detectFormat } from './formatDetection';

// Parsers
export { parseJsonV1, parseJsonV2, prepareJsonString, repairJson } from './jsonParser';
export { parseMarker, parseMarkerMeta, parseMarkerPlan, parseMarkerManifest, parseMarkerBatch, parseMarkerExplanation, parseMarkerFiles } from './markerParser';
export { parseFallback } from './fallbackParser';
