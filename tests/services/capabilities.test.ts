/**
 * Tests for AI Provider Capabilities
 * Tests model capability lookups, provider defaults, and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getModelCapabilities,
  getProviderDefaults,
  modelSupports,
  getModelsWithCapability,
  getBestModelForUseCase,
  estimateTokenCount,
  fitsInContext,
  getRecommendedMaxTokens,
} from '../../services/ai/capabilities';

describe('AI Capabilities', () => {
  describe('getModelCapabilities', () => {
    it('should return capabilities for known Gemini models', () => {
      const caps = getModelCapabilities('gemini-2.5-pro-latest');
      expect(caps.supportsVision).toBe(true);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsJsonMode).toBe(true);
      expect(caps.contextWindow).toBe(1048576);
    });

    it('should return capabilities for GLM-4.6 model', () => {
      const caps = getModelCapabilities('glm-4.6');
      expect(caps.supportsVision).toBe(true);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsJsonMode).toBe(true);
      expect(caps.contextWindow).toBe(200000);
      expect(caps.maxOutputTokens).toBe(131072);
    });

    it('should return capabilities for Claude models', () => {
      const caps = getModelCapabilities('claude-sonnet-4');
      expect(caps.supportsVision).toBe(true);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.contextWindow).toBe(200000);
      expect(caps.maxOutputTokens).toBe(64000);
    });

    it('should return capabilities for GPT models', () => {
      const caps = getModelCapabilities('gpt-4o');
      expect(caps.supportsVision).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
      expect(caps.contextWindow).toBe(128000);
    });

    it('should return default capabilities for unknown models', () => {
      const caps = getModelCapabilities('unknown-model-xyz');
      expect(caps.supportsVision).toBe(false);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.contextWindow).toBe(8192);
      expect(caps.maxOutputTokens).toBe(4096);
    });

    it('should match by longest prefix', () => {
      // 'gemini-2.5-pro' should match 'gemini-2.5-pro' not just 'gemini-'
      const caps = getModelCapabilities('gemini-2.5-pro-exp');
      expect(caps.contextWindow).toBe(1048576);
    });

    it('should handle case-insensitive matching', () => {
      const caps1 = getModelCapabilities('GLM-4.6');
      const caps2 = getModelCapabilities('glm-4.6');
      expect(caps1.contextWindow).toBe(caps2.contextWindow);
    });
  });

  describe('getProviderDefaults', () => {
    it('should return ZAI provider defaults', () => {
      const defaults = getProviderDefaults('zai');
      expect(defaults.requiresApiKey).toBe(true);
      expect(defaults.supportsCustomBaseUrl).toBe(true);
      expect(defaults.defaultCapabilities.contextWindow).toBe(200000);
      expect(defaults.defaultCapabilities.maxOutputTokens).toBe(131072);
    });

    it('should return Gemini provider defaults', () => {
      const defaults = getProviderDefaults('gemini');
      expect(defaults.requiresApiKey).toBe(true);
      expect(defaults.supportsModelList).toBe(false);
      expect(defaults.defaultCapabilities.supportsVision).toBe(true);
    });

    it('should return OpenAI provider defaults', () => {
      const defaults = getProviderDefaults('openai');
      expect(defaults.supportsModelList).toBe(true);
      expect(defaults.defaultCapabilities.supportsFunctionCalling).toBe(true);
    });

    it('should return Anthropic provider defaults', () => {
      const defaults = getProviderDefaults('anthropic');
      expect(defaults.defaultCapabilities.supportsVision).toBe(true);
      expect(defaults.defaultCapabilities.contextWindow).toBe(200000);
    });

    it('should return Ollama provider defaults (no API key required)', () => {
      const defaults = getProviderDefaults('ollama');
      expect(defaults.requiresApiKey).toBe(false);
      expect(defaults.supportsModelList).toBe(true);
    });

    it('should return custom provider defaults for unknown provider', () => {
      const defaults = getProviderDefaults('unknown-provider');
      expect(defaults.requiresApiKey).toBe(false);
      expect(defaults.supportsCustomBaseUrl).toBe(true);
    });
  });

  describe('modelSupports', () => {
    it('should check if model supports vision', () => {
      expect(modelSupports('gemini-2.5-pro', 'supportsVision')).toBe(true);
      expect(modelSupports('gpt-3.5-turbo', 'supportsVision')).toBe(false);
    });

    it('should check if model supports streaming', () => {
      expect(modelSupports('glm-4.6', 'supportsStreaming')).toBe(true);
      expect(modelSupports('o1', 'supportsStreaming')).toBe(false);
    });

    it('should check if model supports function calling', () => {
      expect(modelSupports('gpt-4o', 'supportsFunctionCalling')).toBe(true);
      expect(modelSupports('llama', 'supportsFunctionCalling')).toBe(false);
    });

    it('should return true for positive numeric capabilities', () => {
      expect(modelSupports('glm-4.6', 'contextWindow')).toBe(true);
      expect(modelSupports('glm-4.6', 'maxOutputTokens')).toBe(true);
    });
  });

  describe('getModelsWithCapability', () => {
    it('should filter models by vision capability', () => {
      const models = [
        { id: 'gemini-2.5-pro', name: 'Gemini Pro' },
        { id: 'gpt-3.5-turbo', name: 'GPT 3.5' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet' },
      ];
      const visionModels = getModelsWithCapability('supportsVision', models);
      expect(visionModels).toHaveLength(2);
      expect(visionModels.map(m => m.id)).toContain('gemini-2.5-pro');
      expect(visionModels.map(m => m.id)).toContain('claude-sonnet-4');
    });

    it('should return empty array when no models match', () => {
      const models = [{ id: 'unknown-model', name: 'Unknown' }];
      const visionModels = getModelsWithCapability('supportsVision', models);
      expect(visionModels).toHaveLength(0);
    });
  });

  describe('getBestModelForUseCase', () => {
    const testModels = [
      { id: 'gemini-2.5-pro', name: 'Gemini Pro' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'glm-4.6', name: 'GLM 4.6' },
      { id: 'gemini-2.5-flash', name: 'Gemini Flash' },
    ];

    it('should find best model for vision use case', () => {
      const best = getBestModelForUseCase('vision', testModels);
      expect(best).not.toBeNull();
      expect(modelSupports(best!.id, 'supportsVision')).toBe(true);
    });

    it('should find best model for code use case', () => {
      const best = getBestModelForUseCase('code', testModels);
      expect(best).not.toBeNull();
    });

    it('should find best model for long-context use case', () => {
      const best = getBestModelForUseCase('long-context', testModels);
      expect(best).not.toBeNull();
      // Should return model with largest context window
      const caps = getModelCapabilities(best!.id);
      expect(caps.contextWindow).toBeGreaterThanOrEqual(200000);
    });

    it('should find best model for fast use case', () => {
      const best = getBestModelForUseCase('fast', testModels);
      expect(best).not.toBeNull();
    });

    it('should find best model for cheap use case', () => {
      // Add a cheap model (flash/mini/haiku) explicitly for this test
      const modelsWithCheap = [
        ...testModels,
        { id: 'claude-3-haiku', name: 'Claude Haiku' },
      ];
      const best = getBestModelForUseCase('cheap', modelsWithCheap);
      expect(best).not.toBeNull();
      // Should prefer haiku/flash/mini models for cheap use case
      const cheapKeywords = ['flash', 'mini', 'haiku'];
      const isCheapModel = cheapKeywords.some(kw => best!.id.toLowerCase().includes(kw));
      expect(isCheapModel).toBe(true);
    });

    it('should return null for empty model list', () => {
      const best = getBestModelForUseCase('vision', []);
      expect(best).toBeNull();
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate tokens at ~4 chars per token', () => {
      expect(estimateTokenCount('test')).toBe(1);
      expect(estimateTokenCount('hello world')).toBe(3); // 11 chars / 4 = 2.75 → 3
      expect(estimateTokenCount('')).toBe(0);
    });

    it('should handle longer text', () => {
      const text = 'a'.repeat(1000);
      expect(estimateTokenCount(text)).toBe(250);
    });
  });

  describe('fitsInContext', () => {
    it('should return true when content fits', () => {
      const shortContent = 'Hello world'; // ~3 tokens
      expect(fitsInContext('glm-4.6', shortContent)).toBe(true);
    });

    it('should return false when content is too large', () => {
      // GLM-4.6 has 200K context, create content that exceeds it
      const hugeContent = 'a'.repeat(1000000); // ~250K tokens
      expect(fitsInContext('glm-4.6', hugeContent)).toBe(false);
    });

    it('should reserve space for output', () => {
      // With default reserve of 4096, even smaller content might not fit on tiny models
      const content = 'a'.repeat(30000); // ~7500 tokens
      // Default model has 8192 context, so 7500 + 4096 > 8192
      expect(fitsInContext('unknown-model', content)).toBe(false);
    });

    it('should allow custom reserve', () => {
      const content = 'a'.repeat(30000); // ~7500 tokens
      // With only 100 token reserve, it should fit on models with 8192 context
      expect(fitsInContext('unknown-model', content, 100)).toBe(true);
    });
  });

  describe('getRecommendedMaxTokens', () => {
    it('should return max output tokens for GLM-4.6', () => {
      expect(getRecommendedMaxTokens('glm-4.6')).toBe(131072);
    });

    it('should return max output tokens for Claude models', () => {
      expect(getRecommendedMaxTokens('claude-sonnet-4')).toBe(64000);
    });

    it('should return default for unknown models', () => {
      expect(getRecommendedMaxTokens('unknown')).toBe(4096);
    });
  });
});
