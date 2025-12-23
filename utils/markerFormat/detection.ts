/**
 * Marker Format Detection
 *
 * Functions to detect marker format type.
 */

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detects if response uses marker format (vs JSON format)
 */
export function isMarkerFormat(response: string): boolean {
  // Check for marker format indicators
  const hasFileMarker = /<!--\s*FILE:/.test(response);
  const hasPlanMarker = /<!--\s*PLAN\s*-->/.test(response);
  const hasExplanationMarker = /<!--\s*EXPLANATION\s*-->/.test(response);

  // Marker format should have FILE markers
  return hasFileMarker || (hasPlanMarker && hasExplanationMarker);
}

/**
 * Check if response uses marker format v2 (has META block)
 */
export function isMarkerFormatV2(response: string): boolean {
  return /<!--\s*META\s*-->/.test(response);
}
