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
    // First, try to extract JSON from markdown code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    let jsonString = codeBlockMatch ? codeBlockMatch[1] : response;

    // Try to find JSON object in the string
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Try to parse the matched JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // If direct parse fails, try to fix common issues
        let fixedJson = jsonMatch[0];

        // Remove trailing commas before closing braces/brackets
        fixedJson = fixedJson.replace(/,\s*([\]}])/g, '$1');

        // Try to close unclosed JSON (truncated response)
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          // Truncated response - try to salvage what we can
          // Find the last complete key-value pair
          const lastCompleteMatch = fixedJson.match(/^([\s\S]*"[^"]+"\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\{[^{}]*\}|\[[^\[\]]*\]))\s*,?\s*$/);
          if (lastCompleteMatch) {
            fixedJson = lastCompleteMatch[1] + '}';
          } else {
            // Can't salvage, throw to outer catch
            throw new Error('Response appears to be truncated. The model may have hit token limits.');
          }
        }

        try {
          parsed = JSON.parse(fixedJson);
        } catch {
          throw new Error('Invalid JSON response from model. Try a different model that supports code generation.');
        }
      }

      // Validate that parsed is an object with file paths
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      // If it has an "explanation" key but no file paths, it's not what we want
      const keys = Object.keys(parsed);
      const nonMetaKeys = keys.filter(k => k !== 'explanation' && k !== 'description');
      if (nonMetaKeys.length === 0) {
        throw new Error('Model returned explanation only, no code files. Try a model better suited for code generation.');
      }

      // Clean each file's content
      const cleaned: Record<string, string> = {};
      for (const [path, content] of Object.entries(parsed)) {
        // Skip non-file keys like "explanation"
        if (path === 'explanation' || path === 'description') continue;

        if (typeof content === 'string') {
          cleaned[path] = cleanGeneratedCode(content);
        }
      }

      // Return null if no valid file entries found
      if (Object.keys(cleaned).length === 0) {
        return null;
      }

      return cleaned;
    }

    // No JSON found in response
    throw new Error('No valid JSON found in response. The model may not support structured code generation.');
  } catch (e) {
    // Re-throw with better error message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error('Failed to parse model response. Try a different model.');
  }
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
