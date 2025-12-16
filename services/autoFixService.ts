/**
 * Robust Auto-Fix Service
 * Bulletproof error fixing with safeguards against crashes and infinite loops
 */

import { trySimpleFix, canTrySimpleFix, getFixTypeLabel } from '../utils/simpleFixes';

// ============================================================================
// Types
// ============================================================================

export interface AutoFixResult {
  success: boolean;
  newCode: string;
  description: string;
  fixType: string;
  error?: string;
  wasAINeeded: boolean;
}

export interface FixAttempt {
  errorMessage: string;
  timestamp: number;
  fixApplied: string | null;
  success: boolean;
}

// Fix analytics for tracking success rates
export interface FixAnalytics {
  totalAttempts: number;
  successfulFixes: number;
  failedFixes: number;
  fixesByCategory: Record<string, { attempts: number; successes: number }>;
  fixesByType: Record<string, { attempts: number; successes: number }>;
  averageFixTime: number;
  recentFixes: Array<{
    timestamp: number;
    errorSignature: string;
    category: string;
    fixType: string;
    success: boolean;
    timeMs: number;
  }>;
}

// Global analytics instance
const fixAnalytics: FixAnalytics = {
  totalAttempts: 0,
  successfulFixes: 0,
  failedFixes: 0,
  fixesByCategory: {},
  fixesByType: {},
  averageFixTime: 0,
  recentFixes: []
};

/**
 * Record a fix attempt for analytics
 */
export function recordFixAttempt(
  errorMessage: string,
  category: string,
  fixType: string,
  success: boolean,
  timeMs: number
): void {
  fixAnalytics.totalAttempts++;

  if (success) {
    fixAnalytics.successfulFixes++;
  } else {
    fixAnalytics.failedFixes++;
  }

  // Update category stats
  if (!fixAnalytics.fixesByCategory[category]) {
    fixAnalytics.fixesByCategory[category] = { attempts: 0, successes: 0 };
  }
  fixAnalytics.fixesByCategory[category].attempts++;
  if (success) {
    fixAnalytics.fixesByCategory[category].successes++;
  }

  // Update fix type stats
  if (!fixAnalytics.fixesByType[fixType]) {
    fixAnalytics.fixesByType[fixType] = { attempts: 0, successes: 0 };
  }
  fixAnalytics.fixesByType[fixType].attempts++;
  if (success) {
    fixAnalytics.fixesByType[fixType].successes++;
  }

  // Update average fix time
  const totalTime = fixAnalytics.averageFixTime * (fixAnalytics.totalAttempts - 1) + timeMs;
  fixAnalytics.averageFixTime = totalTime / fixAnalytics.totalAttempts;

  // Keep last 50 fixes
  fixAnalytics.recentFixes.unshift({
    timestamp: Date.now(),
    errorSignature: errorMessage.slice(0, 100),
    category,
    fixType,
    success,
    timeMs
  });

  if (fixAnalytics.recentFixes.length > 50) {
    fixAnalytics.recentFixes.pop();
  }

  // Log analytics periodically
  if (fixAnalytics.totalAttempts % 10 === 0) {
    console.log('[AutoFix Analytics]', {
      total: fixAnalytics.totalAttempts,
      successRate: `${((fixAnalytics.successfulFixes / fixAnalytics.totalAttempts) * 100).toFixed(1)}%`,
      avgTime: `${fixAnalytics.averageFixTime.toFixed(0)}ms`
    });
  }
}

/**
 * Get current fix analytics
 */
export function getFixAnalytics(): FixAnalytics {
  return { ...fixAnalytics };
}

/**
 * Get success rate for a specific category
 */
export function getCategorySuccessRate(category: string): number {
  const stats = fixAnalytics.fixesByCategory[category];
  if (!stats || stats.attempts === 0) return 0;
  return stats.successes / stats.attempts;
}

interface FixHistoryEntry {
  errorHash: string;
  attempts: number;
  lastAttempt: number;
  fixed: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Maximum attempts for same error before giving up
  MAX_ATTEMPTS_PER_ERROR: 3,
  // Time window for counting attempts (ms)
  ATTEMPT_WINDOW: 30000, // 30 seconds
  // Minimum time between fixes (ms)
  MIN_FIX_INTERVAL: 500,
  // Maximum code size to process (chars)
  MAX_CODE_SIZE: 500000, // 500KB
  // Timeout for fix operations (ms)
  FIX_TIMEOUT: 5000,
  // History retention time (ms)
  HISTORY_RETENTION: 60000, // 1 minute
};

// ============================================================================
// State Management
// ============================================================================

class AutoFixState {
  private fixHistory: Map<string, FixHistoryEntry> = new Map();
  private recentFixes: FixAttempt[] = [];
  private lastFixTime = 0;
  private isFixing = false;
  private fixQueue: Array<{ error: string; code: string; resolve: (result: AutoFixResult) => void }> = [];

  /**
   * Generate a semantic hash for an error message (for deduplication)
   * This extracts the error "signature" - the meaningful parts that identify the error type
   */
  private hashError(error: string): string {
    // Extract error signature components
    const signature = this.extractErrorSignature(error);

    // Hash the signature
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Extract a semantic signature from an error message
   * This normalizes the error to its core meaning, removing variable parts
   */
  private extractErrorSignature(error: string): string {
    const errorLower = error.toLowerCase();

    // Bare specifier errors - extract the path
    const bareSpecifierMatch = error.match(/["']?(src\/[\w./-]+)["']?\s*(?:was a bare specifier|was not remapped)/i);
    if (bareSpecifierMatch) {
      return `bare-specifier:${bareSpecifierMatch[1]}`;
    }

    // "X is not defined" errors - extract the identifier
    const notDefinedMatch = error.match(/['"]?(\w+)['"]?\s+is\s+not\s+defined/i);
    if (notDefinedMatch) {
      return `not-defined:${notDefinedMatch[1].toLowerCase()}`;
    }

    // "Cannot find module" errors
    const moduleMatch = error.match(/cannot find module ['"]([^'"]+)['"]/i);
    if (moduleMatch) {
      return `module-not-found:${moduleMatch[1]}`;
    }

    // "Cannot read property X of undefined/null"
    const propMatch = error.match(/cannot read propert(?:y|ies) (?:of (?:undefined|null) \(reading )?['"](\w+)['"]/i);
    if (propMatch) {
      return `property-access:${propMatch[1].toLowerCase()}`;
    }

    // "X is not a function"
    const notFunctionMatch = error.match(/['"]?(\w+)['"]?\s+is\s+not\s+a\s+function/i);
    if (notFunctionMatch) {
      return `not-function:${notFunctionMatch[1].toLowerCase()}`;
    }

    // Syntax errors - extract the token
    const syntaxMatch = error.match(/unexpected token ['"]?([^'"]+)['"]?/i);
    if (syntaxMatch) {
      return `syntax:unexpected-${syntaxMatch[1].toLowerCase()}`;
    }

    // Missing bracket/brace errors
    if (errorLower.includes("expected '}'") || errorLower.includes('missing }')) {
      return 'syntax:missing-brace';
    }
    if (errorLower.includes("expected ')'") || errorLower.includes('missing )')) {
      return 'syntax:missing-paren';
    }
    if (errorLower.includes("expected ']'") || errorLower.includes('missing ]')) {
      return 'syntax:missing-bracket';
    }

    // JSX errors
    if (errorLower.includes('unterminated jsx') || errorLower.includes('expected corresponding jsx closing tag')) {
      const tagMatch = error.match(/<\/?(\w+)/);
      return `jsx:unclosed-${tagMatch ? tagMatch[1].toLowerCase() : 'tag'}`;
    }

    // React key prop error
    if (errorLower.includes('unique "key" prop') || errorLower.includes('each child in a list')) {
      return 'react:missing-key';
    }

    // Hook errors
    if (errorLower.includes('hooks can only be called') || errorLower.includes('invalid hook call')) {
      return 'react:invalid-hook';
    }

    // TypeScript errors - extract the error code if present
    const tsErrorMatch = error.match(/TS(\d+)/);
    if (tsErrorMatch) {
      return `typescript:TS${tsErrorMatch[1]}`;
    }

    // Transpilation errors - extract the file
    const transpileMatch = error.match(/transpilation failed for\s+([\w./]+)/i);
    if (transpileMatch) {
      return `transpile:${transpileMatch[1]}`;
    }

    // Fallback: normalize and truncate
    const normalized = error
      .toLowerCase()
      .replace(/line\s*\d+/gi, '')
      .replace(/:\d+:\d+/g, '')
      .replace(/at\s+\S+\s+\([^)]+\)/g, '')
      .replace(/\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);

    return `generic:${normalized}`;
  }

  /**
   * Check if we should attempt to fix this error
   */
  canAttemptFix(error: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const errorHash = this.hashError(error);

    // Check rate limiting
    if (now - this.lastFixTime < CONFIG.MIN_FIX_INTERVAL) {
      return { allowed: false, reason: 'Rate limited - too many fixes' };
    }

    // Clean up old history
    this.cleanupHistory();

    // Check attempt history for this error
    const history = this.fixHistory.get(errorHash);
    if (history) {
      if (history.fixed) {
        return { allowed: false, reason: 'Error already fixed' };
      }
      if (history.attempts >= CONFIG.MAX_ATTEMPTS_PER_ERROR) {
        return { allowed: false, reason: `Max attempts (${CONFIG.MAX_ATTEMPTS_PER_ERROR}) reached for this error` };
      }
    }

    return { allowed: true };
  }

  /**
   * Record a fix attempt
   */
  recordAttempt(error: string, success: boolean, fixApplied: string | null): void {
    const now = Date.now();
    const errorHash = this.hashError(error);

    // Update history
    const existing = this.fixHistory.get(errorHash);
    if (existing) {
      existing.attempts++;
      existing.lastAttempt = now;
      existing.fixed = success;
    } else {
      this.fixHistory.set(errorHash, {
        errorHash,
        attempts: 1,
        lastAttempt: now,
        fixed: success
      });
    }

    // Record attempt
    this.recentFixes.push({
      errorMessage: error.slice(0, 200), // Truncate long errors
      timestamp: now,
      fixApplied,
      success
    });

    this.lastFixTime = now;
  }

  /**
   * Clean up old history entries
   */
  private cleanupHistory(): void {
    const now = Date.now();
    const cutoff = now - CONFIG.HISTORY_RETENTION;

    // Clean fix history
    for (const [hash, entry] of this.fixHistory.entries()) {
      if (entry.lastAttempt < cutoff && !entry.fixed) {
        this.fixHistory.delete(hash);
      }
    }

    // Clean recent fixes
    this.recentFixes = this.recentFixes.filter(f => f.timestamp > cutoff);
  }

  /**
   * Check if currently fixing
   */
  get isCurrentlyFixing(): boolean {
    return this.isFixing;
  }

  /**
   * Set fixing state
   */
  setFixing(value: boolean): void {
    this.isFixing = value;
  }

  /**
   * Get recent fix attempts for debugging
   */
  getRecentAttempts(): FixAttempt[] {
    return [...this.recentFixes];
  }

  /**
   * Reset all state (for testing or manual reset)
   */
  reset(): void {
    this.fixHistory.clear();
    this.recentFixes = [];
    this.lastFixTime = 0;
    this.isFixing = false;
    this.fixQueue = [];
  }
}

// Singleton instance
const state = new AutoFixState();

// ============================================================================
// Code Validation
// ============================================================================

/**
 * Basic syntax validation for JavaScript/TypeScript/JSX
 */
function validateCodeSyntax(code: string): { valid: boolean; error?: string } {
  try {
    // Check for balanced brackets
    const brackets: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    let templateDepth = 0;
    let inComment = false;
    let inBlockComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1] || '';
      const prevChar = i > 0 ? code[i - 1] : '';

      // Skip comments
      if (!inString && !inTemplate) {
        if (char === '/' && nextChar === '/') {
          inComment = true;
          continue;
        }
        if (inComment && char === '\n') {
          inComment = false;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
          continue;
        }
      }
      if (inComment || inBlockComment) continue;

      // Track strings
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString && !inTemplate) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar) {
          inString = false;
        }
        continue;
      }

      // Track template literals
      if (char === '`' && prevChar !== '\\') {
        if (!inString) {
          inTemplate = !inTemplate;
          if (inTemplate) templateDepth = 0;
        }
        continue;
      }

      // Track template expressions
      if (inTemplate && char === '$' && nextChar === '{') {
        templateDepth++;
        continue;
      }

      // Skip content inside strings and templates (except for nested braces)
      if (inString) continue;
      if (inTemplate && templateDepth === 0) continue;

      // Track brackets
      if (brackets[char]) {
        stack.push(brackets[char]);
      } else if (char === ')' || char === ']' || char === '}') {
        if (inTemplate && char === '}' && templateDepth > 0) {
          templateDepth--;
          continue;
        }
        if (stack.length === 0) {
          return { valid: false, error: `Unexpected '${char}' at position ${i}` };
        }
        const expected = stack.pop();
        if (expected !== char) {
          return { valid: false, error: `Expected '${expected}' but found '${char}' at position ${i}` };
        }
      }
    }

    if (stack.length > 0) {
      return { valid: false, error: `Missing closing '${stack[stack.length - 1]}'` };
    }

    if (inString) {
      return { valid: false, error: 'Unterminated string' };
    }

    if (inTemplate) {
      return { valid: false, error: 'Unterminated template literal' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Validation error: ${e}` };
  }
}

/**
 * Check if code has obvious JSX issues
 */
function validateJSXBasics(code: string): { valid: boolean; error?: string } {
  try {
    // Check for common JSX issues
    // Note: This is a basic check, not a full parser

    // Check for unclosed JSX tags (simple heuristic)
    const jsxTagPattern = /<([A-Z][a-zA-Z0-9]*)[^>]*(?<!\/)\s*>/g;
    const selfClosingPattern = /<([A-Z][a-zA-Z0-9]*)[^>]*\/\s*>/g;
    const closingTagPattern = /<\/([A-Z][a-zA-Z0-9]*)>/g;

    const openTags: Record<string, number> = {};
    const closeTags: Record<string, number> = {};
    const selfCloseTags: Record<string, number> = {};

    let match;
    while ((match = jsxTagPattern.exec(code)) !== null) {
      const tag = match[1];
      openTags[tag] = (openTags[tag] || 0) + 1;
    }

    while ((match = selfClosingPattern.exec(code)) !== null) {
      const tag = match[1];
      selfCloseTags[tag] = (selfCloseTags[tag] || 0) + 1;
    }

    while ((match = closingTagPattern.exec(code)) !== null) {
      const tag = match[1];
      closeTags[tag] = (closeTags[tag] || 0) + 1;
    }

    // Adjust open tags by subtracting self-closing
    for (const tag of Object.keys(selfCloseTags)) {
      if (openTags[tag]) {
        openTags[tag] -= selfCloseTags[tag];
      }
    }

    // Check for mismatched tags
    for (const tag of Object.keys(openTags)) {
      const opens = openTags[tag] || 0;
      const closes = closeTags[tag] || 0;
      if (opens > closes) {
        return { valid: false, error: `Unclosed <${tag}> tag(s)` };
      }
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: `JSX validation error: ${e}` };
  }
}

/**
 * Comprehensive code validation
 */
function validateCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Size check
  if (code.length > CONFIG.MAX_CODE_SIZE) {
    errors.push('Code exceeds maximum size limit');
  }

  // Empty check
  if (!code.trim()) {
    errors.push('Code is empty');
  }

  // Syntax validation
  const syntaxResult = validateCodeSyntax(code);
  if (!syntaxResult.valid && syntaxResult.error) {
    errors.push(syntaxResult.error);
  }

  // JSX validation
  const jsxResult = validateJSXBasics(code);
  if (!jsxResult.valid && jsxResult.error) {
    errors.push(jsxResult.error);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Safe Fix Execution
// ============================================================================

/**
 * Execute a fix with timeout protection
 */
function executeWithTimeout<T>(
  fn: () => T,
  timeout: number,
  fallback: T
): T {
  try {
    // In browser environment, we can't truly timeout sync code
    // But we can at least catch errors
    return fn();
  } catch (e) {
    console.error('[AutoFix] Execution error:', e);
    return fallback;
  }
}

/**
 * Safely attempt a simple fix with all safeguards
 */
function safeSimpleFix(errorMessage: string, code: string): AutoFixResult {
  const defaultResult: AutoFixResult = {
    success: false,
    newCode: code,
    description: '',
    fixType: 'none',
    wasAINeeded: true
  };

  try {
    // Size check
    if (code.length > CONFIG.MAX_CODE_SIZE) {
      return {
        ...defaultResult,
        error: 'Code too large for auto-fix'
      };
    }

    // Check if error is fixable
    if (!canTrySimpleFix(errorMessage)) {
      return {
        ...defaultResult,
        error: 'Error type not supported for simple fix'
      };
    }

    // Attempt the fix
    const result = executeWithTimeout(
      () => trySimpleFix(errorMessage, code),
      CONFIG.FIX_TIMEOUT,
      { fixed: false, newCode: code, description: '', fixType: 'none' as const }
    );

    if (!result.fixed) {
      return {
        ...defaultResult,
        error: 'Simple fix could not resolve the error'
      };
    }

    // Validate the fixed code
    const validation = validateCode(result.newCode);
    if (!validation.valid) {
      console.warn('[AutoFix] Fixed code failed validation:', validation.errors);
      return {
        ...defaultResult,
        error: `Fix would create invalid code: ${validation.errors.join(', ')}`
      };
    }

    // Check that the fix actually changed something
    if (result.newCode === code) {
      return {
        ...defaultResult,
        error: 'Fix produced no changes'
      };
    }

    // Success!
    return {
      success: true,
      newCode: result.newCode,
      description: result.description,
      fixType: getFixTypeLabel(result.fixType),
      wasAINeeded: false
    };

  } catch (e) {
    console.error('[AutoFix] Safe fix error:', e);
    return {
      ...defaultResult,
      error: `Fix failed: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Attempt to automatically fix an error
 * Returns immediately if fix is not possible/allowed
 */
export function attemptAutoFix(errorMessage: string, code: string): AutoFixResult {
  // Check if we should attempt
  const canAttempt = state.canAttemptFix(errorMessage);
  if (!canAttempt.allowed) {
    return {
      success: false,
      newCode: code,
      description: '',
      fixType: 'none',
      error: canAttempt.reason,
      wasAINeeded: true
    };
  }

  // Check if already fixing
  if (state.isCurrentlyFixing) {
    return {
      success: false,
      newCode: code,
      description: '',
      fixType: 'none',
      error: 'Another fix is in progress',
      wasAINeeded: true
    };
  }

  try {
    state.setFixing(true);

    // Attempt simple fix
    const result = safeSimpleFix(errorMessage, code);

    // Record attempt
    state.recordAttempt(
      errorMessage,
      result.success,
      result.success ? result.description : null
    );

    return result;

  } finally {
    state.setFixing(false);
  }
}

/**
 * Check if an error can potentially be auto-fixed
 */
export function canAutoFix(errorMessage: string): boolean {
  const canAttempt = state.canAttemptFix(errorMessage);
  if (!canAttempt.allowed) return false;
  return canTrySimpleFix(errorMessage);
}

/**
 * Get debug info about recent fix attempts
 */
export function getFixDebugInfo(): {
  recentAttempts: FixAttempt[];
  isFixing: boolean;
} {
  return {
    recentAttempts: state.getRecentAttempts(),
    isFixing: state.isCurrentlyFixing
  };
}

/**
 * Reset the auto-fix state (useful for testing)
 */
export function resetAutoFixState(): void {
  state.reset();
}

/**
 * Check if a specific error has already been fixed recently
 */
export function wasRecentlyFixed(errorMessage: string): boolean {
  const attempts = state.getRecentAttempts();
  const recent = attempts.filter(a =>
    a.success &&
    a.errorMessage.includes(errorMessage.slice(0, 100))
  );
  return recent.length > 0;
}

// ============================================================================
// Error Classification
// ============================================================================

export type ErrorCategory =
  | 'syntax'      // Syntax errors (missing brackets, etc.)
  | 'import'      // Missing imports
  | 'runtime'     // Runtime errors (null access, etc.)
  | 'react'       // React-specific errors
  | 'type'        // Type errors
  | 'jsx'         // JSX-specific errors
  | 'async'       // Async/await errors
  | 'transient'   // Transient errors (safe to ignore)
  | 'unknown';    // Unknown/unfixable errors

export interface ErrorClassification {
  category: ErrorCategory;
  isFixable: boolean;
  isIgnorable: boolean;
  priority: number; // 1-5, higher = more important
  suggestedFix?: string;
  affectedIdentifier?: string;
}

/**
 * Classify an error for better handling
 */
export function classifyError(errorMessage: string): ErrorClassification {
  const msg = errorMessage.toLowerCase();

  // Transient/ignorable errors - expanded list
  const transientPatterns = [
    /resizeobserver/i,
    /script error/i,
    /loading chunk/i,
    /network error/i,
    /failed to fetch/i,
    /\[transient\]/i,
    /non-configurable property/i,
    /cannot redefine property/i,
    /hydration/i,
    /minified react error/i,
    /websocket/i,
    /socket hang up/i,
    /econnrefused/i,
    /econnreset/i,
    /etimedout/i,
    /deprecation warning/i,
    /favicon\.ico/i,
    /sourcemap/i,
    /hot module replacement/i,
    /hmr/i,
    /fast refresh/i,
  ];

  if (transientPatterns.some(p => p.test(msg))) {
    return {
      category: 'transient',
      isFixable: false,
      isIgnorable: true,
      priority: 1
    };
  }

  // Bare specifier errors - highest priority, easily fixable
  if (/bare specifier/i.test(msg) || /was not remapped/i.test(msg)) {
    const pathMatch = errorMessage.match(/["']?(src\/[\w./-]+)["']?/i);
    return {
      category: 'import',
      isFixable: true,
      isIgnorable: false,
      priority: 5,
      suggestedFix: 'Convert bare specifier to relative path',
      affectedIdentifier: pathMatch?.[1]
    };
  }

  // Import/Module errors
  const importPatterns = [
    { pattern: /['"]?(\w+)['"]?\s+is\s+not\s+defined/i, type: 'not-defined' },
    { pattern: /cannot find module ['"]([^'"]+)['"]/i, type: 'module-not-found' },
    { pattern: /cannot find name ['"]?(\w+)['"]?/i, type: 'name-not-found' },
    { pattern: /module specifier ['"]([^'"]+)['"]/i, type: 'module-specifier' },
    { pattern: /failed to resolve ['"]([^'"]+)['"]/i, type: 'resolve-failed' },
    { pattern: /could not resolve ['"]([^'"]+)['"]/i, type: 'resolve-failed' },
    { pattern: /module not found.*['"]([^'"]+)['"]/i, type: 'module-not-found' },
    { pattern: /export ['"]?(\w+)['"]?.*not found/i, type: 'export-not-found' },
    { pattern: /does not provide an export named ['"]?(\w+)['"]?/i, type: 'export-not-found' },
  ];

  for (const { pattern, type } of importPatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        category: 'import',
        isFixable: true,
        isIgnorable: false,
        priority: 4,
        suggestedFix: `Fix ${type}: ${match[1]}`,
        affectedIdentifier: match[1]
      };
    }
  }

  // JSX-specific errors
  const jsxPatterns = [
    { pattern: /unterminated jsx/i, fix: 'Close JSX element' },
    { pattern: /expected corresponding jsx closing tag/i, fix: 'Add closing tag' },
    { pattern: /adjacent jsx elements/i, fix: 'Wrap in Fragment' },
    { pattern: /void element.*must.*self-closing/i, fix: 'Convert to self-closing' },
    { pattern: /jsx element implicitly has type 'any'/i, fix: 'Add type annotation' },
  ];

  for (const { pattern, fix } of jsxPatterns) {
    if (pattern.test(msg)) {
      return {
        category: 'jsx',
        isFixable: true,
        isIgnorable: false,
        priority: 5,
        suggestedFix: fix
      };
    }
  }

  // Syntax errors
  const syntaxPatterns = [
    { pattern: /unexpected token ['"]?([^'"]+)['"]?/i, fix: 'Fix syntax error' },
    { pattern: /missing.*[;:{}()[\]]/i, fix: 'Add missing punctuation' },
    { pattern: /expected.*[;:{}()[\]]/i, fix: 'Add expected punctuation' },
    { pattern: /unterminated string/i, fix: 'Close string literal' },
    { pattern: /unterminated template/i, fix: 'Close template literal' },
    { pattern: /unexpected end of input/i, fix: 'Complete the statement' },
  ];

  for (const { pattern, fix } of syntaxPatterns) {
    if (pattern.test(msg)) {
      return {
        category: 'syntax',
        isFixable: true,
        isIgnorable: false,
        priority: 5,
        suggestedFix: fix
      };
    }
  }

  // Async/await errors
  if (/await.*only.*async/i.test(msg) ||
      /await.*outside.*async/i.test(msg) ||
      /unexpected reserved word.*await/i.test(msg)) {
    return {
      category: 'async',
      isFixable: true,
      isIgnorable: false,
      priority: 4,
      suggestedFix: 'Add async keyword to function'
    };
  }

  // Runtime errors
  const runtimePatterns = [
    { pattern: /cannot read propert(?:y|ies).*['"](\w+)['"]/i, fix: 'Add optional chaining' },
    { pattern: /['"]?(\w+)['"]?\s+is\s+not\s+a\s+function/i, fix: 'Check function reference' },
    { pattern: /cannot destructure property ['"](\w+)['"]/i, fix: 'Add default value' },
    { pattern: /undefined is not/i, fix: 'Add null check' },
    { pattern: /null is not/i, fix: 'Add null check' },
    { pattern: /is not iterable/i, fix: 'Check array/iterable' },
    { pattern: /maximum call stack/i, fix: 'Fix infinite recursion' },
  ];

  for (const { pattern, fix } of runtimePatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        category: 'runtime',
        isFixable: true,
        isIgnorable: false,
        priority: 4,
        suggestedFix: fix,
        affectedIdentifier: match[1]
      };
    }
  }

  // React-specific errors
  const reactPatterns = [
    { pattern: /unique.*key.*prop/i, fixable: true, fix: 'Add key prop' },
    { pattern: /each child in a list/i, fixable: true, fix: 'Add key prop' },
    { pattern: /invalid hook call/i, fixable: false, fix: 'Move hook to component top level' },
    { pattern: /hooks can only be called/i, fixable: false, fix: 'Check hook rules' },
    { pattern: /objects are not valid as a react child/i, fixable: false, fix: 'Convert object to string' },
    { pattern: /cannot update.*component.*while rendering/i, fixable: false, fix: 'Use useEffect for side effects' },
    { pattern: /too many re-renders/i, fixable: false, fix: 'Fix render loop' },
  ];

  for (const { pattern, fixable, fix } of reactPatterns) {
    if (pattern.test(msg)) {
      return {
        category: 'react',
        isFixable: fixable,
        isIgnorable: false,
        priority: 3,
        suggestedFix: fix
      };
    }
  }

  // Type errors
  const typePatterns = [
    { pattern: /type ['"]?([^'"]+)['"]? is not assignable/i, fix: 'Fix type mismatch' },
    { pattern: /argument of type ['"]?([^'"]+)['"]?/i, fix: 'Fix argument type' },
    { pattern: /property ['"]?(\w+)['"]? does not exist on type/i, fix: 'Check property name' },
    { pattern: /object is possibly.*undefined/i, fix: 'Add null check' },
    { pattern: /object is possibly.*null/i, fix: 'Add null check' },
    { pattern: /implicitly has.*'any' type/i, fix: 'Add type annotation' },
  ];

  for (const { pattern, fix } of typePatterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return {
        category: 'type',
        isFixable: false, // Type errors usually need manual review
        isIgnorable: false,
        priority: 2,
        suggestedFix: fix,
        affectedIdentifier: match[1]
      };
    }
  }

  // Unknown - check if simple fix is available
  return {
    category: 'unknown',
    isFixable: canTrySimpleFix(errorMessage),
    isIgnorable: false,
    priority: 2
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  attemptAutoFix,
  canAutoFix,
  classifyError,
  getFixDebugInfo,
  resetAutoFixState,
  wasRecentlyFixed,
  validateCode
};
