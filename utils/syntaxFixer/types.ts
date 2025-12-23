/**
 * Syntax Fixer Types
 *
 * Type definitions for syntax error detection and auto-repair.
 */

// ============================================================================
// Error Pattern Types
// ============================================================================

/**
 * Definition of an error pattern for detection and fixing
 */
export interface ErrorPattern {
  name: string;
  description: string;
  detect: RegExp;
  fix: (match: RegExpMatchArray, code: string) => string;
  priority: number; // Lower = run first
}

/**
 * Represents a JSX tag found in the code
 */
export interface JsxTag {
  name: string;
  isClosing: boolean;
  isSelfClosing: boolean;
  line: number;
  column: number;
  index: number;
}

/**
 * Information about an import statement
 */
export interface ImportInfo {
  source: string;
  defaultImport: string | null;
  namedImports: string[];
  namespaceImport: string | null;
  typeOnly: boolean;
  line: number;
  fullMatch: string;
}

/**
 * Result of applying syntax fixes
 */
export interface FixResult {
  code: string;
  fixesApplied: string[];
  issues: string[];
}

/**
 * Information about a bracket character
 */
export interface BracketInfo {
  char: string;
  line: number;
  column: number;
  index: number;
}
