/**
 * Utility functions for ContextIndicator
 */

import { getProviderManager } from '@/services/ai';
import { getFluidFlowConfig } from '@/services/fluidflowConfig';

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

/**
 * Get compaction threshold for current context
 * This is the token limit at which we trigger compaction
 */
export function getCompactionThreshold(): number {
  const config = getFluidFlowConfig();
  return config.getContextSettings().maxTokensBeforeCompact;
}

/**
 * Get context display info
 * Returns both model context and compaction threshold
 */
export function getContextDisplayInfo() {
  const modelContext = getModelContextSize();
  const compactThreshold = getCompactionThreshold();

  return {
    modelContext,
    compactThreshold,
    // We calculate percentage based on compaction threshold, not full model context
    displayMax: compactThreshold,
  };
}
