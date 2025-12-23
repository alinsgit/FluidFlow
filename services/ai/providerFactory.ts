/**
 * Provider Factory
 *
 * Creates AI provider instances based on configuration type.
 */

import type { AIProvider, ProviderConfig } from './types';
import {
  GeminiProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  LMStudioProvider,
  ZAIProvider,
  CerebrasProvider,
  MiniMaxProvider,
} from './providers';

/**
 * Creates an AI provider instance based on the configuration type.
 * @param config - The provider configuration
 * @returns An AIProvider instance
 * @throws Error if provider type is unknown
 */
export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'gemini':
      return new GeminiProvider(config);
    case 'openai':
    case 'openrouter':
    case 'custom':
      // OpenAI-compatible API
      return new OpenAIProvider(config);
    case 'zai':
      // Z.AI GLM - special handling
      return new ZAIProvider(config);
    case 'cerebras':
      // Cerebras - ultra-fast inference
      return new CerebrasProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    case 'lmstudio':
      return new LMStudioProvider(config);
    case 'minimax':
      // MiniMax - OpenAI-compatible with reasoning support
      return new MiniMaxProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
