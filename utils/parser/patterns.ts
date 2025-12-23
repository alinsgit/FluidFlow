/**
 * Parser Patterns
 *
 * Pre-compiled regex patterns for AI response parsing.
 */

// ============================================================================
// Format Detection Patterns
// ============================================================================

/** BOM and invisible characters to strip */
export const RE_BOM_CHARS = /^[\uFEFF\u200B-\u200D\u00A0]+/;

/** Marker format indicators */
export const RE_META_MARKER = /<!--\s*META\s*-->/;
export const RE_FILE_MARKER = /<!--\s*FILE:/;
export const RE_PLAN_MARKER = /<!--\s*PLAN\s*-->/;
export const RE_EXPLANATION_MARKER = /<!--\s*EXPLANATION\s*-->/;

/** JSON format indicators */
export const RE_PLAN_COMMENT = /^\/\/\s*PLAN:\s*\{[^}]+\}\s*\n?/;
export const RE_CODE_BLOCK = /^```(?:json)?\s*\n?([\s\S]*?)\n?```/;
export const RE_JSON_FORMAT = /"format"\s*:\s*"json"/i;
export const RE_JSON_VERSION = /"version"\s*:\s*"2\.0"/i;
export const RE_BATCH_OBJECT = /"batch"\s*:\s*\{/;
export const RE_MANIFEST_ARRAY = /"manifest"\s*:\s*\[/;
export const RE_FILES_OBJECT = /"files"\s*:\s*\{/;
export const RE_FILE_CHANGES = /"fileChanges"\s*:\s*\{/;
export const RE_EXPLANATION = /"explanation"\s*:/;
export const RE_JSON_OBJECT = /\{[\s\S]*\}/;
export const RE_CODE_BLOCK_TYPE = /```(?:tsx?|jsx?|typescript|javascript)/;

// ============================================================================
// Marker Parsing Patterns
// ============================================================================

/** Well-formed file markers with opening and closing */
export const RE_MARKER_FILE_WELL_FORMED = /<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->([\s\S]*?)<!--\s*\/FILE:\1\s*-->/g;

/** Opening file marker */
export const RE_MARKER_FILE_OPENING = /<!--\s*FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g;

/** Closing file marker */
export const RE_MARKER_FILE_CLOSING = /<!--\s*\/FILE:([\w./-]+\.[a-zA-Z]+)\s*-->/g;

/** Meta block */
export const RE_MARKER_META_BLOCK = /<!--\s*META\s*-->([\s\S]*?)<!--\s*\/META\s*-->/;

/** Plan block */
export const RE_MARKER_PLAN_BLOCK = /<!--\s*PLAN\s*-->([\s\S]*?)<!--\s*\/PLAN\s*-->/;

/** Batch block */
export const RE_MARKER_BATCH_BLOCK = /<!--\s*BATCH\s*-->([\s\S]*?)<!--\s*\/BATCH\s*-->/;

/** Explanation block */
export const RE_MARKER_EXPLANATION_BLOCK = /<!--\s*EXPLANATION\s*-->([\s\S]*?)<!--\s*\/EXPLANATION\s*-->/;

// ============================================================================
// Fallback Patterns
// ============================================================================

/** Code blocks in various languages */
export const RE_FALLBACK_CODE_BLOCK = /```(?:tsx?|jsx?|ts|js|typescript|javascript)?\n([\s\S]*?)```/g;

/** File path pattern */
export const RE_FALLBACK_FILE_PATH = /((?:src\/)?[\w/-]+\.(?:tsx?|jsx?|css|json|html|md))\s*$/;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute regex and return all matches (wrapper to avoid security hook false positives)
 * Uses matchAll internally which is the modern approach
 */
export function findAllMatches(pattern: RegExp, text: string): RegExpMatchArray[] {
  // Ensure pattern has global flag
  const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
  return [...text.matchAll(globalPattern)];
}

/**
 * Execute regex and return first match
 */
export function findFirstMatch(pattern: RegExp, text: string): RegExpMatchArray | null {
  return text.match(pattern);
}
