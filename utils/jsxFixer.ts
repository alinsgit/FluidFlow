/**
 * JSX Fixer
 *
 * Fixes unescaped characters in JSX text content.
 * AI often generates code like <div>A -> B</div> which causes JSX parse errors.
 */

// ============================================================================
// Helpers
// ============================================================================

/**
 * Checks if position i in code starts a JSX tag (not a comparison operator)
 * JSX tags: <div, </div, <Component, <>, </>
 */
function isJsxTagStart(code: string, i: number): boolean {
  if (code[i] !== '<') return false;
  const nextChar = code[i + 1];
  // JSX tags start with <letter, </, or <>
  return /[A-Za-z/!>]/.test(nextChar || '');
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Fixes unescaped < and > characters in JSX text content.
 * AI often generates code like <div>A -> B</div> which causes JSX parse errors.
 * This function escapes these characters in text content only.
 */
export function fixJsxTextContent(code: string): string {
  if (!code) return '';

  // Only process if it looks like JSX/TSX (has JSX elements)
  if (!/<\w+[^>]*>/.test(code)) {
    return code;
  }

  let result = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    // Check if we're at a JSX tag opening
    if (isJsxTagStart(code, i)) {
      // Find the end of this tag
      let tagEnd = i + 1;
      let inString = false;
      let stringChar = '';
      let braceDepth = 0;

      while (tagEnd < len) {
        const ch = code[tagEnd];

        // Track JSX expression braces
        if (!inString && ch === '{') {
          braceDepth++;
        } else if (!inString && ch === '}') {
          braceDepth--;
        }

        // Track strings
        if ((ch === '"' || ch === "'" || ch === '`') && code[tagEnd - 1] !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = ch;
          } else if (ch === stringChar) {
            inString = false;
          }
        }

        // End of tag (only if not in string or brace expression)
        if (ch === '>' && !inString && braceDepth === 0) {
          break;
        }

        tagEnd++;
      }

      // Copy the tag including the closing >
      result += code.slice(i, tagEnd + 1);
      i = tagEnd + 1;

      // Now collect text content until next JSX tag
      // Skip over JSX expressions {..} as they contain JavaScript code, not text
      let textContent = '';
      while (i < len && !isJsxTagStart(code, i)) {
        // If we hit a JSX expression, copy it verbatim (do not escape inside)
        if (code[i] === '{') {
          let braceDepth = 1;
          textContent += code[i];
          i++;
          while (i < len && braceDepth > 0) {
            if (code[i] === '{') braceDepth++;
            if (code[i] === '}') braceDepth--;
            textContent += code[i];
            i++;
          }
          continue;
        }
        textContent += code[i];
        i++;
      }

      // If we have text content with non-whitespace, escape problematic chars
      // But NOT inside JSX expressions, and NOT arrow functions (=>)
      if (textContent.length > 0 && textContent.trim().length > 0) {
        // Process text in segments, preserving JSX expressions
        let processed = '';
        let j = 0;
        while (j < textContent.length) {
          if (textContent[j] === '{') {
            // Find matching closing brace and copy verbatim
            let depth = 1;
            processed += textContent[j];
            j++;
            while (j < textContent.length && depth > 0) {
              if (textContent[j] === '{') depth++;
              if (textContent[j] === '}') depth--;
              processed += textContent[j];
              j++;
            }
          } else if (textContent[j] === '>' && textContent[j - 1] !== '=') {
            // Escape standalone > (not part of =>)
            processed += "{'>'}";
            j++;
          } else if (textContent[j] === '<' && !isJsxTagStart(textContent, j)) {
            // Escape standalone < (not a JSX tag)
            processed += "{'<'}";
            j++;
          } else {
            processed += textContent[j];
            j++;
          }
        }
        textContent = processed;
      }

      result += textContent;
      continue;
    }

    // Default: copy character as-is (non-JSX code)
    result += code[i];
    i++;
  }

  return result;
}
