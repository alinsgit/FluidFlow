/**
 * Error Fix Validation Tests
 *
 * Tests for code validation, syntax checking, and fix verification.
 */

import { describe, it, expect } from 'vitest';
import {
  isCodeValid,
  validateSyntax,
  validateJSX,
  verifyFix,
  doesFixResolveError,
} from '../../../services/errorFix/validation';

describe('Error Fix Validation', () => {
  describe('isCodeValid', () => {
    it('should return true for valid code', () => {
      const code = `
        const App = () => {
          return <div>Hello</div>;
        };
      `;
      expect(isCodeValid(code)).toBe(true);
    });

    it('should return false for unbalanced brackets', () => {
      const code = `const x = { a: 1`;
      expect(isCodeValid(code)).toBe(false);
    });

    it('should return false for unterminated string', () => {
      const code = `const x = "hello`;
      expect(isCodeValid(code)).toBe(false);
    });
  });

  describe('validateSyntax', () => {
    it('should validate balanced parentheses', () => {
      const result = validateSyntax('function foo() { return (1 + 2); }');
      expect(result.valid).toBe(true);
    });

    it('should validate balanced brackets', () => {
      const result = validateSyntax('const arr = [1, 2, [3, 4]];');
      expect(result.valid).toBe(true);
    });

    it('should validate balanced braces', () => {
      const result = validateSyntax('const obj = { a: { b: 1 } };');
      expect(result.valid).toBe(true);
    });

    it('should detect unbalanced parentheses', () => {
      const result = validateSyntax('function foo() { return (1 + 2; }');
      expect(result.valid).toBe(false);
      expect(result.error).toContain(')');
    });

    it('should detect unbalanced brackets', () => {
      const result = validateSyntax('const arr = [1, 2, 3;');
      expect(result.valid).toBe(false);
      expect(result.error).toContain(']');
    });

    it('should detect unbalanced braces', () => {
      const result = validateSyntax('const obj = { a: 1;');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('}');
    });

    it('should detect unexpected closing bracket', () => {
      const result = validateSyntax('const x = 1 + 2);');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected');
    });

    it('should detect mismatched brackets', () => {
      const result = validateSyntax('const x = (1 + 2];');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Expected');
    });

    it('should handle single-line comments', () => {
      const result = validateSyntax(`
        const x = 1; // this is a comment (with unbalanced paren
        const y = 2;
      `);
      expect(result.valid).toBe(true);
    });

    it('should handle block comments', () => {
      const result = validateSyntax(`
        const x = 1; /* comment { with unbalanced brace */
        const y = 2;
      `);
      expect(result.valid).toBe(true);
    });

    it('should handle strings with brackets', () => {
      const result = validateSyntax(`const x = "( { [ unbalanced";`);
      expect(result.valid).toBe(true);
    });

    it('should handle template literals with brackets', () => {
      const result = validateSyntax('const x = `template with { unbalanced`;');
      expect(result.valid).toBe(true);
    });

    it('should detect unterminated double-quoted string', () => {
      const result = validateSyntax('const x = "hello');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unterminated string');
    });

    it('should detect unterminated single-quoted string', () => {
      const result = validateSyntax("const x = 'hello");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unterminated string');
    });

    it('should detect unterminated template literal', () => {
      const result = validateSyntax('const x = `hello');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unterminated string');
    });

    it('should handle escaped quotes in strings', () => {
      const result = validateSyntax(`const x = "hello \\"world\\"";`);
      expect(result.valid).toBe(true);
    });

    it('should handle nested block comments', () => {
      const result = validateSyntax(`
        /* outer comment
           /* nested - but this ends the outer */
        const x = 1;
      `);
      // Block comments don't nest, so this should be valid
      expect(result.valid).toBe(true);
    });

    it('should handle empty code', () => {
      const result = validateSyntax('');
      expect(result.valid).toBe(true);
    });

    it('should handle complex nested structures', () => {
      const code = `
        const Component = () => {
          const [state, setState] = useState({
            items: [1, 2, 3],
            config: { nested: { deep: true } }
          });
          return (
            <div>
              {state.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          );
        };
      `;
      expect(validateSyntax(code).valid).toBe(true);
    });
  });

  describe('validateJSX', () => {
    it('should validate properly closed tags', () => {
      const result = validateJSX('<div><span>Hello</span></div>');
      expect(result.valid).toBe(true);
    });

    it('should validate self-closing tags', () => {
      const result = validateJSX('<div><img src="test.jpg" /></div>');
      expect(result.valid).toBe(true);
    });

    it('should detect unclosed tags', () => {
      const result = validateJSX('<div><span>Hello</div>');
      expect(result.valid).toBe(false);
      // The validator reports the closing tag mismatch
      expect(result.error).toBeDefined();
    });

    it('should detect unexpected closing tags', () => {
      const result = validateJSX('<div></span></div>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected closing tag');
    });

    it('should handle void elements', () => {
      const result = validateJSX('<div><br><hr><input></div>');
      expect(result.valid).toBe(true);
    });

    it('should handle component tags', () => {
      const result = validateJSX('<MyComponent><ChildComponent /></MyComponent>');
      expect(result.valid).toBe(true);
    });

    it('should handle namespaced tags', () => {
      const result = validateJSX('<Foo.Bar><Foo.Baz /></Foo.Bar>');
      expect(result.valid).toBe(true);
    });

    it('should detect unclosed component tags', () => {
      const result = validateJSX('<MyComponent>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unclosed tag');
    });

    it('should handle empty JSX', () => {
      const result = validateJSX('');
      expect(result.valid).toBe(true);
    });

    it('should handle meta and link tags', () => {
      const result = validateJSX('<head><meta charset="utf-8"><link rel="stylesheet"></head>');
      expect(result.valid).toBe(true);
    });
  });

  describe('verifyFix', () => {
    it('should pass verification for valid fix', () => {
      const result = verifyFix({
        originalError: 'useState is not defined',
        originalFiles: {
          'src/App.tsx': 'const [count, setCount] = useState(0);',
        },
        fixedFiles: {
          'src/App.tsx': `import { useState } from 'react';
const [count, setCount] = useState(0);`,
        },
        changedFiles: ['src/App.tsx'],
      });

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail verification for empty fixed file', () => {
      const result = verifyFix({
        originalError: 'some error',
        originalFiles: { 'src/App.tsx': 'const x = 1;' },
        fixedFiles: { 'src/App.tsx': '' },
        changedFiles: ['src/App.tsx'],
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.type === 'error')).toBe(true);
    });

    it('should warn for very short fixed file', () => {
      const result = verifyFix({
        originalError: 'some error',
        originalFiles: { 'src/App.tsx': 'const x = 1;' },
        fixedFiles: { 'src/App.tsx': 'x = 1' }, // Very short, less than 50 chars
        changedFiles: ['src/App.tsx'],
      });

      expect(result.issues.some((i) => i.message.includes('very short'))).toBe(true);
    });

    it('should fail verification for syntax errors', () => {
      const result = verifyFix({
        originalError: 'some error',
        originalFiles: { 'src/App.tsx': 'const x = 1;' },
        fixedFiles: { 'src/App.tsx': 'const x = { a: 1' }, // Unbalanced
        changedFiles: ['src/App.tsx'],
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('Syntax error'))).toBe(true);
    });

    it('should check if error is addressed', () => {
      const result = verifyFix({
        originalError: 'myVar is not defined',
        originalFiles: { 'src/App.tsx': 'console.log(myVar);' },
        fixedFiles: { 'src/App.tsx': 'console.log(myVar);' }, // Unchanged
        changedFiles: ['src/App.tsx'],
      });

      expect(result.issues.some((i) => i.message.includes('not address error'))).toBe(true);
    });

    it('should handle strict mode regression check', () => {
      const result = verifyFix({
        originalError: 'some error',
        originalFiles: {
          'src/App.tsx': `
export const Component = () => {};
export const Helper = () => {};
export default function App() { return null; }
          `.trim(),
        },
        fixedFiles: {
          'src/App.tsx': `
export const Component = () => {};
          `.trim(),
        },
        changedFiles: ['src/App.tsx'],
        strictMode: true,
      });

      expect(result.issues.some((i) => i.message.includes('Exports reduced'))).toBe(true);
    });

    it('should return confidence level', () => {
      const result = verifyFix({
        originalError: 'useState is not defined',
        originalFiles: { 'src/App.tsx': 'useState()' },
        fixedFiles: {
          'src/App.tsx': `import { useState } from 'react';
useState();`,
        },
        changedFiles: ['src/App.tsx'],
      });

      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('should handle missing fixed file', () => {
      const result = verifyFix({
        originalError: 'some error',
        originalFiles: { 'src/App.tsx': 'const x = 1;' },
        fixedFiles: {},
        changedFiles: ['src/App.tsx'],
      });

      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('empty or missing'))).toBe(true);
    });
  });

  describe('doesFixResolveError', () => {
    it('should return true when import is added for undefined variable', () => {
      const result = doesFixResolveError(
        'useState is not defined',
        'useState(0)',
        `import { useState } from 'react';\nuseState(0)`
      );
      expect(result).toBe(true);
    });

    it('should return true when variable is defined', () => {
      const result = doesFixResolveError(
        'myVar is not defined',
        'console.log(myVar)',
        'const myVar = 1;\nconsole.log(myVar)'
      );
      expect(result).toBe(true);
    });

    it('should return false when variable is still not defined', () => {
      const result = doesFixResolveError(
        'myVar is not defined',
        'console.log(myVar)',
        'console.log(myVar)' // No change
      );
      expect(result).toBe(false);
    });

    it('should return true when bare specifier is converted to relative path', () => {
      const result = doesFixResolveError(
        '"src/utils/helper" was a bare specifier',
        `import { helper } from 'src/utils/helper';`,
        `import { helper } from './utils/helper';`
      );
      expect(result).toBe(true);
    });

    it('should return false when bare specifier is still present', () => {
      const result = doesFixResolveError(
        '"src/utils/helper" was a bare specifier',
        `import { helper } from 'src/utils/helper';`,
        `import { helper } from 'src/utils/helper';` // No change
      );
      expect(result).toBe(false);
    });

    it('should return true when code is changed for unknown errors', () => {
      const result = doesFixResolveError(
        'Some random error',
        'const x = 1;',
        'const x = 2;' // Changed
      );
      expect(result).toBe(true);
    });

    it('should return false when code is unchanged for unknown errors', () => {
      const result = doesFixResolveError('Some random error', 'const x = 1;', 'const x = 1;');
      expect(result).toBe(false);
    });
  });
});
