/**
 * Router Emulation Scripts
 *
 * Generates scripts for React Router compatibility in the sandbox:
 * - History API emulation
 * - Link click interception
 * - Location object override
 */

/**
 * Generate the history API emulation script
 */
export function getHistoryEmulationScript(): string {
  return `
    // History API emulation for React Router compatibility
    (function() {
      var historyStack = [{ state: null, title: '', url: '/' }];
      var historyIndex = 0;

      // Update global history info for URL bar
      function updateHistoryInfo() {
        window.__HISTORY_INFO__ = {
          index: historyIndex,
          length: historyStack.length
        };
      }
      updateHistoryInfo();

      // Store our custom history implementation
      var customHistory = {
        get length() { return historyStack.length; },
        get state() { return historyStack[historyIndex] ? historyStack[historyIndex].state : null; },
        get scrollRestoration() { return 'auto'; },
        set scrollRestoration(val) { /* noop */ },

        pushState: function(state, title, url) {
          historyStack = historyStack.slice(0, historyIndex + 1);
          historyStack.push({ state: state, title: title, url: url || '/' });
          historyIndex = historyStack.length - 1;
          updateHistoryInfo();
          window.__SANDBOX_ROUTER__.navigate(url || '/', state);
          // Dispatch popstate to trigger React Router re-render
          window.dispatchEvent(new PopStateEvent('popstate', { state: state }));
        },

        replaceState: function(state, title, url) {
          historyStack[historyIndex] = { state: state, title: title, url: url || '/' };
          updateHistoryInfo();
          window.__SANDBOX_ROUTER__.navigate(url || '/', state);
          // Dispatch popstate to trigger React Router re-render
          window.dispatchEvent(new PopStateEvent('popstate', { state: state }));
        },

        back: function() {
          if (historyIndex > 0) {
            historyIndex--;
            updateHistoryInfo();
            var entry = historyStack[historyIndex];
            window.__SANDBOX_ROUTER__.navigate(entry.url, entry.state);
            window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
          }
        },

        forward: function() {
          if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            updateHistoryInfo();
            var entry = historyStack[historyIndex];
            window.__SANDBOX_ROUTER__.navigate(entry.url, entry.state);
            window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
          }
        },

        go: function(delta) {
          var newIndex = historyIndex + delta;
          if (newIndex >= 0 && newIndex < historyStack.length) {
            historyIndex = newIndex;
            updateHistoryInfo();
            var entry = historyStack[historyIndex];
            window.__SANDBOX_ROUTER__.navigate(entry.url, entry.state);
            window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
          }
        }
      };

      // Make it globally accessible
      window.__SANDBOX_HISTORY__ = customHistory;

      // Try to override native history methods (safer approach)
      try {
        var nativeHistory = window.history;
        Object.defineProperty(window, 'history', {
          get: function() { return customHistory; },
          configurable: true
        });
        console.log('[Sandbox] History API fully overridden');
      } catch (e) {
        // If we can't override window.history, at least override its methods
        try {
          window.history.pushState = customHistory.pushState;
          window.history.replaceState = customHistory.replaceState;
          window.history.back = customHistory.back;
          window.history.forward = customHistory.forward;
          window.history.go = customHistory.go;
          console.log('[Sandbox] History methods overridden');
        } catch (e2) {
          console.warn('[Sandbox] Could not override history API, using fallback');
        }
      }

      // Listen for navigation commands from parent window
      window.addEventListener('message', function(event) {
        if (!event.data || !event.data.type) return;

        if (event.data.type === 'NAVIGATE') {
          customHistory.pushState(null, '', event.data.url);
        } else if (event.data.type === 'GO_BACK') {
          customHistory.back();
        } else if (event.data.type === 'GO_FORWARD') {
          customHistory.forward();
        }
      });

      console.log('[Sandbox] History API emulation initialized');
    })();
  `;
}

/**
 * Generate the link interception script
 */
export function getLinkInterceptionScript(): string {
  return `
    // Intercept all link clicks to prevent navigation outside sandbox
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          e.preventDefault();
          e.stopPropagation();

          // Handle different link types
          if (href.startsWith('http://') || href.startsWith('https://')) {
            // External links - open in new tab
            window.open(href, '_blank', 'noopener,noreferrer');
            console.log('[Sandbox] External link opened in new tab: ' + href);
          } else if (href.startsWith('mailto:') || href.startsWith('tel:')) {
            // Allow mailto/tel links
            window.open(href, '_self');
          } else if (href.startsWith('#')) {
            // Hash navigation - scroll to element and update hash
            const id = href.substring(1);
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            // Use our custom history for proper history tracking
            window.__SANDBOX_HISTORY__.pushState(null, '', href);
          } else {
            // Internal navigation - use our custom history
            window.__SANDBOX_HISTORY__.pushState(null, '', href);
          }
        }
      }
    }, true);

    // Intercept form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.tagName === 'FORM') {
        e.preventDefault();
        const action = form.getAttribute('action') || '/';
        const method = form.getAttribute('method') || 'GET';
        console.log('[Sandbox] Form submitted: ' + method + ' ' + action);
        // Use our custom history
        window.__SANDBOX_HISTORY__.pushState(null, '', action);
      }
    }, true);
  `;
}

/**
 * Generate the location override script
 */
export function getLocationOverrideScript(): string {
  return `
    // Override window.location for React Router to read correct pathname
    // Note: SecurityError occurs when navigating, not reading - so we use our custom history for writes
    (function() {
      var fakeLocation = {
        get href() { return 'http://localhost' + window.__SANDBOX_ROUTER__.currentPath + window.__SANDBOX_ROUTER__.search + window.__SANDBOX_ROUTER__.hash; },
        get pathname() { return window.__SANDBOX_ROUTER__.currentPath; },
        get search() { return window.__SANDBOX_ROUTER__.search; },
        get hash() { return window.__SANDBOX_ROUTER__.hash; },
        get origin() { return 'http://localhost'; },
        get host() { return 'localhost'; },
        get hostname() { return 'localhost'; },
        get port() { return ''; },
        get protocol() { return 'http:'; },
        assign: function(url) { window.__SANDBOX_HISTORY__.pushState(null, '', url); },
        replace: function(url) { window.__SANDBOX_HISTORY__.replaceState(null, '', url); },
        reload: function() { console.log('[Sandbox] Reload blocked'); },
        toString: function() { return this.href; }
      };

      try {
        Object.defineProperty(window, 'location', {
          get: function() { return fakeLocation; },
          set: function(url) { window.__SANDBOX_HISTORY__.pushState(null, '', url); },
          configurable: true
        });
        console.log('[Sandbox] Location override successful');
      } catch (e) {
        console.warn('[Sandbox] Could not override location:', e.message);
      }
    })();
  `;
}
