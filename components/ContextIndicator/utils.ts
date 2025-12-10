/**
 * Utility functions for ContextIndicator
 */

import { getProviderManager } from '@/services/ai';

/**
 * Get context window size for current model
 */
export function getModelContextSize(): number {
  const manager = getProviderManager();
  const config = manager.getActiveConfig();
  if (!config) return 128000; // Default

  const model = config.models.find(m => m.id === config.defaultModel);
  return model?.contextWindow || 128000;
}
