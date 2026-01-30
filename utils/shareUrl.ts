/**
 * Share URL Utilities
 *
 * Handles loading projects from shared URLs.
 * Extracted from ShareModal to avoid pulling the entire modal component
 * when only the URL loading utility is needed.
 */

import type { FileSystem } from '../types';

function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

function decompressString(compressed: string): string {
  try {
    // Restore base64 and decode
    let base64 = compressed.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return base64ToUtf8(base64);
  } catch {
    return '';
  }
}

/**
 * Load a project from URL query parameters (shared project link).
 * Returns the file system if a valid project is found, null otherwise.
 */
export function loadProjectFromUrl(): FileSystem | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const projectData = params.get('project');

    if (projectData) {
      const decompressed = decompressString(projectData);
      if (decompressed) {
        const files = JSON.parse(decompressed);
        // Clean up URL after loading
        window.history.replaceState({}, '', window.location.pathname);
        return files;
      }
    }
  } catch (err) {
    console.error('Failed to load project from URL:', err);
  }
  return null;
}
