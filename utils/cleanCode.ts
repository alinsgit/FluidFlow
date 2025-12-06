/**
 * Cleans AI-generated code by removing markdown artifacts and code block markers
 */
export function cleanGeneratedCode(code: string): string {
  if (!code) return '';

  let cleaned = code;

  // Remove code block markers with various language tags
  const codeBlockPatterns = [
    /^```(?:javascript|typescript|tsx|jsx|ts|js|react|html|css|json|sql|markdown|md|plaintext|text|sh|bash|shell)?\s*\n?/gim,
    /\n?```\s*$/gim,
    /^```\s*\n?/gim,
  ];

  codeBlockPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove leading language identifier on first line (e.g., "javascript" or "typescript" alone)
  cleaned = cleaned.replace(/^(javascript|typescript|tsx|jsx|ts|js|react)\s*\n/i, '');

  // Remove any remaining triple backticks
  cleaned = cleaned.replace(/```/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Parses AI response that might contain multiple files in JSON format
 */
export function parseMultiFileResponse(response: string): Record<string, string> | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Clean each file's content
      const cleaned: Record<string, string> = {};
      for (const [path, content] of Object.entries(parsed)) {
        if (typeof content === 'string') {
          cleaned[path] = cleanGeneratedCode(content);
        }
      }
      return cleaned;
    }
  } catch {
    // Not JSON, return null
  }
  return null;
}

/**
 * Validates that the cleaned code looks like valid code
 */
export function isValidCode(code: string): boolean {
  if (!code || code.length < 10) return false;

  // Check for common code patterns
  const hasImport = /import\s+/.test(code);
  const hasExport = /export\s+/.test(code);
  const hasFunction = /function\s+|const\s+\w+\s*=|=>\s*{/.test(code);
  const hasJSX = /<\w+/.test(code);
  const hasClass = /class\s+\w+/.test(code);

  return hasImport || hasExport || hasFunction || hasJSX || hasClass;
}
