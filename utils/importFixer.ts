/**
 * Import Fixer
 *
 * Fixes bare specifier imports that AI often generates incorrectly.
 * Browser ES modules require paths to start with "/", "./", or "../"
 */

// ============================================================================
// Bare Specifier Directories
// ============================================================================

/**
 * Common directory patterns that AI incorrectly uses as bare specifiers.
 * These should be converted to absolute paths (prefixed with /)
 */
const BARE_SPECIFIER_DIRS = [
  'src',
  'components',
  'hooks',
  'utils',
  'services',
  'contexts',
  'types',
  'lib',
  'pages',
  'features',
  'modules',
  'assets',
  'styles',
  'api',
];

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Fixes bare specifier imports that AI often generates incorrectly.
 * Converts: import X from "src/..." to import X from "/src/..."
 * Also handles: import X from "components/..." etc.
 *
 * Browser ES modules require paths to start with "/", "./", or "../"
 */
export function fixBareSpecifierImports(code: string): string {
  if (!code) return '';

  // Build regex pattern: matches import/export from "dir/..." or 'dir/...'
  // Captures: full match, quote char, path
  const pattern = new RegExp(
    `(import\\s+[^;]+?from\\s*|export\\s+[^;]*?from\\s*|import\\s*\\()(['"\`])(${BARE_SPECIFIER_DIRS.join('|')})/`,
    'g'
  );

  // Replace bare specifiers with absolute paths
  return code.replace(pattern, (match, prefix, quote, dir) => {
    return `${prefix}${quote}/${dir}/`;
  });
}

// ============================================================================
// Exports
// ============================================================================

export { BARE_SPECIFIER_DIRS };
