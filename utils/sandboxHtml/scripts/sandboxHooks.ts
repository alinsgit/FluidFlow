/**
 * Sandbox Hooks Script
 *
 * Generates the sandbox hooks script for React Router-like experience.
 * Provides useLocation, useNavigate, useParams, useSearchParams, Link, and NavLink.
 */

/**
 * Generate the sandbox hooks script for React Router compatibility
 */
export function getSandboxHooksScript(): string {
  return `
    // Provide useLocation and useNavigate hooks for React Router-like experience
    window.__SANDBOX_HOOKS__ = {
      useLocation: function() {
        const React = window.React;
        if (!React) return window.__SANDBOX_ROUTER__.getLocation();
        const [location, setLocation] = React.useState(window.__SANDBOX_ROUTER__.getLocation());
        React.useEffect(function() {
          return window.__SANDBOX_ROUTER__.subscribe(function(loc) {
            setLocation(loc);
          });
        }, []);
        return location;
      },
      useNavigate: function() {
        return function(to, options) {
          var hist = window.__SANDBOX_HISTORY__;
          if (options && options.replace) {
            hist.replaceState(options.state || null, '', to);
          } else {
            hist.pushState(options && options.state || null, '', to);
          }
        };
      },
      useParams: function() {
        // Basic params extraction - apps should use React Router for full functionality
        return {};
      },
      useSearchParams: function() {
        const React = window.React;
        const location = window.__SANDBOX_HOOKS__.useLocation();
        const searchParams = new URLSearchParams(location.search);
        const setSearchParams = function(params) {
          const newSearch = '?' + new URLSearchParams(params).toString();
          window.__SANDBOX_HISTORY__.pushState(null, '', location.pathname + newSearch + location.hash);
        };
        return [searchParams, setSearchParams];
      },
      Link: function(props) {
        const React = window.React;
        return React.createElement('a', {
          ...props,
          href: props.to || props.href,
          onClick: function(e) {
            e.preventDefault();
            var hist = window.__SANDBOX_HISTORY__;
            if (props.replace) {
              hist.replaceState(props.state || null, '', props.to || props.href);
            } else {
              hist.pushState(props.state || null, '', props.to || props.href);
            }
            if (props.onClick) props.onClick(e);
          }
        }, props.children);
      },
      NavLink: function(props) {
        const React = window.React;
        const location = window.__SANDBOX_HOOKS__.useLocation();
        const isActive = location.pathname === props.to;
        const className = typeof props.className === 'function'
          ? props.className({ isActive: isActive })
          : (isActive && props.activeClassName) || props.className;
        return React.createElement('a', {
          ...props,
          className: className,
          href: props.to || props.href,
          'aria-current': isActive ? 'page' : undefined,
          onClick: function(e) {
            e.preventDefault();
            window.__SANDBOX_HISTORY__.pushState(props.state || null, '', props.to || props.href);
            if (props.onClick) props.onClick(e);
          }
        }, props.children);
      }
    };
  `;
}
