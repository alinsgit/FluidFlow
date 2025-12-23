/**
 * syntaxFixer.ts - Comprehensive syntax error detection and auto-repair
 *
 * This module provides aggressive, multi-pass syntax fixing for AI-generated code.
 * It handles common patterns that AI models produce incorrectly.
 *
 * @module utils/syntaxFixer
 *
 * Structure:
 * - utils/syntaxFixer/types.ts        - Type definitions
 * - utils/syntaxFixer/syntaxRepair.ts - Basic syntax repair functions
 * - utils/syntaxFixer/jsxBalance.ts   - JSX tag balancing
 * - utils/syntaxFixer/bracketBalance.ts - Bracket balancing
 * - utils/syntaxFixer/importFixer.ts  - Import parsing and merging
 * - utils/syntaxFixer/returnFixer.ts  - Return statement fixes
 */

// Re-export types
export type { ErrorPattern, JsxTag, ImportInfo, FixResult, BracketInfo } from './syntaxFixer/types';

// Re-export individual fix functions
export {
  fixMalformedTernary,
  fixArrowFunctions,
  fixJsxAttributes,
  fixStringIssues,
  fixTypeScriptIssues,
} from './syntaxFixer/syntaxRepair';

export { extractJsxTags, findUnclosedTags, fixJsxTagBalance } from './syntaxFixer/jsxBalance';

export { fixBracketBalanceAdvanced } from './syntaxFixer/bracketBalance';

export { parseImports, fixAndMergeImports } from './syntaxFixer/importFixer';

export { fixReturnStatements } from './syntaxFixer/returnFixer';

// Import for local use
import {
  fixMalformedTernary,
  fixArrowFunctions,
  fixJsxAttributes,
  fixStringIssues,
  fixTypeScriptIssues,
} from './syntaxFixer/syntaxRepair';
import { fixJsxTagBalance } from './syntaxFixer/jsxBalance';
import { fixBracketBalanceAdvanced } from './syntaxFixer/bracketBalance';
import { fixAndMergeImports } from './syntaxFixer/importFixer';
import { fixReturnStatements } from './syntaxFixer/returnFixer';
import type { FixResult } from './syntaxFixer/types';

// ============================================================================
// MASTER FIX FUNCTION
// ============================================================================

/**
 * Apply all fixes in the correct order
 */
export function aggressiveFix(code: string, maxPasses = 3): FixResult {
  const fixesApplied: string[] = [];
  const issues: string[] = [];
  let currentCode = code;

  for (let pass = 0; pass < maxPasses; pass++) {
    const beforeCode = currentCode;

    // Phase 1: Import handling (run first to establish clean imports)
    const afterImports = fixAndMergeImports(currentCode);
    if (afterImports !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Merged duplicate imports`);
      currentCode = afterImports;
    }

    // Phase 2: Arrow function fixes
    const afterArrows = fixArrowFunctions(currentCode);
    if (afterArrows !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed arrow function syntax`);
      currentCode = afterArrows;
    }

    // Phase 3: Ternary operator fixes
    const afterTernary = fixMalformedTernary(currentCode);
    if (afterTernary !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed malformed ternary operators`);
      currentCode = afterTernary;
    }

    // Phase 4: JSX attribute fixes
    const afterAttrs = fixJsxAttributes(currentCode);
    if (afterAttrs !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed JSX attribute syntax`);
      currentCode = afterAttrs;
    }

    // Phase 5: String and template literal fixes
    const afterStrings = fixStringIssues(currentCode);
    if (afterStrings !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed string/template literal issues`);
      currentCode = afterStrings;
    }

    // Phase 6: TypeScript-specific fixes
    const afterTS = fixTypeScriptIssues(currentCode);
    if (afterTS !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed TypeScript syntax issues`);
      currentCode = afterTS;
    }

    // Phase 7: Return statement fixes
    const afterReturns = fixReturnStatements(currentCode);
    if (afterReturns !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed return statements`);
      currentCode = afterReturns;
    }

    // Phase 8: Bracket balancing (run near the end)
    const afterBrackets = fixBracketBalanceAdvanced(currentCode);
    if (afterBrackets !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed bracket balance`);
      currentCode = afterBrackets;
    }

    // Phase 9: JSX tag balancing (run last)
    const afterJsxTags = fixJsxTagBalance(currentCode);
    if (afterJsxTags !== currentCode) {
      fixesApplied.push(`Pass ${pass + 1}: Fixed unclosed JSX tags`);
      currentCode = afterJsxTags;
    }

    // If no changes this pass, we're done
    if (currentCode === beforeCode) {
      break;
    }
  }

  return {
    code: currentCode,
    fixesApplied,
    issues
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Quick validation - returns true if code appears valid
 */
export function quickValidate(code: string): boolean {
  // Check bracket balance
  let braces = 0, parens = 0, brackets = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = code[i - 1] || '';

    // Track string state (simplified)
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (inString) continue;

    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;

    // Early exit if any goes negative (indicates syntax error)
    if (braces < 0 || parens < 0 || brackets < 0) {
      return false;
    }
  }

  if (braces !== 0 || parens !== 0 || brackets !== 0) {
    return false;
  }

  // Check for common syntax errors
  const errorPatterns = [
    /=\s+>/,              // = > instead of =>
    /className"[^"]/,     // className"value" without =
    /\?\s*<[A-Z][^:]*\}$/, // Incomplete ternary
    /:\s*:/,              // Double colon
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(code)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// SAFE FIX
// ============================================================================

/**
 * Try to fix code and validate - returns fixed code or original if validation fails
 */
export function safeAggressiveFix(code: string): string {
  const result = aggressiveFix(code);

  // If we applied fixes, check if the result is valid
  if (result.fixesApplied.length > 0) {
    if (quickValidate(result.code)) {
      return result.code;
    } else {
      // Fixes made it worse, return original
      console.warn('[syntaxFixer] Fixes made code invalid, reverting');
      return code;
    }
  }

  return code;
}
