// Shared types for FluidFlow application

export type FileSystem = Record<string, string>;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  files: FileSystem;
}

// File change tracking
export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
}

// Chat message types
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatAttachment {
  type: 'sketch' | 'brand';
  file: File;
  preview: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  timestamp: number;
  // User message
  prompt?: string;
  attachments?: ChatAttachment[];
  // Assistant message
  explanation?: string;
  files?: FileSystem;
  fileChanges?: FileChange[];
  // For reverting
  snapshotFiles?: FileSystem;
  isGenerating?: boolean;
  error?: string;
  // Token usage information
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  // Model and provider info
  model?: string;
  provider?: string;
  generationTime?: number; // in ms
  // Proactive continuation for large responses
  continuation?: {
    prompt: string;
    remainingFiles: string[];
    currentBatch: number;
    totalBatches: number;
  };
  // Batch generation option for truncated responses
  batchGeneration?: {
    available: boolean;
    incompleteFiles: string[];
    prompt: string;
    systemInstruction: string;
  };
}

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
}

export interface LogEntry {
  id: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
  isFixing?: boolean;
  isFixed?: boolean;
}

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status: number | string;
  duration: number;
  timestamp: string;
}

export interface PushResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Device types for preview
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type TabType = 'preview' | 'code' | 'database' | 'tests' | 'docs' | 'env' | 'debug' | 'git' | 'run';
export type TerminalTab = 'console' | 'network';

// AI Model types
export type ModelTier = 'fast' | 'pro';

export interface ModelConfig {
  id: string;
  name: string;
  tier: ModelTier;
  description: string;
}

// Code generation models only (for Gemini provider) - Updated December 2025
export const AI_MODELS: ModelConfig[] = [
  {
    id: 'models/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tier: 'fast',
    description: 'Fast & efficient'
  },
  {
    id: 'models/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tier: 'pro',
    description: 'Best quality'
  },
  {
    id: 'models/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    tier: 'pro',
    description: 'Latest flagship'
  }
];

// Debug types
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'stream' | 'error' | 'info';
  category: 'generation' | 'accessibility' | 'quick-edit' | 'auto-fix' | 'other';
  model?: string;
  duration?: number;
  // Request data
  prompt?: string;
  systemInstruction?: string;
  attachments?: { type: string; size: number }[];
  // Response data
  response?: string;
  tokenCount?: {
    input?: number;
    output?: number;
  };
  // Error data
  error?: string;
  // Metadata
  metadata?: Record<string, unknown>;
}

// Technology Stack Configuration
export interface TechStackConfig {
  styling: {
    library: 'tailwind' | 'bootstrap' | 'material-ui' | 'ant-design' | 'chakra-ui' | 'css-modules' | 'styled-components' | 'emotion';
    version: string;
  };
  icons: {
    library: 'lucide-react' | 'react-icons' | 'heroicons' | 'material-icons' | 'font-awesome';
    version: string;
  };
  stateManagement: {
    library: 'none' | 'zustand' | 'redux-toolkit' | 'context-api' | 'recoil' | 'mobx';
    version: string;
  };
  routing: {
    library: 'none' | 'react-router' | 'next-router' | 'reach-router';
    version: string;
  };
  dataFetching: {
    library: 'none' | 'axios' | 'fetch' | 'react-query' | 'swr' | 'apollo-client';
    version: string;
  };
  forms: {
    library: 'none' | 'react-hook-form' | 'formik' | 'final-form';
    version: string;
  };
  animations: {
    library: 'none' | 'framer-motion' | 'react-spring' | 'react-transition-group';
    version: string;
  };
  testing: {
    library: 'none' | 'jest' | 'vitest' | 'react-testing-library';
    version: string;
  };
}

// Available technology options
export const TECH_STACK_OPTIONS = {
  styling: [
    { value: 'tailwind', label: 'Tailwind CSS', description: 'Utility-first CSS framework' },
    { value: 'bootstrap', label: 'Bootstrap', description: 'Popular CSS framework' },
    { value: 'material-ui', label: 'Material-UI (MUI)', description: 'React Material Design components' },
    { value: 'ant-design', label: 'Ant Design', description: 'Enterprise UI design language' },
    { value: 'chakra-ui', label: 'Chakra UI', description: 'Simple modular component library' },
    { value: 'css-modules', label: 'CSS Modules', description: 'Locally scoped CSS' },
    { value: 'styled-components', label: 'Styled Components', description: 'CSS-in-JS styling' },
    { value: 'emotion', label: 'Emotion', description: 'Performance-focused CSS-in-JS' }
  ],
  icons: [
    { value: 'lucide-react', label: 'Lucide React', description: 'Beautiful & consistent icons' },
    { value: 'react-icons', label: 'React Icons', description: 'Multiple icon packs in one' },
    { value: 'heroicons', label: 'Heroicons', description: 'Handcrafted SVG icons' },
    { value: 'material-icons', label: 'Material Icons', description: 'Google Material icons' },
    { value: 'font-awesome', label: 'Font Awesome', description: 'The internet\'s icon library' }
  ],
  stateManagement: [
    { value: 'none', label: 'None (React State)', description: 'Built-in React useState/useReducer' },
    { value: 'zustand', label: 'Zustand', description: 'Small, fast, scalable state management' },
    { value: 'redux-toolkit', label: 'Redux Toolkit', description: 'Official Redux toolkit' },
    { value: 'context-api', label: 'Context API', description: 'React built-in context' },
    { value: 'recoil', label: 'Recoil', description: 'Facebook\'s state management library' },
    { value: 'mobx', label: 'MobX', description: 'Simple, scalable state management' }
  ],
  routing: [
    { value: 'none', label: 'None (Single Page)', description: 'No routing needed' },
    { value: 'react-router', label: 'React Router', description: 'Declarative routing for React' },
    { value: 'next-router', label: 'Next.js Router', description: 'Next.js built-in router' },
    { value: 'reach-router', label: 'Reach Router', description: 'Accessible routing' }
  ],
  dataFetching: [
    { value: 'none', label: 'None (Fetch API)', description: 'Built-in fetch API' },
    { value: 'axios', label: 'Axios', description: 'Promise based HTTP client' },
    { value: 'fetch', label: 'Fetch API', description: 'Modern fetch with polyfills' },
    { value: 'react-query', label: 'React Query (TanStack Query)', description: 'Server state management' },
    { value: 'swr', label: 'SWR', description: 'React Hooks for data fetching' },
    { value: 'apollo-client', label: 'Apollo Client', description: 'GraphQL client' }
  ],
  forms: [
    { value: 'none', label: 'None (HTML Forms)', description: 'Standard HTML forms' },
    { value: 'react-hook-form', label: 'React Hook Form', description: 'Performant forms with easy validation' },
    { value: 'formik', label: 'Formik', description: 'Build forms in React' },
    { value: 'final-form', label: 'Final Form', description: 'High performance subscription-based form state' }
  ],
  animations: [
    { value: 'none', label: 'None (CSS Transitions)', description: 'CSS transitions/animations' },
    { value: 'framer-motion', label: 'Framer Motion', description: 'Production-ready motion library' },
    { value: 'react-spring', label: 'React Spring', description: 'Spring physics based animation' },
    { value: 'react-transition-group', label: 'React Transition Group', description: 'Animation components for React' }
  ],
  testing: [
    { value: 'none', label: 'None', description: 'No testing library' },
    { value: 'jest', label: 'Jest', description: 'JavaScript testing framework' },
    { value: 'vitest', label: 'Vitest', description: 'Next generation testing framework' },
    { value: 'react-testing-library', label: 'React Testing Library', description: 'Simple and complete testing utilities' }
  ]
} as const;

// Default tech stack configuration
export const DEFAULT_TECH_STACK: TechStackConfig = {
  styling: { library: 'tailwind', version: 'latest' },
  icons: { library: 'lucide-react', version: 'latest' },
  stateManagement: { library: 'none', version: 'built-in' },
  routing: { library: 'none', version: 'built-in' },
  dataFetching: { library: 'none', version: 'built-in' },
  forms: { library: 'none', version: 'built-in' },
  animations: { library: 'none', version: 'built-in' },
  testing: { library: 'none', version: 'built-in' }
};

export interface DebugState {
  enabled: boolean;
  logs: DebugLogEntry[];
  maxLogs: number;
  filter: {
    types: DebugLogEntry['type'][];
    categories: DebugLogEntry['category'][];
    searchQuery: string;
  };
}
