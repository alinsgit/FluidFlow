/**
 * Import Fixer
 *
 * Import statement parsing and merging utilities.
 */

import type { ImportInfo } from './types';

// ============================================================================
// Import Parsing
// ============================================================================

/**
 * Parse import statements from code
 */
export function parseImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = code.split('\n');

  const importRegex = /^import\s+(?:(type)\s+)?(?:(\*\s+as\s+\w+)|(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"];?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('import ')) continue;

    const match = line.match(importRegex);
    if (match) {
      const [_fullMatch, typeOnly, namespaceImport, defaultImport, namedImportsStr, source] = match;

      const namedImports = namedImportsStr
        ? namedImportsStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      imports.push({
        source,
        defaultImport: defaultImport || null,
        namedImports,
        namespaceImport: namespaceImport?.replace('* as ', '') || null,
        typeOnly: !!typeOnly,
        line: i + 1,
        fullMatch: lines[i]
      });
    }
  }

  return imports;
}

// ============================================================================
// Import Merging
// ============================================================================

/**
 * Merge and deduplicate imports
 */
export function fixAndMergeImports(code: string): string {
  const imports = parseImports(code);

  if (imports.length === 0) return code;

  // Group imports by source
  const bySource: Record<string, ImportInfo[]> = {};
  for (const imp of imports) {
    if (!bySource[imp.source]) {
      bySource[imp.source] = [];
    }
    bySource[imp.source].push(imp);
  }

  // Build merged import statements
  const mergedImports: string[] = [];
  const usedLines = new Set<number>();

  for (const [source, sourceImports] of Object.entries(bySource)) {
    if (sourceImports.length === 1) {
      mergedImports.push(sourceImports[0].fullMatch);
      usedLines.add(sourceImports[0].line);
      continue;
    }

    // Merge multiple imports from same source
    let defaultImport: string | null = null;
    let namespaceImport: string | null = null;
    const namedSet = new Set<string>();
    let isTypeOnly = true;

    for (const imp of sourceImports) {
      usedLines.add(imp.line);

      if (imp.defaultImport && !defaultImport) {
        defaultImport = imp.defaultImport;
      }
      if (imp.namespaceImport && !namespaceImport) {
        namespaceImport = imp.namespaceImport;
      }
      for (const named of imp.namedImports) {
        namedSet.add(named);
      }
      if (!imp.typeOnly) {
        isTypeOnly = false;
      }
    }

    // Build merged import
    const typePrefix = isTypeOnly ? 'type ' : '';
    const namedStr = Array.from(namedSet).join(', ');

    if (namespaceImport) {
      mergedImports.push(`import ${typePrefix}* as ${namespaceImport} from '${source}';`);
    } else if (defaultImport && namedStr) {
      mergedImports.push(`import ${typePrefix}${defaultImport}, { ${namedStr} } from '${source}';`);
    } else if (defaultImport) {
      mergedImports.push(`import ${typePrefix}${defaultImport} from '${source}';`);
    } else if (namedStr) {
      mergedImports.push(`import ${typePrefix}{ ${namedStr} } from '${source}';`);
    }
  }

  // Reconstruct code with merged imports
  const lines = code.split('\n');
  const newLines: string[] = [];
  let importsInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;

    if (usedLines.has(lineNum)) {
      // This was an import line, skip it
      if (!importsInserted) {
        // Insert all merged imports at first import location
        newLines.push(...mergedImports);
        importsInserted = true;
      }
    } else {
      newLines.push(lines[i]);
    }
  }

  return newLines.join('\n');
}
