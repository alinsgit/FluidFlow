/**
 * File Path Utilities
 *
 * Centralized file path validation and manipulation functions.
 * Used across the codebase for consistent path handling.
 */

/**
 * Paths that should be ignored in file operations.
 * These are typically build artifacts, dependencies, or system files.
 */
export const IGNORED_PATHS = [
  // Version control
  '.git',
  // Dependencies
  'node_modules',
  // Build outputs
  '.next',
  '.nuxt',
  'dist',
  'build',
  '.output',
  // Cache directories
  '.cache',
  '.turbo',
  '.parcel-cache',
  // OS files
  '.DS_Store',
  'Thumbs.db',
  // IDE directories
  '.idea',
  '.vscode',
  // Lock files (optional - keep for reference but do not modify)
  // 'package-lock.json',
  // 'yarn.lock',
  // 'pnpm-lock.yaml',
] as const;

/**
 * Checks if a file path should be ignored (e.g., .git, node_modules).
 * Used to filter out system/build files from virtual file system operations.
 *
 * @param filePath - The file path to check
 * @returns true if the path should be ignored
 *
 * @example
 * isIgnoredPath('.git/config') // true
 * isIgnoredPath('node_modules/react/index.js') // true
 * isIgnoredPath('src/App.tsx') // false
 */
export function isIgnoredPath(filePath: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');

  return IGNORED_PATHS.some(ignored =>
    // Exact match
    normalizedPath === ignored ||
    // Starts with ignored path (e.g., "node_modules/...")
    normalizedPath.startsWith(ignored + '/') ||
    // Contains ignored path as directory (e.g., "src/.git/...")
    normalizedPath.includes('/' + ignored + '/') ||
    // Ends with ignored path as directory (e.g., "project/.git")
    normalizedPath.endsWith('/' + ignored)
  );
}

/**
 * Normalizes a file path for consistent handling.
 * Converts backslashes to forward slashes and removes trailing slashes.
 *
 * @param filePath - The file path to normalize
 * @returns Normalized file path
 */
export function normalizePath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

/**
 * Gets the file extension from a path.
 *
 * @param filePath - The file path
 * @returns File extension without dot, or empty string if none
 */
export function getFileExtension(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastDot = normalized.lastIndexOf('.');
  const lastSlash = normalized.lastIndexOf('/');

  // No dot, or dot is before last slash (directory with dot)
  if (lastDot === -1 || lastDot < lastSlash) {
    return '';
  }

  return normalized.slice(lastDot + 1).toLowerCase();
}

/**
 * Gets the filename from a path.
 *
 * @param filePath - The file path
 * @returns Filename without directory
 */
export function getFileName(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

/**
 * Gets the directory path from a file path.
 *
 * @param filePath - The file path
 * @returns Directory path, or empty string if root
 */
export function getDirectoryPath(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
}

/**
 * Checks if a path is a valid file path (has extension).
 *
 * @param filePath - The path to check
 * @returns true if path looks like a file (has extension)
 */
export function isFilePath(filePath: string): boolean {
  return getFileExtension(filePath) !== '';
}

/**
 * Checks if a file path is malformed.
 * Detects paths like "src/components/.tsx" or empty filenames.
 *
 * @param filePath - The file path to check
 * @returns true if path is malformed
 */
export function isMalformedPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);

  // Empty path
  if (!normalized) return true;

  // Path ends with slash (directory, not file)
  if (normalized.endsWith('/')) return true;

  // Hidden file without name (e.g., "src/components/.tsx")
  if (normalized.includes('/.') && !normalized.includes('/..')) {
    const fileName = getFileName(normalized);
    // Allow dotfiles like ".gitignore", ".env"
    if (fileName.startsWith('.') && fileName.length > 1 && !fileName.includes('.', 1)) {
      return false; // Valid dotfile
    }
    // Invalid: ".tsx", "." etc.
    if (fileName.startsWith('.') && (fileName.length === 1 || fileName.indexOf('.') === 0)) {
      return true;
    }
  }

  // No extension (might be a directory)
  if (!isFilePath(normalized)) return true;

  return false;
}
