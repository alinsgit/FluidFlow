import fs from 'fs/promises';

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
 * @param filePath - Path to the JSON file
 * @param fallback - Value to return if read or parse fails
 * @returns Parsed JSON content or fallback
 */
export async function safeReadJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return safeJsonParse(content, fallback);
  } catch (error) {
    console.error(`[SafeJson] Failed to read JSON from ${filePath}:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}

/**
 * Safe JSON stringify helper
 * @param value - Value to stringify
 * @param fallback - String to return if stringify fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(value: unknown, fallback: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[SafeJson] Stringify error:', error instanceof Error ? error.message : error);
    return fallback;
  }
}
