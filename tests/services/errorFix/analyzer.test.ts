/**
 * Error Analyzer Tests
 *
 * Tests for error parsing, classification, and analysis.
 */

import { describe, it, expect } from 'vitest';
import { errorAnalyzer, ErrorAnalyzer } from '../../../services/errorFix/analyzer';

describe('Error Analyzer', () => {
  describe('exports', () => {
    it('should export singleton errorAnalyzer', () => {
      expect(errorAnalyzer).toBeDefined();
      expect(errorAnalyzer).toBeInstanceOf(ErrorAnalyzer);
    });

    it('should export ErrorAnalyzer class', () => {
      expect(ErrorAnalyzer).toBeDefined();
      const instance = new ErrorAnalyzer();
      expect(instance).toBeInstanceOf(ErrorAnalyzer);
    });
  });

  describe('analyze', () => {
    describe('bare specifier errors', () => {
      it('should parse bare specifier error', () => {
        const result = errorAnalyzer.analyze('"src/utils/helper" was a bare specifier');

        expect(result.type).toBe('bare-specifier');
        expect(result.category).toBe('import');
        expect(result.importPath).toBe('src/utils/helper');
        expect(result.isAutoFixable).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse "not remapped" specifier error', () => {
        const result = errorAnalyzer.analyze('specifier "src/components/Button" was not remapped');

        expect(result.type).toBe('bare-specifier');
        expect(result.category).toBe('import');
        expect(result.importPath).toBe('src/components/Button');
        expect(result.isAutoFixable).toBe(true);
      });
    });

    describe('module not found errors', () => {
      it('should parse cannot find module error', () => {
        const result = errorAnalyzer.analyze("Cannot find module './utils/missing'");

        expect(result.type).toBe('module-not-found');
        expect(result.category).toBe('import');
        expect(result.importPath).toBe('./utils/missing');
      });

      it('should parse failed to resolve import error', () => {
        const result = errorAnalyzer.analyze('Failed to resolve import "react-query"');

        expect(result.type).toBe('module-not-found');
        expect(result.category).toBe('import');
        expect(result.importPath).toBe('react-query');
        expect(result.isAutoFixable).toBe(true);
      });
    });

    describe('undefined variable errors', () => {
      it('should parse ReferenceError not defined', () => {
        const result = errorAnalyzer.analyze('ReferenceError: useState is not defined');

        expect(result.type).toBe('undefined-variable');
        expect(result.category).toBe('import');
        expect(result.identifier).toBe('useState');
        expect(result.isAutoFixable).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should parse simple not defined error', () => {
        const result = errorAnalyzer.analyze('myFunction is not defined');

        expect(result.type).toBe('undefined-variable');
        expect(result.identifier).toBe('myFunction');
        expect(result.isAutoFixable).toBe(true);
      });

      it('should parse cannot find name error', () => {
        const result = errorAnalyzer.analyze('Cannot find name "React"');

        expect(result.type).toBe('undefined-variable');
        expect(result.identifier).toBe('React');
        expect(result.isAutoFixable).toBe(true);
      });
    });

    describe('type errors', () => {
      it('should parse type not assignable error', () => {
        const result = errorAnalyzer.analyze(
          'Type "string" is not assignable to type "number"'
        );

        expect(result.type).toBe('type-error');
        expect(result.category).toBe('type');
        expect(result.actualType).toBe('string');
        expect(result.expectedType).toBe('number');
        expect(result.isAutoFixable).toBe(false);
      });

      it('should parse property does not exist error', () => {
        const result = errorAnalyzer.analyze(
          'Property "foo" does not exist on type "Bar"'
        );

        expect(result.type).toBe('property-error');
        expect(result.category).toBe('type');
        expect(result.missingProperty).toBe('foo');
      });
    });

    describe('syntax errors', () => {
      it('should parse SyntaxError', () => {
        const result = errorAnalyzer.analyze('SyntaxError: Unexpected token }');

        expect(result.type).toBe('syntax-error');
        expect(result.category).toBe('syntax');
        expect(result.priority).toBe(5);
      });

      it('should parse unexpected token error', () => {
        const result = errorAnalyzer.analyze('Unexpected token ";"');

        expect(result.type).toBe('syntax-error');
        expect(result.category).toBe('syntax');
        // The regex captures the token without leading quote
        expect(result.identifier).toContain(';');
      });

      it('should parse unterminated string literal error', () => {
        const result = errorAnalyzer.analyze('Unterminated string literal');

        expect(result.type).toBe('syntax-error');
        expect(result.category).toBe('syntax');
        expect(result.suggestedFix).toContain('Close');
      });

      it('should parse unterminated template literal error', () => {
        const result = errorAnalyzer.analyze('Unterminated template literal');

        expect(result.type).toBe('syntax-error');
        expect(result.category).toBe('syntax');
      });
    });

    describe('JSX errors', () => {
      it('should parse unclosed JSX tag error', () => {
        const result = errorAnalyzer.analyze(
          'JSX element "div" has no corresponding closing tag'
        );

        expect(result.type).toBe('jsx-error');
        expect(result.category).toBe('jsx');
        expect(result.identifier).toBe('div');
        expect(result.suggestedFix).toContain('closing tag');
      });

      it('should parse adjacent JSX elements error', () => {
        const result = errorAnalyzer.analyze(
          'Adjacent JSX elements must be wrapped in an enclosing tag'
        );

        expect(result.type).toBe('jsx-error');
        expect(result.category).toBe('jsx');
        expect(result.suggestedFix).toContain('fragment');
      });
    });

    describe('React hook errors', () => {
      it('should parse hook called conditionally error', () => {
        const result = errorAnalyzer.analyze(
          'React Hook "useState" is called conditionally'
        );

        expect(result.type).toBe('hook-error');
        expect(result.category).toBe('react');
        expect(result.identifier).toBe('useState');
        expect(result.suggestedFix).toContain('top level');
      });

      it('should parse invalid hook call error', () => {
        const result = errorAnalyzer.analyze('Invalid hook call');

        expect(result.type).toBe('hook-error');
        expect(result.category).toBe('react');
        expect(result.suggestedFix).toContain('function components');
      });
    });

    describe('runtime errors', () => {
      it('should parse cannot read property of undefined', () => {
        const result = errorAnalyzer.analyze(
          'Cannot read property "map" of undefined'
        );

        expect(result.type).toBe('runtime-error');
        expect(result.category).toBe('runtime');
        expect(result.missingProperty).toBe('map');
        expect(result.suggestedFix).toContain('null check');
      });

      it('should parse is not a function error', () => {
        const result = errorAnalyzer.analyze('onClick is not a function');

        expect(result.type).toBe('runtime-error');
        expect(result.category).toBe('runtime');
        expect(result.identifier).toBe('onClick');
      });
    });

    describe('missing export errors', () => {
      it('should parse missing export error', () => {
        const result = errorAnalyzer.analyze(
          'Module "lucide-react" does not provide an export named "Icon"'
        );

        expect(result.type).toBe('missing-export');
        expect(result.category).toBe('import');
        expect(result.identifier).toBe('Icon');
      });

      it('should suggest correct export for known libraries', () => {
        const result = errorAnalyzer.analyze(
          'Module "@react-three/drei" does not provide an export named "TextView"'
        );

        expect(result.type).toBe('missing-export');
        expect(result.correctExport).toBe('Text');
        expect(result.isAutoFixable).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('should handle react-router migration suggestions', () => {
        const result = errorAnalyzer.analyze(
          'Module "react-router-dom" does not provide an export named "Switch"'
        );

        expect(result.correctExport).toBe('Routes');
        expect(result.isAutoFixable).toBe(true);
      });
    });

    describe('network errors', () => {
      it('should parse failed to fetch error', () => {
        const result = errorAnalyzer.analyze('Failed to fetch');

        expect(result.type).toBe('network-error');
        expect(result.category).toBe('network');
        expect(result.isIgnorable).toBe(true);
        expect(result.isAutoFixable).toBe(false);
      });

      it('should parse CORS error', () => {
        const result = errorAnalyzer.analyze('Cross-Origin Request Blocked');

        expect(result.type).toBe('network-error');
        expect(result.category).toBe('network');
        expect(result.isIgnorable).toBe(true);
      });
    });

    describe('file location extraction', () => {
      it('should extract file location from error message', () => {
        const result = errorAnalyzer.analyze(
          'Error in src/components/Button.tsx:25:10'
        );

        expect(result.file).toBe('src/components/Button.tsx');
        expect(result.line).toBe(25);
        expect(result.column).toBe(10);
      });

      it('should extract file location from stack trace', () => {
        const result = errorAnalyzer.analyze(
          'Some error',
          'at App (src/App.tsx:15:5)'
        );

        expect(result.file).toBe('src/App.tsx');
        expect(result.line).toBe(15);
        expect(result.column).toBe(5);
      });

      it('should normalize file paths', () => {
        const result = errorAnalyzer.analyze(
          'Error at components/Header.tsx:10:1'
        );

        expect(result.file).toBe('src/components/Header.tsx');
      });
    });

    describe('related files', () => {
      it('should find related files by import path', () => {
        const files = {
          'src/App.tsx': 'import { helper } from "./utils/helper";',
          'src/components/Button.tsx': 'import { helper } from "./utils/helper";',
          'src/utils/helper.ts': 'export const helper = () => {};',
        };

        const result = errorAnalyzer.analyze(
          'Cannot find module "./utils/helper"',
          undefined,
          files
        );

        expect(result.relatedFiles).toContain('src/App.tsx');
        expect(result.relatedFiles).toContain('src/components/Button.tsx');
      });

      it('should find related files by identifier', () => {
        const files = {
          'src/App.tsx': 'const x = myFunction();',
          'src/utils/helpers.ts': 'export function myFunction() {}',
        };

        const result = errorAnalyzer.analyze(
          'myFunction is not defined',
          undefined,
          files
        );

        expect(result.relatedFiles).toContain('src/utils/helpers.ts');
      });
    });
  });

  describe('classify', () => {
    it('should classify syntax errors', () => {
      expect(errorAnalyzer.classify('SyntaxError: Unexpected token')).toBe('syntax');
      expect(errorAnalyzer.classify('Unexpected token }')).toBe('syntax');
      expect(errorAnalyzer.classify('Unterminated string literal')).toBe('syntax');
    });

    it('should classify import errors', () => {
      expect(errorAnalyzer.classify('useState is not defined')).toBe('import');
      expect(errorAnalyzer.classify('Cannot find module')).toBe('import');
      expect(errorAnalyzer.classify('bare specifier')).toBe('import');
      expect(errorAnalyzer.classify('failed to resolve')).toBe('import');
    });

    it('should classify react errors', () => {
      expect(errorAnalyzer.classify('Invalid hook call')).toBe('react');
      expect(errorAnalyzer.classify('React component error')).toBe('react');
      expect(errorAnalyzer.classify('Cannot render undefined')).toBe('react');
    });

    it('should classify type errors', () => {
      expect(errorAnalyzer.classify('Type error')).toBe('type');
      expect(errorAnalyzer.classify('is not assignable to type')).toBe('type');
      expect(errorAnalyzer.classify('Property foo does not exist on type')).toBe('type');
    });

    it('should classify jsx errors', () => {
      expect(errorAnalyzer.classify('JSX element error')).toBe('jsx');
      expect(errorAnalyzer.classify('no closing tag')).toBe('jsx');
      expect(errorAnalyzer.classify('Adjacent JSX elements')).toBe('jsx');
    });

    it('should classify async errors', () => {
      expect(errorAnalyzer.classify('async function error')).toBe('async');
      expect(errorAnalyzer.classify('await is only valid')).toBe('async');
      expect(errorAnalyzer.classify('Promise rejected')).toBe('async');
    });

    it('should classify runtime errors', () => {
      expect(errorAnalyzer.classify('Cannot read property of undefined')).toBe('runtime');
      expect(errorAnalyzer.classify('null is not a function')).toBe('runtime');
    });

    it('should classify transient/ignorable errors', () => {
      expect(errorAnalyzer.classify('Loading chunk 5 failed')).toBe('transient');
      expect(errorAnalyzer.classify('ResizeObserver loop')).toBe('transient');
      expect(errorAnalyzer.classify('Script error.')).toBe('transient');
    });

    it('should return unknown for unrecognized errors', () => {
      expect(errorAnalyzer.classify('Some random error message')).toBe('unknown');
    });
  });

  describe('isIgnorable', () => {
    it('should return true for chunk loading errors', () => {
      expect(errorAnalyzer.isIgnorable('Loading chunk 5 failed')).toBe(true);
    });

    it('should return true for dynamic import errors', () => {
      expect(errorAnalyzer.isIgnorable('Failed to fetch dynamically imported module')).toBe(true);
    });

    it('should return true for ResizeObserver errors', () => {
      expect(errorAnalyzer.isIgnorable('ResizeObserver loop limit exceeded')).toBe(true);
    });

    it('should return true for script errors', () => {
      expect(errorAnalyzer.isIgnorable('Script error.')).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(errorAnalyzer.isIgnorable('Network Error')).toBe(true);
      expect(errorAnalyzer.isIgnorable('Request timeout')).toBe(true);
    });

    it('should return true for abort errors', () => {
      expect(errorAnalyzer.isIgnorable('AbortError: The operation was aborted')).toBe(true);
      expect(errorAnalyzer.isIgnorable('Request cancelled')).toBe(true);
    });

    it('should return true for connection errors', () => {
      expect(errorAnalyzer.isIgnorable('ERR_CONNECTION_REFUSED')).toBe(true);
    });

    it('should return false for actionable errors', () => {
      expect(errorAnalyzer.isIgnorable('useState is not defined')).toBe(false);
      expect(errorAnalyzer.isIgnorable('SyntaxError: Unexpected token')).toBe(false);
      expect(errorAnalyzer.isIgnorable('Type error')).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should summarize bare specifier error', () => {
      const error = errorAnalyzer.analyze('"src/utils" was a bare specifier');
      const summary = errorAnalyzer.getSummary(error);

      expect(summary).toContain('src/utils');
      expect(summary).toContain('relative path');
    });

    it('should summarize undefined variable error', () => {
      const error = errorAnalyzer.analyze('useState is not defined');
      const summary = errorAnalyzer.getSummary(error);

      expect(summary).toContain('useState');
      expect(summary).toContain('not defined');
    });

    it('should summarize type error', () => {
      const error = errorAnalyzer.analyze(
        'Type "string" is not assignable to type "number"'
      );
      const summary = errorAnalyzer.getSummary(error);

      expect(summary).toContain('Type mismatch');
      expect(summary).toContain('number');
    });

    it('should include file location in summary', () => {
      const error = errorAnalyzer.analyze(
        'useState is not defined at src/App.tsx:10:5'
      );
      const summary = errorAnalyzer.getSummary(error);

      expect(summary).toContain('src/App.tsx');
      expect(summary).toContain('line 10');
    });

    it('should handle unknown error type', () => {
      const error = errorAnalyzer.analyze('Some unknown error message');
      const summary = errorAnalyzer.getSummary(error);

      expect(summary).toContain('Some unknown error');
    });
  });

  describe('getPriority', () => {
    it('should return priority from parsed error', () => {
      const syntaxError = errorAnalyzer.analyze('SyntaxError: Unexpected token');
      expect(errorAnalyzer.getPriority(syntaxError)).toBe(5);

      const runtimeError = errorAnalyzer.analyze('Cannot read property of undefined');
      expect(errorAnalyzer.getPriority(runtimeError)).toBe(3);

      const networkError = errorAnalyzer.analyze('Failed to fetch');
      expect(errorAnalyzer.getPriority(networkError)).toBe(1);
    });
  });
});
