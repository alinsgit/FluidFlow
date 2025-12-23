/**
 * Syntax Fixer Module Index
 *
 * Barrel export for syntax error detection and auto-repair utilities.
 */

// Types
export type { ErrorPattern, JsxTag, ImportInfo, FixResult, BracketInfo } from './types';

// Syntax Repair
export {
  fixMalformedTernary,
  fixArrowFunctions,
  fixJsxAttributes,
  fixStringIssues,
  fixTypeScriptIssues,
} from './syntaxRepair';

// JSX Balance
export { extractJsxTags, findUnclosedTags, fixJsxTagBalance } from './jsxBalance';

// Bracket Balance
export { fixBracketBalanceAdvanced, findBestCloserPosition } from './bracketBalance';

// Import Fixer
export { parseImports, fixAndMergeImports } from './importFixer';

// Return Fixer
export { fixReturnStatements } from './returnFixer';
