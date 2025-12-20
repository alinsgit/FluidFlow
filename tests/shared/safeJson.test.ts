/**
 * Tests for shared/safeJson utility
 * Tests the shared safeJson module used by both client and server
 */

import { describe, it, expect, vi } from 'vitest';
import { safeJsonParse, safeJsonStringify, safeJsonParseOrNull } from '../../shared/safeJson';

describe('shared/safeJson', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { error: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback for null input', () => {
      const fallback = { default: true };
      const result = safeJsonParse(null, fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback for undefined input', () => {
      const fallback = { default: true };
      const result = safeJsonParse(undefined, fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      const obj = { name: 'test', value: 123 };
      const result = safeJsonStringify(obj);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should return fallback for circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      const fallback = '{"error":"circular"}';
      const result = safeJsonStringify(obj, { fallback });
      expect(result).toBe(fallback);
    });

    it('should handle BigInt values', () => {
      const result = safeJsonStringify({ count: BigInt(123) });
      expect(result).toBe('{"count":"123"}');
    });

    it('should handle BigInt at top level', () => {
      const result = safeJsonStringify(BigInt(999));
      expect(result).toBe('"999"');
    });

    it('should return fallback for undefined value (line 123-124)', () => {
      // undefined passed directly to JSON.stringify returns undefined
      // Our function should return the fallback
      const result = safeJsonStringify(undefined);
      expect(result).toBe('{}');
    });

    it('should return custom fallback for undefined value', () => {
      const result = safeJsonStringify(undefined, { fallback: '{"empty":true}' });
      expect(result).toBe('{"empty":true}');
    });

    it('should return fallback for function value', () => {
      const fn = () => {};
      const result = safeJsonStringify(fn);
      // Functions cannot be stringified, returns fallback
      expect(result).toBe('{}');
    });

    it('should return fallback for Symbol value', () => {
      const sym = Symbol('test');
      const result = safeJsonStringify(sym);
      // Symbols cannot be stringified, returns fallback
      expect(result).toBe('{}');
    });

    it('should handle null value', () => {
      const result = safeJsonStringify(null);
      expect(result).toBe('null');
    });

    it('should handle empty object', () => {
      const result = safeJsonStringify({});
      expect(result).toBe('{}');
    });

    it('should handle empty array', () => {
      const result = safeJsonStringify([]);
      expect(result).toBe('[]');
    });

    it('should support pretty printing', () => {
      const result = safeJsonStringify({ a: 1 }, { space: 2 });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('should disable BigInt handling when option is false', () => {
      const result = safeJsonStringify({ count: BigInt(123) }, { handleBigInt: false });
      // Without BigInt handling, stringify fails and returns fallback
      expect(result).toBe('{}');
    });
  });

  describe('safeJsonParseOrNull', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParseOrNull('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParseOrNull('not json');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = safeJsonParseOrNull(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = safeJsonParseOrNull(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = safeJsonParseOrNull('');
      expect(result).toBeNull();
    });
  });

  describe('safeJsonStringify - edge cases (lines 122-124)', () => {
    it('should return fallback when JSON.stringify returns undefined', () => {
      // Mock JSON.stringify to return undefined
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockReturnValue(undefined);

      try {
        const result = safeJsonStringify({ test: true }, { fallback: '{"mocked":true}' });
        // Should return the fallback when stringify returns undefined
        expect(result).toBe('{"mocked":true}');
      } finally {
        // Restore original
        JSON.stringify = originalStringify;
      }
    });

    it('should handle edge case where stringify returns undefined with default fallback', () => {
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockReturnValue(undefined);

      try {
        const result = safeJsonStringify({ test: true });
        // Should return the default fallback '{}'
        expect(result).toBe('{}');
      } finally {
        JSON.stringify = originalStringify;
      }
    });
  });
});
