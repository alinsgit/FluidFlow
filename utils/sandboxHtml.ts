/**
 * Sandbox HTML Generator
 *
 * Generates the complete HTML document for the iframe preview sandbox.
 * Includes React, Babel transpilation, router emulation, and console forwarding.
 *
 * Module structure:
 * - scripts/inspectMode.ts: Element selection and highlighting
 * - scripts/routerEmulation.ts: History, link, and location handling
 * - scripts/sandboxHooks.ts: React Router-like hooks
 * - scripts/bootstrap.ts: Main app compilation and mounting
 * - scripts/lucideIcons.ts: Icon validation
 */

import type { FileSystem } from '@/types';
import { analyzeFilesForImports } from './importResolver';

// Import script generators from submodules
import {
  getInspectModeScript,
  getHistoryEmulationScript,
  getLinkInterceptionScript,
  getLocationOverrideScript,
  getSandboxHooksScript,
  getBootstrapScript,
  getComponentTreeScript,
  getComputedStylesScript,
  getRouteContextScript,
} from './sandboxHtml/scripts';

// Re-export script generators for potential external use
export {
  getInspectModeScript,
  getHistoryEmulationScript,
  getLinkInterceptionScript,
  getLocationOverrideScript,
  getSandboxHooksScript,
  getBootstrapScript,
  getComponentTreeScript,
  getComputedStylesScript,
  getRouteContextScript,
} from './sandboxHtml/scripts';

// Re-export types
export type { ComponentTreeNode, ComputedStylesResult } from './sandboxHtml/scripts';

/**
 * Build the complete HTML document for the iframe sandbox preview.
 * This includes:
 * - React and React DOM via ESM
 * - Babel transpilation
 * - Custom router emulation for React Router compatibility
 * - Console/error forwarding to parent window
 * - Inspect mode support
 */
export function buildIframeHtml(files: FileSystem, isInspectMode: boolean = false): string {
  // Analyze files for additional imports (proactive resolution)
  const dynamicImports = analyzeFilesForImports(files);

  // Build HTML with dynamic imports injected
  const html = buildIframeHtmlTemplate(files, isInspectMode);
  return html.replace('__DYNAMIC_IMPORTS_PLACEHOLDER__', JSON.stringify(dynamicImports));
}

/**
 * Build the HTML template with all script sections
 */
function buildIframeHtmlTemplate(files: FileSystem, isInspectMode: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="about:blank">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1a1a1a; min-height: 100vh; margin: 0; }
    #root { min-height: 100vh; }
    .sandbox-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .sandbox-loading .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
    .sandbox-error { padding: 20px; background: #fee2e2; color: #dc2626; border-radius: 8px; margin: 20px; font-family: monospace; font-size: 14px; white-space: pre-wrap; }
    @keyframes spin { to { transform: rotate(360deg); } }
    ${isInspectMode ? `
    .inspect-highlight { outline: 2px solid #3b82f6 !important; outline-offset: 2px; background-color: rgba(59, 130, 246, 0.1) !important; cursor: crosshair !important; }
    .inspect-selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px; background-color: rgba(139, 92, 246, 0.1) !important; }
    * { cursor: crosshair !important; }
    ` : ''}
    .tree-highlight { outline: 2px dashed #10b981 !important; outline-offset: 2px; background-color: rgba(16, 185, 129, 0.1) !important; }
  </style>
</head>
<body>
  <div id="root">
    <div class="sandbox-loading">
      <div class="spinner"></div>
      <p style="margin-top: 16px; font-size: 14px;">Loading app...</p>
    </div>
  </div>
  <script>
    // Sandbox environment setup
    window.process = { env: { NODE_ENV: 'development' } };
    window.__SANDBOX_READY__ = false;

    // XSS-safe error display helper - escapes HTML entities
    const escapeHtmlForError = (text) => {
      const div = document.createElement('div');
      div.textContent = String(text || 'Unknown error');
      return div.innerHTML;
    };

    // Safe error display - prevents XSS via error messages
    const showSafeError = (prefix, err) => {
      const root = document.getElementById('root');
      if (root) {
        root.textContent = ''; // Clear safely
        const errorDiv = document.createElement('div');
        errorDiv.className = 'sandbox-error';
        errorDiv.textContent = prefix + ': ' + (err && err.message ? err.message : String(err || 'Unknown error'));
        root.appendChild(errorDiv);
      }
    };

    // Console forwarding with error filtering
    const notify = (type, msg) => window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg), timestamp: Date.now() }, '*');

    // Filter transient/harmless errors that shouldn't trigger auto-fix
    // IMPORTANT: Do NOT ignore fixable errors like "is not defined", "is not a function"
    const isIgnorableError = (msg) => {
      if (!msg) return true;
      const str = String(msg).toLowerCase();

      // These are truly transient/unfixable errors
      const ignorePatterns = [
        'resizeobserver',
        'script error',
        'loading chunk',
        'dynamically imported module',
        'failed to fetch',
        'network error',
        'hydrat',
        'unmounted component',
        'memory leak',
        'perform a react state update',
        'maximum update depth exceeded',
        'each child in a list should have a unique',
        'validatedomnesting',
        'received true for a non-boolean',
        'received false for a non-boolean',
        'unknown prop',
        'invalid prop',
        'failed prop type',
        'minified react error',
        'suspended while rendering',
        '__esmodule',
        'cannot redefine property'
      ];

      // These errors ARE fixable - do NOT ignore them
      // - "X is not defined" → missing import/declaration
      // - "X is not a function" → wrong import or missing export
      // - "cannot read properties of null/undefined" → null check needed
      // - "nothing was returned from render" → missing return statement

      return ignorePatterns.some(p => str.includes(p));
    };

    console.log = (...args) => { notify('log', args.join(' ')); };
    console.warn = (...args) => { notify('warn', args.join(' ')); };
    console.error = (...args) => {
      const msg = args.join(' ');
      // Still log to console but mark as ignorable for auto-fix
      notify('error', isIgnorableError(msg) ? '[TRANSIENT] ' + msg : msg);
    };
    window.onerror = function(msg) {
      notify('error', isIgnorableError(msg) ? '[TRANSIENT] ' + msg : msg);
      return false;
    };

    // Handle unhandled promise rejections (async errors)
    window.onunhandledrejection = function(event) {
      const msg = event.reason?.message || String(event.reason) || 'Unhandled Promise rejection';
      notify('error', isIgnorableError(msg) ? '[TRANSIENT] ' + msg : msg);
    };

    // Patch URL constructor FIRST - before any library loads
    (function() {
      var OriginalURL = window.URL;
      window.URL = function URL(url, base) {
        // Handle various edge cases
        if (url === undefined || url === null || url === '') {
          url = '/';
        }
        url = String(url);
        // If url is relative, provide default base
        if ((url.startsWith('/') || !url.includes('://')) && !base) {
          base = 'http://localhost';
        }
        try {
          return new OriginalURL(url, base);
        } catch (e) {
          // Last resort fallback
          return new OriginalURL('http://localhost' + (url.startsWith('/') ? url : '/' + url));
        }
      };
      window.URL.prototype = OriginalURL.prototype;
      window.URL.createObjectURL = OriginalURL.createObjectURL;
      window.URL.revokeObjectURL = OriginalURL.revokeObjectURL;
      window.URL.canParse = OriginalURL.canParse;
    })();

    // Inspect Mode
    window.__INSPECT_MODE__ = ${isInspectMode};
    ${isInspectMode ? getInspectModeScript() : ''}

    // Enhanced in-memory router state with full URL support
    window.__SANDBOX_ROUTER__ = {
      currentPath: '/',
      currentState: null,
      search: '',
      hash: '',
      listeners: [],

      navigate: function(path, state, skipNotify) {
        if (state === undefined) state = null;
        // Ensure path is a string
        path = String(path || '/');
        if (!path.startsWith('/')) path = '/' + path;

        // Parse URL manually (URL constructor is unreliable in sandbox)
        var pathname = path;
        var search = '';
        var hash = '';

        // Extract hash
        var hashIndex = path.indexOf('#');
        if (hashIndex >= 0) {
          hash = path.substring(hashIndex);
          pathname = path.substring(0, hashIndex);
        }

        // Extract search/query
        var searchIndex = pathname.indexOf('?');
        if (searchIndex >= 0) {
          search = pathname.substring(searchIndex);
          pathname = pathname.substring(0, searchIndex);
        }

        this.currentPath = pathname || '/';
        this.search = search;
        this.hash = hash;
        this.currentState = state;

        const location = this.getLocation();
        this.listeners.forEach(fn => fn(location));
        console.log('[Router] Navigated to: ' + this.currentPath + this.search + this.hash);

        // Notify parent of URL change (unless skipped for internal operations)
        if (!skipNotify) {
          this.notifyParent();
        }
      },

      notifyParent: function() {
        var historyInfo = window.__HISTORY_INFO__ || { index: 0, length: 1 };
        window.parent.postMessage({
          type: 'URL_CHANGE',
          url: this.currentPath + this.search + this.hash,
          canGoBack: historyInfo.index > 0,
          canGoForward: historyInfo.index < historyInfo.length - 1
        }, '*');
      },

      getLocation: function() {
        return {
          pathname: this.currentPath,
          search: this.search,
          hash: this.hash,
          state: this.currentState,
          key: Math.random().toString(36).substring(2, 8)
        };
      },

      subscribe: function(fn) {
        this.listeners.push(fn);
        return function() {
          window.__SANDBOX_ROUTER__.listeners = window.__SANDBOX_ROUTER__.listeners.filter(function(l) { return l !== fn; });
        };
      },

      getPath: function() { return this.currentPath; }
    };

    ${getHistoryEmulationScript()}
    ${getLinkInterceptionScript()}
    ${getLocationOverrideScript()}
    ${getSandboxHooksScript()}

    // Component Tree and Computed Styles (DevTools support)
    ${getComponentTreeScript()}
    ${getComputedStylesScript()}

    // Route Context (Enhanced nested routing support)
    ${getRouteContextScript()}

    // Heartbeat handler for connection monitoring
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'HEARTBEAT') {
        window.parent.postMessage({ type: 'HEARTBEAT_RESPONSE', timestamp: Date.now() }, '*');
      }
    });
  </script>
  <script type="text/babel" data-presets="react,typescript">
    ${getBootstrapScript(files)}
  </script>
</body>
</html>`;
}
