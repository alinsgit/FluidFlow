/**
 * Return Fixer
 *
 * Return statement detection and fixing utilities.
 */

// ============================================================================
// Return Statement Fixes
// ============================================================================

/**
 * Fix return statement issues
 */
export function fixReturnStatements(code: string): string {
  const result = code;

  // Fix: return ( without matching )
  // This requires careful analysis
  const lines = result.split('\n');
  const fixedLines: string[] = [];
  let returnParenDepth = 0;
  let inReturnParen = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detect return (
    if (/return\s*\(/.test(line) && !inReturnParen) {
      inReturnParen = true;
      returnParenDepth = 0;
    }

    if (inReturnParen) {
      for (const char of line) {
        if (char === '(') returnParenDepth++;
        if (char === ')') returnParenDepth--;
      }

      if (returnParenDepth <= 0) {
        inReturnParen = false;
        returnParenDepth = 0;
      }
    }

    // Fix return without value followed by JSX
    if (/^\s*return\s*$/.test(line) && i + 1 < lines.length && /^\s*</.test(lines[i + 1])) {
      line = line.replace(/return\s*$/, 'return (');
    }

    fixedLines.push(line);
  }

  // If we ended with unclosed return paren, close it
  if (inReturnParen && returnParenDepth > 0) {
    // Find the last line with content and add closing parens
    for (let i = fixedLines.length - 1; i >= 0; i--) {
      if (fixedLines[i].trim()) {
        fixedLines[i] = fixedLines[i] + ')'.repeat(returnParenDepth);
        break;
      }
    }
  }

  return fixedLines.join('\n');
}
