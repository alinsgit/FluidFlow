/**
 * FluidFlow Default Configuration
 *
 * Default values for FluidFlow project configuration.
 */

import type { FluidFlowConfig, ContextSettings } from './types';

/**
 * Default project rules template
 */
export const DEFAULT_RULES = `# FluidFlow Project Rules

## CRITICAL: Tech Stack Versions (USE THESE EXACT VERSIONS)
- React 19.x (NOT 18.x) - Use React 19 features
- React DOM 19.x
- TypeScript 5.9+
- Vite 7.x
- Tailwind CSS 4.x (NOT 3.x) - Use Tailwind v4 syntax
- Lucide React 0.561+ for icons
- Motion 12.x (formerly Framer Motion)
- React Router 7.x

## package.json Template (ALWAYS USE)
\`\`\`json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "lucide-react": "^0.561.0",
    "motion": "^12.0.0",
    "react-router": "^7.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.0",
    "vite": "^7.2.0",
    "@tailwindcss/vite": "^4.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.9.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0"
  }
}
\`\`\`

## Code Style
- Use TypeScript with strict mode
- Follow React 19 best practices (use new hooks, Server Components patterns)
- Use Tailwind CSS v4 for styling (new @theme directive, CSS-first config)
- Prefer functional components with hooks
- Use "motion" package (NOT "framer-motion") for animations

## Generation Guidelines
- Always include proper error handling
- Add loading states for async operations
- Make components responsive by default
- Include accessibility attributes (ARIA)
- NEVER use deprecated React patterns (class components, legacy context)

## File Structure
- Components in src/components/
- Utilities in src/utils/
- Types in src/types/
`;

/**
 * Default agent configurations
 */
export const DEFAULT_AGENTS = [
  {
    id: 'prompt-engineer',
    name: 'Prompt Engineer',
    description: 'Helps improve prompts through conversation',
    systemPrompt: 'You are a prompt engineering expert...',
    enabled: true,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews generated code for best practices',
    systemPrompt: 'You are a senior code reviewer...',
    enabled: false,
  },
  {
    id: 'accessibility-auditor',
    name: 'Accessibility Auditor',
    description: 'Checks code for accessibility issues',
    systemPrompt: 'You are an accessibility expert...',
    enabled: false,
  },
];

/**
 * Default context settings
 * minRemainingTokens: Trigger compaction when remaining context space falls below this value
 * This ensures we always have room for the AI to generate a meaningful response
 */
export const DEFAULT_CONTEXT_SETTINGS: ContextSettings = {
  minRemainingTokens: 8000, // Compact when less than 8K tokens remaining
  compactToTokens: 2000,
  autoCompact: false, // Require confirmation
  saveCompactionLogs: true,
};

/**
 * Default FluidFlow configuration
 */
export const DEFAULT_CONFIG: FluidFlowConfig = {
  rules: DEFAULT_RULES,
  agents: DEFAULT_AGENTS,
  contextSettings: DEFAULT_CONTEXT_SETTINGS,
  responseFormat: 'marker', // Default to marker format for better streaming
};

/**
 * Storage keys for localStorage persistence
 */
export const STORAGE_KEYS = {
  CONFIG: 'fluidflow_config',
  COMPACTION_LOGS: 'fluidflow_compaction_logs',
} as const;

/**
 * Maximum number of compaction logs to retain
 */
export const MAX_COMPACTION_LOGS = 50;
