/**
 * Tests for AI schema utilities
 */

import { describe, it, expect } from 'vitest';
import {
  supportsAdditionalProperties,
  schemaHasDynamicKeys,
  supportsNativeSchema,
  getSchemaForProvider,
} from '../../services/ai/utils/schemas';

describe('Schema Utilities', () => {
  describe('supportsAdditionalProperties', () => {
    it('should return false for all providers', () => {
      // No provider fully supports additionalProperties for dynamic keys
      expect(supportsAdditionalProperties('gemini')).toBe(false);
      expect(supportsAdditionalProperties('openai')).toBe(false);
      expect(supportsAdditionalProperties('anthropic')).toBe(false);
      expect(supportsAdditionalProperties('openrouter')).toBe(false);
      expect(supportsAdditionalProperties('zai')).toBe(false);
      expect(supportsAdditionalProperties('custom')).toBe(false);
    });
  });

  describe('schemaHasDynamicKeys', () => {
    it('should detect top-level additionalProperties', () => {
      const schema = {
        type: 'object',
        additionalProperties: { type: 'string' },
      };
      expect(schemaHasDynamicKeys(schema)).toBe(true);
    });

    it('should detect nested additionalProperties in properties', () => {
      const schema = {
        type: 'object',
        properties: {
          files: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      };
      expect(schemaHasDynamicKeys(schema)).toBe(true);
    });

    it('should return false for static schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'number' },
        },
        additionalProperties: false,
      };
      expect(schemaHasDynamicKeys(schema)).toBe(false);
    });

    it('should handle schema with additionalProperties: false', () => {
      const schema = {
        type: 'object',
        properties: {
          result: { type: 'string' },
        },
        additionalProperties: false,
      };
      expect(schemaHasDynamicKeys(schema)).toBe(false);
    });

    it('should handle empty schema', () => {
      const schema = { type: 'object' };
      expect(schemaHasDynamicKeys(schema)).toBe(false);
    });

    it('should handle schema with non-object properties', () => {
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'number' },
          items: { type: 'array', items: { type: 'string' } },
        },
      };
      expect(schemaHasDynamicKeys(schema)).toBe(false);
    });
  });

  describe('supportsNativeSchema', () => {
    const staticSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: false,
    };

    const dynamicSchema = {
      type: 'object',
      properties: {
        files: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    };

    it('should return true for static schema on supported providers', () => {
      expect(supportsNativeSchema('gemini', staticSchema)).toBe(true);
      expect(supportsNativeSchema('openai', staticSchema)).toBe(true);
      expect(supportsNativeSchema('anthropic', staticSchema)).toBe(true);
      expect(supportsNativeSchema('openrouter', staticSchema)).toBe(true);
    });

    it('should return false for dynamic schema on all providers', () => {
      expect(supportsNativeSchema('gemini', dynamicSchema)).toBe(false);
      expect(supportsNativeSchema('openai', dynamicSchema)).toBe(false);
      expect(supportsNativeSchema('anthropic', dynamicSchema)).toBe(false);
      expect(supportsNativeSchema('openrouter', dynamicSchema)).toBe(false);
    });

    it('should return false for unsupported providers', () => {
      expect(supportsNativeSchema('zai', staticSchema)).toBe(false);
      expect(supportsNativeSchema('custom', staticSchema)).toBe(false);
      expect(supportsNativeSchema('ollama', staticSchema)).toBe(false);
      expect(supportsNativeSchema('lmstudio', staticSchema)).toBe(false);
    });

    it('should return false when no schema provided', () => {
      expect(supportsNativeSchema('openai')).toBe(false);
      expect(supportsNativeSchema('gemini', undefined)).toBe(false);
    });
  });

  describe('getSchemaForProvider', () => {
    const staticSchema = {
      type: 'object',
      properties: {
        result: { type: 'string' },
      },
    };

    it('should return schema when no dynamic keys', () => {
      const result = getSchemaForProvider(staticSchema, 'openai', false);
      expect(result).toEqual(staticSchema);
    });

    it('should return null when dynamic keys and provider does not support them', () => {
      const result = getSchemaForProvider(staticSchema, 'openai', true);
      expect(result).toBeNull();
    });

    it('should return null for any provider with dynamic keys', () => {
      // All providers return null for dynamic keys
      expect(getSchemaForProvider(staticSchema, 'gemini', true)).toBeNull();
      expect(getSchemaForProvider(staticSchema, 'anthropic', true)).toBeNull();
      expect(getSchemaForProvider(staticSchema, 'zai', true)).toBeNull();
    });

    it('should return schema for static schema with default hasDynamicKeys', () => {
      const result = getSchemaForProvider(staticSchema, 'openai');
      expect(result).toEqual(staticSchema);
    });
  });
});
