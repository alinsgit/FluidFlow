/**
 * Sandbox Scripts Module Index
 *
 * Barrel export for all sandbox script generators.
 */

// Inspect Mode
export { getInspectModeScript } from './inspectMode';

// Router Emulation
export {
  getHistoryEmulationScript,
  getLinkInterceptionScript,
  getLocationOverrideScript,
} from './routerEmulation';

// Sandbox Hooks
export { getSandboxHooksScript } from './sandboxHooks';

// Lucide Icons
export { getKnownLucideIconsScript } from './lucideIcons';

// Bootstrap
export { getBootstrapScript } from './bootstrap';

// Component Tree (React Fiber traversal)
export { getComponentTreeScript } from './componentTree';
export type { ComponentTreeNode } from './componentTree';

// Computed Styles (CSS extraction)
export { getComputedStylesScript, CSS_CATEGORIES } from './computedStyles';
export type { ComputedStylesResult } from './computedStyles';

// Route Context (Enhanced nested routing)
export { getRouteContextScript } from './routeContext';
export type { RouteConfig, RouteMatch } from './routeContext';
