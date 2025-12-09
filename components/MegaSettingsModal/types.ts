// Mega Settings Modal Type Definitions
import { LucideIcon } from 'lucide-react';
import { TechStackConfig, DebugLogEntry } from '../../types';
import { ProviderConfig } from '../../services/ai';
import { ContextSettings, AgentConfig } from '../../services/fluidflowConfig';

// Settings Categories
export type SettingsCategory =
  | 'ai-providers'
  | 'context-manager'
  | 'tech-stack'
  | 'projects'
  | 'editor'
  | 'appearance'
  | 'debug'
  | 'shortcuts'
  | 'advanced';

export interface SettingsCategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

// Modal Props
export interface MegaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SettingsCategory;
  onProviderChange?: (providerId: string, modelId: string) => void;
}

// Panel Props
export interface SettingsPanelProps {
  isActive: boolean;
}

// Editor Settings
export interface EditorSettings {
  fontSize: number;
  tabSize: 2 | 4;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  bracketPairColorization: boolean;
  formatOnPaste: boolean;
  formatOnSave: boolean;
  theme: 'vs-dark' | 'vs' | 'hc-black';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  smoothScrolling: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  bracketPairColorization: true,
  formatOnPaste: false,
  formatOnSave: true,
  theme: 'vs-dark',
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  smoothScrolling: true,
};

// Appearance Settings
export interface AppearanceSettings {
  animationsEnabled: boolean;
  compactMode: boolean;
  defaultPreviewDevice: 'desktop' | 'tablet' | 'mobile';
  sidebarWidth: number;
  showWelcomeOnStartup: boolean;
  autoCollapseFileExplorer: boolean;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  animationsEnabled: true,
  compactMode: false,
  defaultPreviewDevice: 'desktop',
  sidebarWidth: 320,
  showWelcomeOnStartup: true,
  autoCollapseFileExplorer: false,
};

// Project Default Settings
export interface ProjectDefaultSettings {
  autoSaveInterval: number;
  enableWIPPersistence: boolean;
  defaultGitBranch: string;
  autoInitGit: boolean;
  createReadme: boolean;
  defaultStyling: string;
  defaultIcons: string;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectDefaultSettings = {
  autoSaveInterval: 30000,
  enableWIPPersistence: true,
  defaultGitBranch: 'main',
  autoInitGit: true,
  createReadme: true,
  defaultStyling: 'tailwind',
  defaultIcons: 'lucide-react',
};

// Debug Settings
export interface DebugSettings {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogs: number;
  persistLogs: boolean;
  showTokenUsage: boolean;
  showGenerationTime: boolean;
  showNetworkRequests: boolean;
}

export const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  enabled: false,
  logLevel: 'info',
  maxLogs: 500,
  persistLogs: false,
  showTokenUsage: true,
  showGenerationTime: true,
  showNetworkRequests: true,
};

// Keyboard Shortcut
export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  category: 'general' | 'editor' | 'navigation' | 'ai';
  keys: string[];
  defaultKeys: string[];
  enabled: boolean;
}

export interface ShortcutsSettings {
  customShortcuts: KeyboardShortcut[];
  useVimBindings: boolean;
  useEmacsBindings: boolean;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'settings', label: 'Open Settings', description: 'Open the settings modal', category: 'general', keys: ['Ctrl', ','], defaultKeys: ['Ctrl', ','], enabled: true },
  { id: 'command-palette', label: 'Command Palette', description: 'Open command palette', category: 'general', keys: ['Ctrl', 'K'], defaultKeys: ['Ctrl', 'K'], enabled: true },
  { id: 'project-manager', label: 'Project Manager', description: 'Open project manager', category: 'general', keys: ['Ctrl', 'O'], defaultKeys: ['Ctrl', 'O'], enabled: true },
  { id: 'save', label: 'Save', description: 'Save current changes', category: 'general', keys: ['Ctrl', 'S'], defaultKeys: ['Ctrl', 'S'], enabled: true },
  { id: 'undo', label: 'Undo', description: 'Undo last change', category: 'editor', keys: ['Ctrl', 'Z'], defaultKeys: ['Ctrl', 'Z'], enabled: true },
  { id: 'redo', label: 'Redo', description: 'Redo last change', category: 'editor', keys: ['Ctrl', 'Y'], defaultKeys: ['Ctrl', 'Y'], enabled: true },
  { id: 'toggle-preview', label: 'Toggle Preview', description: 'Switch to preview tab', category: 'navigation', keys: ['Ctrl', '1'], defaultKeys: ['Ctrl', '1'], enabled: true },
  { id: 'toggle-code', label: 'Toggle Code', description: 'Switch to code tab', category: 'navigation', keys: ['Ctrl', '2'], defaultKeys: ['Ctrl', '2'], enabled: true },
  { id: 'toggle-git', label: 'Toggle Git', description: 'Open git panel', category: 'navigation', keys: ['Ctrl', 'Shift', 'G'], defaultKeys: ['Ctrl', 'Shift', 'G'], enabled: true },
  { id: 'generate', label: 'Generate', description: 'Start AI generation', category: 'ai', keys: ['Ctrl', 'Enter'], defaultKeys: ['Ctrl', 'Enter'], enabled: true },
];

export const DEFAULT_SHORTCUTS_SETTINGS: ShortcutsSettings = {
  customShortcuts: DEFAULT_SHORTCUTS,
  useVimBindings: false,
  useEmacsBindings: false,
};

// Advanced Settings
export interface AdvancedSettings {
  fluidflowRules: string;
  agents: AgentConfig[];
  enableExperimentalFeatures: boolean;
  apiTimeout: number;
  maxRetries: number;
  enableAutoFix: boolean;
  enableQuickEdit: boolean;
  enableAccessibilityCheck: boolean;
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  fluidflowRules: `# FluidFlow Project Rules

## Code Style
- Use TypeScript with strict mode
- Follow React best practices
- Use Tailwind CSS for styling
- Prefer functional components with hooks

## Generation Guidelines
- Always include proper error handling
- Add loading states for async operations
- Make components responsive by default
- Include accessibility attributes (ARIA)

## File Structure
- Components in src/components/
- Utilities in src/utils/
- Types in src/types/
`,
  agents: [],
  enableExperimentalFeatures: false,
  apiTimeout: 120000,
  maxRetries: 3,
  enableAutoFix: true,
  enableQuickEdit: true,
  enableAccessibilityCheck: true,
};

// Unified Settings State
export interface UnifiedSettings {
  aiProviders: ProviderConfig[];
  activeProviderId: string;
  contextSettings: ContextSettings;
  techStack: TechStackConfig;
  projects: ProjectDefaultSettings;
  editor: EditorSettings;
  appearance: AppearanceSettings;
  debug: DebugSettings;
  shortcuts: ShortcutsSettings;
  advanced: AdvancedSettings;
}

// Storage Keys
export const STORAGE_KEYS = {
  EDITOR_SETTINGS: 'fluidflow_editor_settings',
  APPEARANCE: 'fluidflow_appearance',
  PROJECT_DEFAULTS: 'fluidflow_project_defaults',
  DEBUG_SETTINGS: 'fluidflow_debug_settings',
  SHORTCUTS: 'fluidflow_shortcuts',
  ADVANCED: 'fluidflow_advanced',
} as const;
