/**
 * Fix Verification System
 *
 * Validates that applied fixes actually resolve the error without introducing new issues.
 * Uses static analysis and optional runtime verification.
 */

import { FileSystem } from '../types';
import { analyzeCode, CodeIssue } from '../utils/simpleFixes';

// ============================================================================
// Types
// ============================================================================

export interface VerificationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: VerificationIssue[];
  suggestions: string[];
}

export interface VerificationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
}

export interface VerificationOptions {
  originalError: string;
  originalFiles: FileSystem;
  fixedFiles: FileSystem;
  changedFiles: string[];
  strictMode?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Minimum code length to consider valid
  MIN_CODE_LENGTH: 50,
  // Maximum acceptable new issues introduced
  MAX_NEW_ISSUES: 2,
  // Confidence thresholds
  HIGH_CONFIDENCE_THRESHOLD: 0.9,
  MEDIUM_CONFIDENCE_THRESHOLD: 0.6,
};

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Verify that a fix is valid and resolves the original error
 */
export function verifyFix(options: VerificationOptions): VerificationResult {
  const issues: VerificationIssue[] = [];
  const suggestions: string[] = [];
  let confidence = 1.0;

  const { originalError, originalFiles, fixedFiles, changedFiles, strictMode = false } = options;

  // 1. Check that fixed files exist and are valid
  for (const file of changedFiles) {
    const fixedCode = fixedFiles[file];

    if (!fixedCode) {
      issues.push({
        type: 'error',
        message: `Fixed file ${file} is empty or missing`,
        file,
      });
      confidence -= 0.5;
      continue;
    }

    if (fixedCode.length < CONFIG.MIN_CODE_LENGTH) {
      issues.push({
        type: 'warning',
        message: `Fixed file ${file} is very short (${fixedCode.length} chars)`,
        file,
      });
      confidence -= 0.2;
    }

    // 2. Syntax validation
    const syntaxResult = validateSyntax(fixedCode);
    if (!syntaxResult.valid) {
      issues.push({
        type: 'error',
        message: `Syntax error in ${file}: ${syntaxResult.error}`,
        file,
      });
      confidence -= 0.5;
    }

    // 3. Check for code quality issues
    const codeIssues = analyzeCode(fixedCode);
    const newErrors = codeIssues.filter(i => i.type === 'error');
    const newWarnings = codeIssues.filter(i => i.type === 'warning');

    if (newErrors.length > 0) {
      for (const error of newErrors) {
        issues.push({
          type: 'error',
          message: error.message,
          file,
        });
      }
      confidence -= 0.3 * newErrors.length;
    }

    if (newWarnings.length > CONFIG.MAX_NEW_ISSUES) {
      issues.push({
        type: 'warning',
        message: `${newWarnings.length} new warnings introduced in ${file}`,
        file,
      });
      confidence -= 0.1;
    }

    // 4. Check that the original error is addressed
    const errorAddressed = checkErrorAddressed(originalError, originalFiles[file], fixedCode);
    if (!errorAddressed.addressed) {
      issues.push({
        type: 'warning',
        message: `Fix may not address original error: ${errorAddressed.reason}`,
        file,
      });
      confidence -= 0.3;
      if (errorAddressed.suggestion) {
        suggestions.push(errorAddressed.suggestion);
      }
    }

    // 5. Check for regression (in strict mode)
    if (strictMode) {
      const regression = checkForRegression(originalFiles[file], fixedCode);
      if (regression.hasRegression) {
        issues.push({
          type: 'warning',
          message: `Potential regression: ${regression.description}`,
          file,
        });
        confidence -= 0.2;
      }
    }
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, confidence));

  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low';
  if (confidence >= CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    confidenceLevel = 'high';
  } else if (confidence >= CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }

  // Is fix valid?
  const hasErrors = issues.some(i => i.type === 'error');
  const isValid = !hasErrors && confidence >= CONFIG.MEDIUM_CONFIDENCE_THRESHOLD;

  return {
    isValid,
    confidence: confidenceLevel,
    issues,
    suggestions,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate basic syntax of code
 */
function validateSyntax(code: string): { valid: boolean; error?: string } {
  try {
    // Check bracket balance
    const brackets: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inBlockComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const nextChar = code[i + 1] || '';
      const prevChar = i > 0 ? code[i - 1] : '';

      // Handle comments
      if (!inString && !inBlockComment && char === '/' && nextChar === '/') {
        inComment = true;
        continue;
      }
      if (inComment && char === '\n') {
        inComment = false;
        continue;
      }
      if (!inString && !inComment && char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
        continue;
      }
      if (inComment || inBlockComment) continue;

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (inString) continue;

      // Track brackets
      if (brackets[char]) {
        stack.push(brackets[char]);
      } else if (char === ')' || char === ']' || char === '}') {
        if (stack.length === 0) {
          return { valid: false, error: `Unexpected '${char}'` };
        }
        const expected = stack.pop();
        if (expected !== char) {
          return { valid: false, error: `Expected '${expected}' but found '${char}'` };
        }
      }
    }

    if (stack.length > 0) {
      return { valid: false, error: `Missing closing '${stack[stack.length - 1]}'` };
    }

    if (inString) {
      return { valid: false, error: 'Unterminated string' };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}

/**
 * Check if the original error is addressed by the fix
 */
function checkErrorAddressed(
  errorMessage: string,
  originalCode: string | undefined,
  fixedCode: string
): { addressed: boolean; reason?: string; suggestion?: string } {
  const errorLower = errorMessage.toLowerCase();

  // 1. Check for "not defined" errors - verify import was added
  const notDefinedMatch = errorMessage.match(/['"]?(\w+)['"]?\s+is\s+not\s+defined/i);
  if (notDefinedMatch) {
    const identifier = notDefinedMatch[1];
    const hasImport = new RegExp(`import.*\\b${identifier}\\b.*from`, 'i').test(fixedCode);
    const hasDefined = new RegExp(`(const|let|var|function)\\s+${identifier}\\b`).test(fixedCode);

    if (!hasImport && !hasDefined) {
      return {
        addressed: false,
        reason: `'${identifier}' is still not defined or imported`,
        suggestion: `Add import for '${identifier}'`,
      };
    }
    return { addressed: true };
  }

  // 2. Check for bare specifier errors - verify path is relative
  if (errorLower.includes('bare specifier') || errorLower.includes('was not remapped')) {
    const bareMatch = errorMessage.match(/["']?(src\/[\w./-]+)["']?/i);
    if (bareMatch) {
      const barePath = bareMatch[1];
      // Check if the bare path is still in the code
      if (fixedCode.includes(`'${barePath}'`) || fixedCode.includes(`"${barePath}"`)) {
        return {
          addressed: false,
          reason: `Bare specifier '${barePath}' is still present`,
          suggestion: `Convert to relative path like './${barePath.replace('src/', '')}'`,
        };
      }
    }
    return { addressed: true };
  }

  // 3. Check for missing closing bracket/brace
  if (errorLower.includes("expected '}'") || errorLower.includes('missing }')) {
    const fixedOpenBraces = (fixedCode.match(/{/g) || []).length;
    const fixedCloseBraces = (fixedCode.match(/}/g) || []).length;

    if (fixedOpenBraces !== fixedCloseBraces) {
      return {
        addressed: false,
        reason: 'Brace count still unbalanced',
        suggestion: 'Check for missing closing braces',
      };
    }
    return { addressed: true };
  }

  // 4. Check for React key prop errors
  if (errorLower.includes('unique "key" prop') || errorLower.includes('each child in a list')) {
    // Check that .map calls have key props
    const mapWithoutKey = /\.map\s*\([^)]*\)\s*=>\s*(?:\(\s*)?<\w+(?![^>]*\bkey\s*=)/;
    if (mapWithoutKey.test(fixedCode)) {
      return {
        addressed: false,
        reason: 'Map iteration still missing key prop',
        suggestion: 'Add key prop to mapped JSX elements',
      };
    }
    return { addressed: true };
  }

  // 5. Check for null/undefined access errors
  const propAccessMatch = errorMessage.match(/cannot read propert(?:y|ies).*['"](\w+)['"]/i);
  if (propAccessMatch) {
    const prop = propAccessMatch[1];
    // Check if optional chaining was added
    const hasOptionalChaining = new RegExp(`\\?\\.\\s*${prop}`, 'i').test(fixedCode);
    const hasNullCheck = new RegExp(`(&&|\\|\\||\\?\\?).*${prop}`, 'i').test(fixedCode);

    if (!hasOptionalChaining && !hasNullCheck && originalCode) {
      // Check if the unsafe access is still there
      const unsafePattern = new RegExp(`\\.${prop}(?!\\s*\\?)`, 'i');
      if (unsafePattern.test(fixedCode)) {
        return {
          addressed: false,
          reason: `Property '${prop}' access may still be unsafe`,
          suggestion: `Add optional chaining (?.) before .${prop}`,
        };
      }
    }
    return { addressed: true };
  }

  // Default: assume addressed if code changed
  if (originalCode && fixedCode !== originalCode) {
    return { addressed: true };
  }

  return {
    addressed: false,
    reason: 'Code appears unchanged',
    suggestion: 'Verify the fix was applied correctly',
  };
}

/**
 * Check for potential regressions
 */
function checkForRegression(
  originalCode: string | undefined,
  fixedCode: string
): { hasRegression: boolean; description?: string } {
  if (!originalCode) {
    return { hasRegression: false };
  }

  // 1. Check if exports were removed
  const originalExports = originalCode.match(/export\s+(const|function|default|class)/g) || [];
  const fixedExports = fixedCode.match(/export\s+(const|function|default|class)/g) || [];

  if (fixedExports.length < originalExports.length) {
    return {
      hasRegression: true,
      description: `Reduced exports from ${originalExports.length} to ${fixedExports.length}`,
    };
  }

  // 2. Check if component was significantly shortened (might indicate loss of functionality)
  const lengthRatio = fixedCode.length / originalCode.length;
  if (lengthRatio < 0.5) {
    return {
      hasRegression: true,
      description: `Code shortened by ${Math.round((1 - lengthRatio) * 100)}%`,
    };
  }

  // 3. Check if hooks were removed
  const originalHooks = originalCode.match(/\buse[A-Z]\w+\s*\(/g) || [];
  const fixedHooks = fixedCode.match(/\buse[A-Z]\w+\s*\(/g) || [];

  if (fixedHooks.length < originalHooks.length - 1) {
    return {
      hasRegression: true,
      description: `Hooks reduced from ${originalHooks.length} to ${fixedHooks.length}`,
    };
  }

  // 4. Check if return statement was removed
  const originalReturns = (originalCode.match(/return\s*\(/g) || []).length;
  const fixedReturns = (fixedCode.match(/return\s*\(/g) || []).length;

  if (originalReturns > 0 && fixedReturns === 0) {
    return {
      hasRegression: true,
      description: 'Return statement may have been removed',
    };
  }

  return { hasRegression: false };
}

// ============================================================================
// Quick Verification Functions
// ============================================================================

/**
 * Quick check if code is syntactically valid
 */
export function isCodeValid(code: string): boolean {
  return validateSyntax(code).valid;
}

/**
 * Get all issues with a piece of code
 */
export function getCodeIssues(code: string): CodeIssue[] {
  return analyzeCode(code);
}

/**
 * Check if fix likely resolves the error
 */
export function doesFixResolveError(errorMessage: string, originalCode: string, fixedCode: string): boolean {
  const result = checkErrorAddressed(errorMessage, originalCode, fixedCode);
  return result.addressed;
}

export default {
  verifyFix,
  isCodeValid,
  getCodeIssues,
  doesFixResolveError,
};
