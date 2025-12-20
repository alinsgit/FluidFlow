/**
 * Tests for safeJson utility
 * Tests BUG-004: JSON Parsing Without Try-Catch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeJsonParse, safeJsonStringify, safeJsonParseOrNull } from '../../utils/safeJson';

describe('safeJson', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse(json, { default: true });

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJson = '{"name": "test", "value":}';
      const fallback = { error: true };
      const result = safeJsonParse(invalidJson, fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback for null input', () => {
      const fallback = { error: true };
      const result = safeJsonParse(null, fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback for undefined input', () => {
      const fallback = { error: true };
      const result = safeJsonParse(undefined, fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback for empty string', () => {
      const fallback = { error: true };
      const result = safeJsonParse('', fallback);

      expect(result).toEqual(fallback);
    });

    it('should parse numbers and booleans', () => {
      expect(safeJsonParse('123', 0)).toBe(123);
      expect(safeJsonParse('true', false)).toBe(true);
      expect(safeJsonParse('false', true)).toBe(false);
    });

    it('should handle arrays', () => {
      const json = '[1, 2, 3, "test"]';
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 2, 3, 'test']);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      const obj = { name: 'test', value: 123 };
      const result = safeJsonStringify(obj);

      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should return fallback for circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const fallback = '{"error":"circular"}';
      const result = safeJsonStringify(obj, fallback);

      expect(result).toBe(fallback);
    });

    it('should handle null and undefined', () => {
      expect(safeJsonStringify(null)).toBe('null');
      // undefined is not valid JSON, so it should return the fallback
      expect(safeJsonStringify(undefined)).toBe('{}');
    });

    it('should handle primitive values', () => {
      expect(safeJsonStringify('test')).toBe('"test"');
      expect(safeJsonStringify(123)).toBe('123');
      expect(safeJsonStringify(true)).toBe('true');
    });

    it('should handle functions', () => {
      const fn = () => {};
      // Functions cannot be stringified to JSON, so should return fallback
      const result = safeJsonStringify(fn);

      expect(result).toBe('{}');
    });

    it('should handle functions with custom fallback', () => {
      const fn = () => {};
      const fallback = '{"error":"function"}';
      const result = safeJsonStringify(fn, fallback);

      expect(result).toBe(fallback);
    });

    it('should handle BigInt at top level', () => {
      const result = safeJsonStringify(BigInt(123));
      expect(result).toBe('"123"');
    });

    it('should handle BigInt in objects', () => {
      const result = safeJsonStringify({ count: BigInt(999) });
      expect(result).toBe('{"count":"999"}');
    });

    it('should handle BigInt in nested objects', () => {
      const result = safeJsonStringify({ data: { value: BigInt(42) } });
      expect(result).toBe('{"data":{"value":"42"}}');
    });

    it('should return fallback for Symbol at top level', () => {
      const result = safeJsonStringify(Symbol('test'));
      expect(result).toBe('{}');
    });

    it('should exclude Symbol from objects', () => {
      const result = safeJsonStringify({ key: 'value', sym: Symbol('test') });
      expect(result).toBe('{"key":"value"}');
    });

    it('should support custom fallback via options', () => {
      const result = safeJsonStringify(undefined, { fallback: '{"error":true}' });
      expect(result).toBe('{"error":true}');
    });

    it('should support pretty printing with spaces', () => {
      const result = safeJsonStringify({ a: 1 }, { space: 2 });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('should disable BigInt handling when option is false', () => {
      const result = safeJsonStringify({ count: BigInt(123) }, { handleBigInt: false });
      // Without BigInt handling, it should fail and return fallback
      expect(result).toBe('{}');
    });

    it('should handle empty object', () => {
      expect(safeJsonStringify({})).toBe('{}');
    });

    it('should handle empty array', () => {
      expect(safeJsonStringify([])).toBe('[]');
    });

    it('should handle mixed content arrays', () => {
      const result = safeJsonStringify([1, 'two', true, null]);
      expect(result).toBe('[1,"two",true,null]');
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

    it('should preserve types', () => {
      const result = safeJsonParseOrNull<{ id: number }>('{"id": 42}');
      expect(result?.id).toBe(42);
    });
  });

  describe('safeJsonParse with options', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log errors by default', () => {
      safeJsonParse('{invalid}', {});
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SafeJson] Parse error:',
        expect.any(String)
      );
    });

    it('should suppress error logging when disabled', () => {
      safeJsonParse('{invalid}', {}, { logErrors: false });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const json = '{"a": {"b": {"c": 1}}}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('should handle special characters in strings', () => {
      const json = '{"text": "line1\\nline2\\ttab"}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ text: 'line1\nline2\ttab' });
    });
  });
});