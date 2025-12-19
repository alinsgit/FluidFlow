/**
 * Tests for marker format v2 parsers
 */

import { describe, it, expect } from 'vitest';
import {
  parseMarkerMeta,
  parseMarkerManifest,
  parseMarkerBatch,
  validateManifest,
  isMarkerFormatV2,
  parseMarkerFormatResponse,
} from '@/utils/markerFormat';

describe('Marker Format V2', () => {
  describe('parseMarkerMeta', () => {
    it('should parse META block', () => {
      const input = `
<!-- META -->
format: marker
version: 2.0
timestamp: 2025-01-15T10:30:00Z
<!-- /META -->
      `;

      const meta = parseMarkerMeta(input);
      expect(meta).toBeDefined();
      expect(meta?.format).toBe('marker');
      expect(meta?.version).toBe('2.0');
      expect(meta?.timestamp).toBe('2025-01-15T10:30:00Z');
    });

    it('should return undefined if no META block', () => {
      const input = '<!-- FILE:src/App.tsx -->\ncode\n<!-- /FILE:src/App.tsx -->';
      expect(parseMarkerMeta(input)).toBeUndefined();
    });
  });

  describe('parseMarkerManifest', () => {
    it('should parse MANIFEST table', () => {
      const input = `
<!-- MANIFEST -->
| File | Action | Lines | Tokens | Status |
|------|--------|-------|--------|--------|
| src/App.tsx | create | 45 | ~320 | included |
| src/components/Header.tsx | update | 62 | ~450 | included |
| src/old/Deprecated.tsx | delete | 0 | 0 | marked |
<!-- /MANIFEST -->
      `;

      const manifest = parseMarkerManifest(input);
      expect(manifest).toBeDefined();
      expect(manifest?.length).toBe(3);

      expect(manifest?.[0]).toEqual({
        file: 'src/App.tsx',
        action: 'create',
        lines: 45,
        tokens: 320,
        status: 'included',
      });

      expect(manifest?.[1]).toEqual({
        file: 'src/components/Header.tsx',
        action: 'update',
        lines: 62,
        tokens: 450,
        status: 'included',
      });

      expect(manifest?.[2]).toEqual({
        file: 'src/old/Deprecated.tsx',
        action: 'delete',
        lines: 0,
        tokens: 0,
        status: 'marked',
      });
    });

    it('should handle tokens with commas', () => {
      const input = `
<!-- MANIFEST -->
| File | Action | Lines | Tokens | Status |
|------|--------|-------|--------|--------|
| src/App.tsx | create | 100 | 1,200 | included |
<!-- /MANIFEST -->
      `;

      const manifest = parseMarkerManifest(input);
      expect(manifest?.[0]?.tokens).toBe(1200);
    });

    it('should return undefined if no MANIFEST block', () => {
      const input = '<!-- FILE:src/App.tsx -->\ncode\n<!-- /FILE:src/App.tsx -->';
      expect(parseMarkerManifest(input)).toBeUndefined();
    });
  });

  describe('parseMarkerBatch', () => {
    it('should parse BATCH block', () => {
      const input = `
<!-- BATCH -->
current: 1
total: 3
isComplete: false
completed: src/App.tsx, src/components/Header.tsx
remaining: src/utils/helpers.ts, src/hooks/useAuth.ts
nextBatchHint: Utility functions and type definitions
<!-- /BATCH -->
      `;

      const batch = parseMarkerBatch(input);
      expect(batch).toBeDefined();
      expect(batch?.current).toBe(1);
      expect(batch?.total).toBe(3);
      expect(batch?.isComplete).toBe(false);
      expect(batch?.completed).toEqual(['src/App.tsx', 'src/components/Header.tsx']);
      expect(batch?.remaining).toEqual(['src/utils/helpers.ts', 'src/hooks/useAuth.ts']);
      expect(batch?.nextBatchHint).toBe('Utility functions and type definitions');
    });

    it('should default isComplete to true', () => {
      const input = `
<!-- BATCH -->
current: 1
total: 1
<!-- /BATCH -->
      `;

      const batch = parseMarkerBatch(input);
      expect(batch?.isComplete).toBe(true);
    });

    it('should return undefined if no BATCH block', () => {
      const input = '<!-- FILE:src/App.tsx -->\ncode\n<!-- /FILE:src/App.tsx -->';
      expect(parseMarkerBatch(input)).toBeUndefined();
    });
  });

  describe('validateManifest', () => {
    it('should validate files against manifest', () => {
      const manifest = [
        { file: 'src/App.tsx', action: 'create' as const, lines: 10, tokens: 100, status: 'included' as const },
        { file: 'src/Header.tsx', action: 'create' as const, lines: 20, tokens: 200, status: 'included' as const },
      ];

      const files = {
        'src/App.tsx': 'code',
        'src/Header.tsx': 'code',
      };

      const validation = validateManifest(manifest, files);
      expect(validation.isValid).toBe(true);
      expect(validation.missing).toEqual([]);
      expect(validation.expected).toEqual(['src/App.tsx', 'src/Header.tsx']);
      expect(validation.received).toEqual(['src/App.tsx', 'src/Header.tsx']);
    });

    it('should detect missing files', () => {
      const manifest = [
        { file: 'src/App.tsx', action: 'create' as const, lines: 10, tokens: 100, status: 'included' as const },
        { file: 'src/Header.tsx', action: 'create' as const, lines: 20, tokens: 200, status: 'included' as const },
      ];

      const files = {
        'src/App.tsx': 'code',
        // Missing src/Header.tsx
      };

      const validation = validateManifest(manifest, files);
      expect(validation.isValid).toBe(false);
      expect(validation.missing).toEqual(['src/Header.tsx']);
    });

    it('should detect extra files', () => {
      const manifest = [
        { file: 'src/App.tsx', action: 'create' as const, lines: 10, tokens: 100, status: 'included' as const },
      ];

      const files = {
        'src/App.tsx': 'code',
        'src/Extra.tsx': 'extra code',
      };

      const validation = validateManifest(manifest, files);
      expect(validation.isValid).toBe(true); // Extra files don't invalidate
      expect(validation.extra).toEqual(['src/Extra.tsx']);
    });

    it('should ignore files with status other than included', () => {
      const manifest = [
        { file: 'src/App.tsx', action: 'create' as const, lines: 10, tokens: 100, status: 'included' as const },
        { file: 'src/Delete.tsx', action: 'delete' as const, lines: 0, tokens: 0, status: 'marked' as const },
        { file: 'src/Pending.tsx', action: 'create' as const, lines: 30, tokens: 300, status: 'pending' as const },
      ];

      const files = {
        'src/App.tsx': 'code',
      };

      const validation = validateManifest(manifest, files);
      expect(validation.isValid).toBe(true);
      expect(validation.expected).toEqual(['src/App.tsx']); // Only included files
    });

    it('should return valid if no manifest', () => {
      const files = { 'src/App.tsx': 'code' };
      const validation = validateManifest(undefined, files);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('isMarkerFormatV2', () => {
    it('should detect v2 format with META block', () => {
      const input = '<!-- META -->\nformat: marker\n<!-- /META -->';
      expect(isMarkerFormatV2(input)).toBe(true);
    });

    it('should return false for v1 format', () => {
      const input = '<!-- FILE:src/App.tsx -->\ncode\n<!-- /FILE:src/App.tsx -->';
      expect(isMarkerFormatV2(input)).toBe(false);
    });
  });

  describe('parseMarkerFormatResponse with v2', () => {
    it('should parse complete v2 format response', () => {
      const input = `
<!-- META -->
format: marker
version: 2.0
<!-- /META -->

<!-- PLAN -->
create: src/App.tsx
<!-- /PLAN -->

<!-- MANIFEST -->
| File | Action | Lines | Tokens | Status |
|------|--------|-------|--------|--------|
| src/App.tsx | create | 10 | ~100 | included |
<!-- /MANIFEST -->

<!-- EXPLANATION -->
Created App component
<!-- /EXPLANATION -->

<!-- FILE:src/App.tsx -->
export default function App() {
  return <div>Hello</div>;
}
<!-- /FILE:src/App.tsx -->

<!-- BATCH -->
current: 1
total: 1
isComplete: true
<!-- /BATCH -->
      `;

      const result = parseMarkerFormatResponse(input);
      expect(result).not.toBeNull();
      expect(result?.files['src/App.tsx']).toBeDefined();
      expect(result?.meta?.version).toBe('2.0');
      expect(result?.manifest?.length).toBe(1);
      expect(result?.batch?.isComplete).toBe(true);
      expect(result?.validation?.isValid).toBe(true);
      expect(result?.explanation).toBe('Created App component');
    });

    it('should be backwards compatible with v1 format', () => {
      const input = `
<!-- PLAN -->
create: src/App.tsx
<!-- /PLAN -->

<!-- EXPLANATION -->
Created App
<!-- /EXPLANATION -->

<!-- FILE:src/App.tsx -->
const App = () => <div>Test</div>;
export default App;
<!-- /FILE:src/App.tsx -->
      `;

      const result = parseMarkerFormatResponse(input);
      expect(result).not.toBeNull();
      expect(result?.files['src/App.tsx']).toBeDefined();
      expect(result?.meta).toBeUndefined(); // No META = v1
      expect(result?.manifest).toBeUndefined();
      expect(result?.batch).toBeUndefined();
    });
  });
});
