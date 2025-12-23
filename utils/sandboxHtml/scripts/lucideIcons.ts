/**
 * Lucide Icons Script
 *
 * Generates the known Lucide icons set script for the sandbox.
 * Uses centralized KNOWN_LUCIDE_ICONS_LIST from importMappings.ts.
 */

import { KNOWN_LUCIDE_ICONS_LIST } from '../../importMappings';

/**
 * Generate the known Lucide icons set script
 * Uses centralized KNOWN_LUCIDE_ICONS_LIST from importMappings.ts
 */
export function getKnownLucideIconsScript(): string {
  // Generate JavaScript Set from the centralized icon list
  const iconListStr = KNOWN_LUCIDE_ICONS_LIST.map((icon) => `'${icon}'`).join(', ');
  return `
      // Known lucide-react icons (from importMappings.ts)
      const KNOWN_LUCIDE_ICONS = new Set([${iconListStr}]);
  `;
}
