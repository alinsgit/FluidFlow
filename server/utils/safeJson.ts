import fs from 'fs/promises';

// BUG-016 FIX: Maximum file size for JSON files (10MB)
const MAX_JSON_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Safe JSON parsing helper to prevent crashes on corrupted/malformed JSON
 * @param jsonString - The JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[SafeJson] Parse error:', error instanceof Error ? error.message : error);
    return fallback;
  }
}

/**
 * Safe file read + JSON parse helper
 * Reads a file and parses its JSON content, returning fallback on any error
 * BUG-016 FIX: Now includes file size check to prevent DoS via large files
 * @param filePath - Path to the JSON file
 * @param fallback - Value to return if read or parse fails
 * @param maxSize - Maximum file size in bytes (default 10MB)
 * @returns Parsed JSON content or fallback
 */
export async function safeReadJson<T>(
  filePath: string,
  fallback: T,
  maxSize: number = MAX_JSON_FILE_SIZE
): Promise<T> {
  try {
    // BUG-016 FIX: Check file size before reading to prevent memory exhaustion
    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      console.error(`[SafeJson] File too large: ${filePath} (${stats.size} bytes, max ${maxSize})`);
      return fallback;
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return safeJsonParse(content, fallback);
  } catch (error) {
    console.error(`[SafeJson] Failed to read JSON from ${filePath}:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

/**
 * Safe JSON stringify helper
 * BUG-S02 FIX: Handles BigInt and Symbol values that would otherwise throw
 * @param value - Value to stringify
 * @param fallback - String to return if stringify fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(value: unknown, fallback: string = '{}'): string {
  // Handle undefined and functions explicitly - JSON.stringify returns undefined for these
  if (value === undefined || typeof value === 'function') {
    return fallback;
  }

  // Handle Symbol directly at top level
  if (typeof value === 'symbol') {
    return fallback;
  }

  // BUG-S02 FIX: Handle BigInt directly at top level
  if (typeof value === 'bigint') {
    return `"${value.toString()}"`;
  }

  try {
    // Custom replacer to handle BigInt and Symbol values in nested objects
    const replacer = (_key: string, val: unknown): unknown => {
      if (typeof val === 'bigint') {
        return val.toString();
      }
      if (typeof val === 'symbol') {
        return undefined; // Symbols are excluded (same as JSON.stringify default)
      }
      return val;
    };

    const result = JSON.stringify(value, replacer);
    // JSON.stringify can return undefined for some edge cases
    if (result === undefined) {
      return fallback;
    }
    return result;
  } catch (error) {
    console.error('[SafeJson] Stringify error:', error instanceof Error ? error.message : error);
    return fallback;
  }
}
