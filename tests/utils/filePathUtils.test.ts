/**
 * Tests for File Path Utilities
 * Tests path validation, normalization, and manipulation functions
 */

import { describe, it, expect } from 'vitest';
import {
  isIgnoredPath,
  normalizePath,
  getFileExtension,
  getFileName,
  getDirectoryPath,
  isFilePath,
  isMalformedPath,
  IGNORED_PATHS,
} from '../../utils/filePathUtils';

describe('filePathUtils', () => {
  describe('IGNORED_PATHS', () => {
    it('should include common ignored directories', () => {
      expect(IGNORED_PATHS).toContain('.git');
      expect(IGNORED_PATHS).toContain('node_modules');
      expect(IGNORED_PATHS).toContain('dist');
      expect(IGNORED_PATHS).toContain('build');
      expect(IGNORED_PATHS).toContain('.next');
    });
  });

  describe('isIgnoredPath', () => {
    it('should return true for exact matches', () => {
      expect(isIgnoredPath('.git')).toBe(true);
      expect(isIgnoredPath('node_modules')).toBe(true);
      expect(isIgnoredPath('dist')).toBe(true);
    });

    it('should return true for paths starting with ignored dir', () => {
      expect(isIgnoredPath('node_modules/react/index.js')).toBe(true);
      expect(isIgnoredPath('.git/config')).toBe(true);
      expect(isIgnoredPath('dist/bundle.js')).toBe(true);
    });

    it('should return true for paths containing ignored dir', () => {
      expect(isIgnoredPath('project/.git/hooks')).toBe(true);
      expect(isIgnoredPath('src/.cache/data.json')).toBe(true);
    });

    it('should return true for paths ending with ignored dir', () => {
      expect(isIgnoredPath('project/.git')).toBe(true);
      expect(isIgnoredPath('app/node_modules')).toBe(true);
    });

    it('should return false for valid source paths', () => {
      expect(isIgnoredPath('src/App.tsx')).toBe(false);
      expect(isIgnoredPath('components/Header.tsx')).toBe(false);
      expect(isIgnoredPath('utils/helper.ts')).toBe(false);
    });

    it('should handle backslash paths (Windows)', () => {
      expect(isIgnoredPath('node_modules\\react\\index.js')).toBe(true);
      expect(isIgnoredPath('.git\\config')).toBe(true);
      expect(isIgnoredPath('src\\App.tsx')).toBe(false);
    });

    it('should not match partial directory names', () => {
      // 'git-hooks' should not be ignored (not '.git')
      expect(isIgnoredPath('git-hooks/pre-commit')).toBe(false);
      // 'distribution' should not be ignored (not 'dist')
      expect(isIgnoredPath('distribution/app.js')).toBe(false);
    });
  });

  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(normalizePath('src\\components\\Header.tsx')).toBe('src/components/Header.tsx');
      expect(normalizePath('C:\\Users\\project\\file.ts')).toBe('C:/Users/project/file.ts');
    });

    it('should remove duplicate slashes', () => {
      expect(normalizePath('src//components///Header.tsx')).toBe('src/components/Header.tsx');
      expect(normalizePath('a////b//c')).toBe('a/b/c');
    });

    it('should remove trailing slash', () => {
      expect(normalizePath('src/components/')).toBe('src/components');
      expect(normalizePath('folder/')).toBe('folder');
    });

    it('should handle already normalized paths', () => {
      expect(normalizePath('src/App.tsx')).toBe('src/App.tsx');
      expect(normalizePath('file.ts')).toBe('file.ts');
    });

    it('should handle empty string', () => {
      expect(normalizePath('')).toBe('');
    });
  });

  describe('getFileExtension', () => {
    it('should return extension for common file types', () => {
      expect(getFileExtension('App.tsx')).toBe('tsx');
      expect(getFileExtension('index.ts')).toBe('ts');
      expect(getFileExtension('styles.css')).toBe('css');
      expect(getFileExtension('data.json')).toBe('json');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('File.TSX')).toBe('tsx');
      expect(getFileExtension('File.CSS')).toBe('css');
    });

    it('should handle paths with directories', () => {
      expect(getFileExtension('src/components/Header.tsx')).toBe('tsx');
      expect(getFileExtension('utils/helper.ts')).toBe('ts');
    });

    it('should return empty string for no extension', () => {
      expect(getFileExtension('Makefile')).toBe('');
      expect(getFileExtension('README')).toBe('');
    });

    it('should handle directories with dots', () => {
      expect(getFileExtension('src/v1.2.3/file')).toBe('');
      expect(getFileExtension('build.output/app')).toBe('');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('file.test.ts')).toBe('ts');
      expect(getFileExtension('app.config.json')).toBe('json');
    });

    it('should handle backslash paths', () => {
      expect(getFileExtension('src\\App.tsx')).toBe('tsx');
    });
  });

  describe('getFileName', () => {
    it('should return filename from path', () => {
      expect(getFileName('src/components/Header.tsx')).toBe('Header.tsx');
      expect(getFileName('utils/helper.ts')).toBe('helper.ts');
    });

    it('should handle no directory', () => {
      expect(getFileName('App.tsx')).toBe('App.tsx');
      expect(getFileName('file')).toBe('file');
    });

    it('should handle backslash paths', () => {
      expect(getFileName('src\\App.tsx')).toBe('App.tsx');
    });

    it('should handle trailing slash', () => {
      // After normalization, trailing slash is removed
      expect(getFileName('folder/')).toBe('folder');
    });
  });

  describe('getDirectoryPath', () => {
    it('should return directory from path', () => {
      expect(getDirectoryPath('src/components/Header.tsx')).toBe('src/components');
      expect(getDirectoryPath('utils/helper.ts')).toBe('utils');
    });

    it('should return empty string for no directory', () => {
      expect(getDirectoryPath('App.tsx')).toBe('');
      expect(getDirectoryPath('file')).toBe('');
    });

    it('should handle backslash paths', () => {
      expect(getDirectoryPath('src\\components\\App.tsx')).toBe('src/components');
    });

    it('should handle deep nesting', () => {
      expect(getDirectoryPath('a/b/c/d/e/file.ts')).toBe('a/b/c/d/e');
    });
  });

  describe('isFilePath', () => {
    it('should return true for paths with extensions', () => {
      expect(isFilePath('App.tsx')).toBe(true);
      expect(isFilePath('styles.css')).toBe(true);
      expect(isFilePath('data.json')).toBe(true);
    });

    it('should return false for paths without extensions', () => {
      expect(isFilePath('Makefile')).toBe(false);
      expect(isFilePath('README')).toBe(false);
      expect(isFilePath('src/components')).toBe(false);
    });

    it('should handle paths with directories', () => {
      expect(isFilePath('src/App.tsx')).toBe(true);
      expect(isFilePath('src/components')).toBe(false);
    });
  });

  describe('isMalformedPath', () => {
    it('should return true for empty paths', () => {
      expect(isMalformedPath('')).toBe(true);
    });

    it('should return true for paths ending with slash', () => {
      expect(isMalformedPath('src/')).toBe(true);
      expect(isMalformedPath('components/')).toBe(true);
    });

    it('should return true for hidden files without proper name', () => {
      // .tsx has an extension so it's not considered malformed by extension check
      // but it's a dotfile that starts with . and has no real name before extension
      expect(isMalformedPath('src/.')).toBe(true);
    });

    it('should return false for valid dotfiles', () => {
      expect(isMalformedPath('.gitignore')).toBe(false);
      expect(isMalformedPath('.env')).toBe(false);
      expect(isMalformedPath('src/.env')).toBe(false);
    });

    it('should return true for paths without extension', () => {
      expect(isMalformedPath('src/Makefile')).toBe(true);
      expect(isMalformedPath('README')).toBe(true);
    });

    it('should return false for valid file paths', () => {
      expect(isMalformedPath('src/App.tsx')).toBe(false);
      expect(isMalformedPath('styles.css')).toBe(false);
      expect(isMalformedPath('components/Header.tsx')).toBe(false);
    });

    it('should handle backslash paths', () => {
      expect(isMalformedPath('src\\App.tsx')).toBe(false);
      expect(isMalformedPath('src\\')).toBe(true);
    });
  });
});
