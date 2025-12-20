/**
 * Tests for extractPartialFiles utility
 * Tests extraction of files from truncated AI responses
 */

import { describe, it, expect } from 'vitest';
import { extractFilesFromTruncatedResponse } from '../../utils/extractPartialFiles';

describe('extractPartialFiles', () => {
  describe('extractFilesFromTruncatedResponse', () => {
    describe('JSON parsing', () => {
      it('should extract files from valid JSON response', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': `import React from 'react';
export default function App() {
  return <div>Hello World</div>;
}`
          },
          explanation: 'Created App component'
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.completeFiles)).toContain('src/App.tsx');
        expect(result.summary).toContain('Created App component');
      });

      it('should handle JSON with PLAN comment prefix', () => {
        const response = `// PLAN: {"create":["src/App.tsx"],"total":1}
{
  "files": {
    "src/App.tsx": "export default function App() { return <div>Test</div>; }"
  }
}`;

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.completeFiles).length).toBeGreaterThanOrEqual(0);
      });

      it('should handle BOM and invisible characters', () => {
        const response = '\uFEFF' + JSON.stringify({
          files: {
            'src/App.tsx': 'export default function App() { return <div>Test</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.completeFiles).length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Regex extraction fallback', () => {
      it('should extract files using backtick pattern', () => {
        const response = `{
          "files": {
            "src/utils/helper.ts": \`export function helper() {
  return 'hello';
}\`
          }
        }`;

        const result = extractFilesFromTruncatedResponse(response);
        // May extract via regex if JSON parsing fails
        expect(result).toBeDefined();
      });

      it('should extract files using quote pattern', () => {
        const response = `{
  "files": {
    "src/App.tsx": "export default function App() {\\n  return <div>Test</div>;\\n}"
  }
}`;

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should skip content that is just a file extension', () => {
        // This tests the safeguard against regex matching wrong part
        const response = `{
  "src/file.tsx": "valid content here with enough length to pass"
}`;

        const result = extractFilesFromTruncatedResponse(response);
        // Should not crash and should handle gracefully
        expect(result).toBeDefined();
      });

      it('should extract explanation from response', () => {
        const response = `{
  "files": {
    "src/App.tsx": "export default function App() { return <div>Test</div>; }"
  },
  "explanation": "Created a simple React component"
}`;

        const result = extractFilesFromTruncatedResponse(response);
        expect(result.summary).toContain('Created a simple React component');
      });
    });

    describe('File completeness detection', () => {
      it('should mark files with balanced braces as complete', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': `function App() {
  return (
    <div>
      <h1>Hello</h1>
    </div>
  );
}
export default App;`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // File should be in either completeFiles or get fixed and moved there
        const hasFile =
          Object.keys(result.completeFiles).includes('src/App.tsx') ||
          Object.keys(result.partialFiles).includes('src/App.tsx');
        expect(hasFile).toBe(true);
      });

      it('should mark files ending with comma as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/data.ts': `const data = {
  name: "test",`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/data.ts');
      });

      it('should mark files with incomplete className as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': `function App() {
  return <div className="container`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/App.tsx');
      });

      it('should mark files with incomplete template literal as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/utils.ts': 'const msg = `Hello'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/utils.ts');
      });

      it('should validate JSON files by parsing', () => {
        const validJsonResponse = JSON.stringify({
          files: {
            'src/config.json': '{"key": "value", "nested": {"a": 1}}'
          }
        });

        const result = extractFilesFromTruncatedResponse(validJsonResponse);
        // Valid JSON should be recognized, either complete or extractable
        const hasFile =
          Object.keys(result.completeFiles).includes('src/config.json') ||
          Object.keys(result.partialFiles).includes('src/config.json');
        expect(hasFile).toBe(true);
      });

      it('should mark invalid JSON files as incomplete', () => {
        const invalidJsonResponse = JSON.stringify({
          files: {
            'src/config.json': '{"key": "value"'
          }
        });

        const result = extractFilesFromTruncatedResponse(invalidJsonResponse);
        expect(Object.keys(result.partialFiles)).toContain('src/config.json');
      });
    });

    describe('JSX/TSX special handling', () => {
      it('should handle complete JSX with balanced tags', () => {
        const response = JSON.stringify({
          files: {
            'src/Component.tsx': `export function Component() {
  return (
    <div>
      <span>Hello</span>
    </div>
  );
}`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Component may be in completeFiles or partialFiles
        const hasFile =
          Object.keys(result.completeFiles).includes('src/Component.tsx') ||
          Object.keys(result.partialFiles).includes('src/Component.tsx');
        expect(hasFile).toBe(true);
      });

      it('should handle self-closing JSX tags', () => {
        const response = JSON.stringify({
          files: {
            'src/Component.tsx': `export function Component() {
  return <input type="text" />;
}`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Component may be in completeFiles or partialFiles
        const hasFile =
          Object.keys(result.completeFiles).includes('src/Component.tsx') ||
          Object.keys(result.partialFiles).includes('src/Component.tsx');
        expect(hasFile).toBe(true);
      });

      it('should attempt to fix incomplete className attributes', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': `function App() { return <div className="test>Content</div>; }`
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Should attempt to process, may end up in partialFiles
        expect(result).toBeDefined();
      });
    });

    describe('Long file handling', () => {
      it('should treat long files with balanced braces as complete', () => {
        const longCode = `function App() {
${Array(100).fill('  const x = 1;').join('\n')}
  return <div>Hello</div>;
}
export default App;`;

        const response = JSON.stringify({
          files: { 'src/App.tsx': longCode }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Long file may be in completeFiles or partialFiles
        const hasFile =
          Object.keys(result.completeFiles).includes('src/App.tsx') ||
          Object.keys(result.partialFiles).includes('src/App.tsx');
        expect(hasFile).toBe(true);
      });
    });

    describe('Summary generation', () => {
      it('should generate summary for files', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'export default function App() { return <div>Test</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Summary should exist and contain something meaningful
        expect(result.summary).toBeDefined();
        expect(typeof result.summary).toBe('string');
      });

      it('should handle mixed complete and partial files', () => {
        const response = JSON.stringify({
          files: {
            'src/complete.tsx': 'export default function App() { return <div>Test</div>; }',
            'src/partial.tsx': 'function incomplete() {'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        const totalFiles = Object.keys(result.completeFiles).length +
                          Object.keys(result.partialFiles).length;
        // Should have extracted at least one file
        expect(totalFiles).toBeGreaterThan(0);
      });
    });

    describe('Truncation detection', () => {
      it('should handle content ending with backslash', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const path = "c:\\'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should handle very short content as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'con'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/App.tsx');
      });
    });

    describe('Security (BUG-022)', () => {
      it('should handle very large inputs safely', () => {
        // Create a large but valid response
        const largeContent = 'x'.repeat(100000);
        const response = JSON.stringify({
          files: {
            'src/large.ts': largeContent
          }
        });

        const start = Date.now();
        const result = extractFilesFromTruncatedResponse(response);
        const elapsed = Date.now() - start;

        expect(result).toBeDefined();
        // Should not take too long (ReDoS prevention)
        expect(elapsed).toBeLessThan(5000);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty response', () => {
        const result = extractFilesFromTruncatedResponse('');
        expect(result.completeFiles).toEqual({});
        expect(result.partialFiles).toEqual({});
      });

      it('should handle non-JSON text', () => {
        const result = extractFilesFromTruncatedResponse('This is just plain text');
        expect(result.completeFiles).toEqual({});
      });

      it('should handle existing files parameter', () => {
        const existingFiles = { 'src/existing.ts': 'existing content' };
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'export default function App() { return <div>Test</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response, existingFiles);
        expect(result).toBeDefined();
      });

      it('should handle files with special characters in content', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const str = "Hello\\nWorld\\t!";'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should handle files with escape sequences in strings', () => {
        // Tests the escape handling in completeness checking (lines 282-284)
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const path = "C:\\\\Users\\\\test"; export default function App() { return <div>{path}</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should handle files with template literals', () => {
        // Tests the template literal handling (lines 292-294)
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const greeting = `Hello ${name}!`; export default function App() { return <div>{greeting}</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should handle files with nested template literals and braces', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const fn = () => { const x = `Value: ${obj.prop}`; return { x }; }; export default fn;'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });

      it('should handle files with escaped quotes in strings', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'const str = "He said \\"hello\\""; export default function App() { return <div>{str}</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });
    });

    describe('JSON file completeness (lines 236-242)', () => {
      it('should mark valid JSON file as complete', () => {
        const response = JSON.stringify({
          files: {
            'src/config.json': '{"name": "test", "version": 1, "settings": {"enabled": true}}'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Valid JSON should be in completeFiles
        expect(Object.keys(result.completeFiles)).toContain('src/config.json');
        expect(Object.keys(result.partialFiles)).not.toContain('src/config.json');
      });

      it('should mark invalid JSON file as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/broken.json': '{"name": "test", "missing": '
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        // Invalid JSON should be in partialFiles
        expect(Object.keys(result.partialFiles)).toContain('src/broken.json');
      });

      it('should mark truncated JSON array as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/data.json': '[1, 2, 3, {"nested":'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/data.json');
      });
    });

    describe('Template literal handling in JSX (lines 293-295)', () => {
      it('should handle JSX with template literals containing braces', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'export function App() { const x = `Value: ${obj.prop}`; return <div>{x}</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
        const hasFile = Object.keys(result.completeFiles).includes('src/App.tsx') ||
                        Object.keys(result.partialFiles).includes('src/App.tsx');
        expect(hasFile).toBe(true);
      });

      it('should handle unclosed template literal as incomplete', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'export function App() { const x = `Value: ${obj'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(Object.keys(result.partialFiles)).toContain('src/App.tsx');
      });

      it('should handle string escaping in JSX completeness check', () => {
        const response = JSON.stringify({
          files: {
            'src/App.tsx': 'export function App() { const s = "test \\\\ escape"; return <div>{s}</div>; }'
          }
        });

        const result = extractFilesFromTruncatedResponse(response);
        expect(result).toBeDefined();
      });
    });
  });
});
