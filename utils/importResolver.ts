/**
 * Import Resolver - Self-healing sandbox import system
 *
 * Automatically detects and resolves missing imports in the sandbox.
 * Uses esm.sh as the CDN for npm packages.
 */

export interface PackageConfig {
  package: string;
  version?: string;
  subpath?: string;
  external?: string[];
}

// Registry of known packages and their configurations
export const PACKAGE_REGISTRY: Record<string, PackageConfig> = {
  // React ecosystem
  'react': { package: 'react', version: '19.0.0' },
  'react/jsx-runtime': { package: 'react', version: '19.0.0', subpath: '/jsx-runtime' },
  'react/jsx-dev-runtime': { package: 'react', version: '19.0.0', subpath: '/jsx-dev-runtime' },
  'react-dom': { package: 'react-dom', version: '19.0.0' },
  'react-dom/client': { package: 'react-dom', version: '19.0.0', subpath: '/client' },

  // Animation
  'framer-motion': { package: 'framer-motion', version: '11.11.17', external: ['react', 'react-dom'] },
  'motion': { package: 'motion', version: '12.0.0', external: ['react', 'react-dom'] },
  'motion/react': { package: 'motion', version: '12.0.0', subpath: '/react', external: ['react', 'react-dom'] },

  // Routing
  'react-router': { package: 'react-router', version: '6.28.0', external: ['react'] },
  'react-router-dom': { package: 'react-router-dom', version: '6.28.0', external: ['react', 'react-dom'] },

  // State management
  'zustand': { package: 'zustand', version: '5.0.1', external: ['react'] },
  'jotai': { package: 'jotai', version: '2.10.3', external: ['react'] },
  '@tanstack/react-query': { package: '@tanstack/react-query', version: '5.62.0', external: ['react'] },

  // Forms
  'react-hook-form': { package: 'react-hook-form', version: '7.53.2', external: ['react'] },
  'zod': { package: 'zod', version: '3.23.8' },
  'yup': { package: 'yup', version: '1.4.0' },

  // UI Libraries
  'lucide-react': { package: 'lucide-react', version: '0.469.0', external: ['react'] },
  '@heroicons/react/24/solid': { package: '@heroicons/react', version: '2.2.0', subpath: '/24/solid', external: ['react'] },
  '@heroicons/react/24/outline': { package: '@heroicons/react', version: '2.2.0', subpath: '/24/outline', external: ['react'] },
  'react-icons': { package: 'react-icons', version: '5.4.0', external: ['react'] },

  // Radix UI
  '@radix-ui/react-dialog': { package: '@radix-ui/react-dialog', version: '1.1.2', external: ['react', 'react-dom'] },
  '@radix-ui/react-dropdown-menu': { package: '@radix-ui/react-dropdown-menu', version: '2.1.2', external: ['react', 'react-dom'] },
  '@radix-ui/react-popover': { package: '@radix-ui/react-popover', version: '1.1.2', external: ['react', 'react-dom'] },
  '@radix-ui/react-tooltip': { package: '@radix-ui/react-tooltip', version: '1.1.3', external: ['react', 'react-dom'] },
  '@radix-ui/react-tabs': { package: '@radix-ui/react-tabs', version: '1.1.1', external: ['react', 'react-dom'] },
  '@radix-ui/react-select': { package: '@radix-ui/react-select', version: '2.1.2', external: ['react', 'react-dom'] },
  '@radix-ui/react-checkbox': { package: '@radix-ui/react-checkbox', version: '1.1.2', external: ['react', 'react-dom'] },
  '@radix-ui/react-switch': { package: '@radix-ui/react-switch', version: '1.1.1', external: ['react', 'react-dom'] },
  '@radix-ui/react-slider': { package: '@radix-ui/react-slider', version: '1.2.1', external: ['react', 'react-dom'] },
  '@radix-ui/react-slot': { package: '@radix-ui/react-slot', version: '1.1.0', external: ['react', 'react-dom'] },

  // Utilities
  'clsx': { package: 'clsx', version: '2.1.1' },
  'classnames': { package: 'classnames', version: '2.5.1' },
  'tailwind-merge': { package: 'tailwind-merge', version: '2.5.4' },
  'class-variance-authority': { package: 'class-variance-authority', version: '0.7.1' },

  // Date/Time
  'date-fns': { package: 'date-fns', version: '4.1.0' },
  'dayjs': { package: 'dayjs', version: '1.11.13' },

  // HTTP
  'axios': { package: 'axios', version: '1.7.9' },

  // Charts
  'recharts': { package: 'recharts', version: '2.14.1', external: ['react', 'react-dom'] },

  // Tables
  '@tanstack/react-table': { package: '@tanstack/react-table', version: '8.20.5', external: ['react'] },

  // Toast
  'sonner': { package: 'sonner', version: '1.7.0', external: ['react', 'react-dom'] },
  'react-hot-toast': { package: 'react-hot-toast', version: '2.4.1', external: ['react', 'react-dom'] },

  // DnD
  '@dnd-kit/core': { package: '@dnd-kit/core', version: '6.3.1', external: ['react', 'react-dom'] },
  '@dnd-kit/sortable': { package: '@dnd-kit/sortable', version: '10.0.0', external: ['react'] },

  // Carousel
  'swiper': { package: 'swiper', version: '11.1.15' },
  'embla-carousel-react': { package: 'embla-carousel-react', version: '8.5.1', external: ['react'] },

  // Misc
  'uuid': { package: 'uuid', version: '11.0.3' },
  'nanoid': { package: 'nanoid', version: '5.0.9' },
  'lodash': { package: 'lodash', version: '4.17.21' },
  'lodash-es': { package: 'lodash-es', version: '4.17.21' },
  'immer': { package: 'immer', version: '10.1.1' },
};

/**
 * Build esm.sh URL for a package configuration
 */
export function buildEsmUrl(config: PackageConfig): string {
  let url = `https://esm.sh/${config.package}`;

  if (config.version) {
    url += `@${config.version}`;
  }

  if (config.subpath) {
    url += config.subpath;
  }

  if (config.external && config.external.length > 0) {
    url += `?external=${config.external.join(',')}`;
  }

  return url;
}

/**
 * Try to resolve an unknown package specifier
 */
export function resolveUnknownPackage(specifier: string): string | null {
  // Check registry first
  if (PACKAGE_REGISTRY[specifier]) {
    return buildEsmUrl(PACKAGE_REGISTRY[specifier]);
  }

  // Handle scoped packages (@org/pkg/subpath)
  const parts = specifier.split('/');
  if (specifier.startsWith('@') && parts.length >= 2) {
    const scopedBase = `${parts[0]}/${parts[1]}`;
    if (PACKAGE_REGISTRY[scopedBase]) {
      const config = { ...PACKAGE_REGISTRY[scopedBase] };
      if (parts.length > 2) {
        config.subpath = '/' + parts.slice(2).join('/');
      }
      return buildEsmUrl(config);
    }
    return `https://esm.sh/${specifier}?external=react,react-dom`;
  }

  // Handle regular packages with subpath
  if (parts.length >= 2) {
    const base = parts[0];
    if (PACKAGE_REGISTRY[base]) {
      const config = { ...PACKAGE_REGISTRY[base] };
      config.subpath = '/' + parts.slice(1).join('/');
      return buildEsmUrl(config);
    }
  }

  // Skip relative imports
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    return null;
  }

  // Skip Node built-ins
  const nodeBuiltins = ['fs', 'path', 'os', 'crypto', 'http', 'https', 'stream', 'util', 'events', 'buffer'];
  if (nodeBuiltins.includes(specifier) || nodeBuiltins.includes(parts[0])) {
    return null;
  }

  // Unknown package - try esm.sh
  return `https://esm.sh/${specifier}?external=react,react-dom`;
}

/**
 * Extract all import specifiers from code
 */
export function extractImports(code: string): string[] {
  const imports = new Set<string>();

  const patterns = [
    /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
        imports.add(specifier);
      }
    }
  }

  return Array.from(imports);
}

/**
 * Analyze files and return required import map entries
 */
export function analyzeFilesForImports(files: Record<string, string>): Record<string, string> {
  const importMap: Record<string, string> = {};
  const allImports = new Set<string>();

  for (const content of Object.values(files)) {
    if (typeof content === 'string') {
      const imports = extractImports(content);
      imports.forEach(imp => allImports.add(imp));
    }
  }

  for (const specifier of allImports) {
    const url = resolveUnknownPackage(specifier);
    if (url) {
      importMap[specifier] = url;
    }
  }

  return importMap;
}

/**
 * Parse bare specifier error and extract module name
 */
export function parseSpecifierError(errorMessage: string): string | null {
  const match = errorMessage.match(/specifier ["']([^"']+)["'] was a bare specifier/i);
  if (match) return match[1];

  const altMatch = errorMessage.match(/Failed to resolve module specifier ["']([^"']+)["']/i);
  if (altMatch) return altMatch[1];

  return null;
}

/**
 * Get base import map with essential packages
 */
export function getBaseImportMap(): Record<string, string> {
  const base: Record<string, string> = {};
  const essentials = [
    'react', 'react/jsx-runtime', 'react/jsx-dev-runtime',
    'react-dom', 'react-dom/client',
    'lucide-react', 'clsx', 'classnames', 'tailwind-merge',
    'framer-motion', 'motion', 'motion/react',
    'date-fns', 'zustand', 'react-hook-form',
  ];

  for (const pkg of essentials) {
    if (PACKAGE_REGISTRY[pkg]) {
      base[pkg] = buildEsmUrl(PACKAGE_REGISTRY[pkg]);
    }
  }

  return base;
}
