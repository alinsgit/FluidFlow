/**
 * Marker Format Module Index
 *
 * Barrel export for marker format parser utilities.
 */

// Types
export type {
  MarkerMeta,
  MarkerManifestEntry,
  MarkerBatch,
  MarkerFilePlan,
  MarkerFormatResponse,
  ManifestValidation,
  StreamingParseResult,
  StreamingStatus,
} from './types';

// Detection
export { isMarkerFormat, isMarkerFormatV2 } from './detection';

// Block Parsers
export {
  parseMarkerPlan,
  parseMarkerExplanation,
  parseMarkerGenerationMeta,
  parseMarkerMeta,
  parseMarkerManifest,
  parseMarkerBatch,
} from './blockParsers';

// File Parsers
export { parseMarkerFiles, parseStreamingMarkerFiles, buildFilePattern } from './fileParsers';

// Utilities
export {
  validateManifest,
  extractMarkerFileList,
  getMarkerStreamingStatus,
  stripMarkerMetadata,
} from './utils';
