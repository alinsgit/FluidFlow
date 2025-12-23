/**
 * Code Cleaner
 *
 * Cleans AI-generated code by removing markdown artifacts and code block markers.
 * Intentionally minimal processing to avoid breaking valid code.
 */

import { fixBareSpecifierImports } from './importFixer';

// ============================================================================
// Markdown Cleaning
// ============================================================================

/**
 * Cleans AI-generated code by removing markdown artifacts and code block markers.
 *
 * IMPORTANT: This function intentionally does MINIMAL processing.
 * We only remove markdown formatting - we do NOT attempt to "fix" syntax.
 * Aggressive transformations were causing more harm than good by breaking
 * valid code that LLMs generate.
 */
export function cleanGeneratedCode(code: string, filePath?: string): string {
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

  // Remove stray FILE markers that AI sometimes leaves in generated code
  cleaned = removeMarkerArtifacts(cleaned);

  // Check if this is a JS/TS file
  const isJsFile = filePath
    ? /\.(tsx?|jsx?|mjs|cjs)$/.test(filePath)
    : /import\s+.*from\s+['"]|export\s+/.test(cleaned);

  // Fix bare specifier imports and arrow function syntax for JS files
  if (isJsFile) {
    cleaned = fixBareSpecifierImports(cleaned);
    cleaned = fixArrowFunctionSyntax(cleaned);
  }

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// ============================================================================
// Marker Artifact Removal
// ============================================================================

/**
 * Removes stray FILE markers that AI sometimes leaves in generated code.
 * These are from marker-based format parsing that wasn't fully cleaned.
 */
function removeMarkerArtifacts(code: string): string {
  let cleaned = code;

  // Remove: <!-- FILE:path --> or <!-- /FILE:path --> or <!-- /FILE -->
  cleaned = cleaned.replace(/<!--\s*\/?FILE(?::[^\s>]*)?\s*-->/g, '');

  // Remove: <!-- GENERATION_META --> blocks
  cleaned = cleaned.replace(/<!--\s*GENERATION_META\s*-->[\s\S]*?<!--\s*\/GENERATION_META\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?GENERATION_META\s*-->/g, '');

  // Remove: <!-- PLAN --> blocks
  cleaned = cleaned.replace(/<!--\s*PLAN\s*-->[\s\S]*?<!--\s*\/PLAN\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?PLAN\s*-->/g, '');

  // Remove: <!-- EXPLANATION --> blocks
  cleaned = cleaned.replace(/<!--\s*EXPLANATION\s*-->[\s\S]*?<!--\s*\/EXPLANATION\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?EXPLANATION\s*-->/g, '');

  // Remove: <!-- META --> blocks (v2 format)
  cleaned = cleaned.replace(/<!--\s*META\s*-->[\s\S]*?<!--\s*\/META\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?META\s*-->/g, '');

  // Remove: <!-- MANIFEST --> blocks (v2 format)
  cleaned = cleaned.replace(/<!--\s*MANIFEST\s*-->[\s\S]*?<!--\s*\/MANIFEST\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?MANIFEST\s*-->/g, '');

  // Remove: <!-- BATCH --> blocks (v2 format)
  cleaned = cleaned.replace(/<!--\s*BATCH\s*-->[\s\S]*?<!--\s*\/BATCH\s*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/?BATCH\s*-->/g, '');

  return cleaned;
}

// ============================================================================
// Arrow Function Syntax Fixes
// ============================================================================

/**
 * Fixes common arrow function syntax errors in AI-generated code.
 */
function fixArrowFunctionSyntax(code: string): string {
  let cleaned = code;

  // Fix space in arrow: = > → =>
  cleaned = cleaned.replace(/=\s+>/g, '=>');

  // FIX 1: Hybrid function/arrow - "function Name() => {" → "function Name() {"
  cleaned = cleaned.replace(/function\s+(\w+)\s*\(\)\s*=>\s*\{/g, 'function $1() {');
  cleaned = cleaned.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*=>\s*\{/g, 'function $1($2) {');
  cleaned = cleaned.replace(/(\bfunction\s+\w+[\s\S]*?)\s*=>\s*\{/g, '$1 {');

  // FIX 2: Missing arrow - "= () {" → "= () => {"
  cleaned = cleaned.replace(/(=\s*)(async\s+)?\(([^)]*)\)\s*\{/g, (match, eq, asyncKw, params) => {
    if (match.includes('=>')) return match;
    return eq + (asyncKw || '') + '(' + params + ') => {';
  });

  // Pattern: useEffect(() { or any callback(() {
  cleaned = cleaned.replace(/(\w+)\s*\(\s*\(([^)]*)\)\s*\{(?!\s*=>)/g, (match, fnName, params) => {
    if (fnName === 'function') return match;
    if (match.includes('=>')) return match;
    return fnName + '((' + params + ') => {';
  });

  // FIX 3: JSX event handler missing arrow - "onClick={() {}}" → "onClick={() => {}}"
  cleaned = cleaned.replace(/=\{\s*\(([^)]*)\)\s*\{(?!\s*=>)/g, (match, params) => {
    if (match.includes('=>')) return match;
    return '={(' + params + ') => {';
  });

  // FIX 4: Object property arrow syntax - "render: (value) {" → "render: (value) => {"
  cleaned = cleaned.replace(/(\w+)\s*:\s*\(([^)]*)\)\s*\{(?!\s*=>)/g, (match, prop, params) => {
    if (match.includes('=>')) return match;
    if (/^\s*\{/.test(params)) return match;
    return prop + ': (' + params + ') => {';
  });

  // Pattern: return () { (useEffect cleanup)
  cleaned = cleaned.replace(/return\s+\(([^)]*)\)\s*\{/g, (match, params) => {
    if (match.includes('=>')) return match;
    return 'return (' + params + ') => {';
  });

  // Pattern: ( ) => → () => (extra space in empty params)
  cleaned = cleaned.replace(/\(\s+\)\s*=>/g, '() =>');

  return cleaned;
}
