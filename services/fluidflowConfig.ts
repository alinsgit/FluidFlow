// FluidFlow Project Configuration
// Manages .fluidflow folder structure and configuration files

/** AI Response format type - json (default) or marker (experimental) */
export type AIResponseFormat = 'json' | 'marker';

export interface FluidFlowConfig {
  // Project-level AI instructions
  rules?: string;
  // Agent configurations
  agents?: AgentConfig[];
  // Context management settings
  contextSettings?: ContextSettings;
  // AI Response format (json or marker) - affects how AI returns code
  responseFormat?: AIResponseFormat;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  enabled: boolean;
}

export interface ContextSettings {
  maxTokensBeforeCompact: number;
  compactToTokens: number;
  autoCompact: boolean;
  saveCompactionLogs: boolean;
}

export interface CompactionLog {
  id: string;
  timestamp: number;
  contextId: string;
  beforeTokens: number;
  afterTokens: number;
  messagesSummarized: number;
  summary: string;
}

// Default configuration
const DEFAULT_CONFIG: FluidFlowConfig = {
  rules: `# FluidFlow Project Rules

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
  agents: [
    {
      id: 'prompt-engineer',
      name: 'Prompt Engineer',
      description: 'Helps improve prompts through conversation',
      systemPrompt: 'You are a prompt engineering expert...',
      enabled: true
    },
    {
      id: 'code-reviewer',
      name: 'Code Reviewer',
      description: 'Reviews generated code for best practices',
      systemPrompt: 'You are a senior code reviewer...',
      enabled: false
    },
    {
      id: 'accessibility-auditor',
      name: 'Accessibility Auditor',
      description: 'Checks code for accessibility issues',
      systemPrompt: 'You are an accessibility expert...',
      enabled: false
    }
  ],
  contextSettings: {
    maxTokensBeforeCompact: 8000,
    compactToTokens: 2000,
    autoCompact: false,  // Require confirmation
    saveCompactionLogs: true
  }
};

// Storage keys
const CONFIG_KEY = 'fluidflow_config';
const COMPACTION_LOGS_KEY = 'fluidflow_compaction_logs';

class FluidFlowConfigManager {
  private config: FluidFlowConfig;
  private compactionLogs: CompactionLog[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.compactionLogs = this.loadCompactionLogs();
  }

  private loadConfig(): FluidFlowConfig {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('[FluidFlow] Failed to load config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('[FluidFlow] Failed to save config:', e);
    }
  }

  private loadCompactionLogs(): CompactionLog[] {
    try {
      const saved = localStorage.getItem(COMPACTION_LOGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('[FluidFlow] Failed to load compaction logs:', e);
    }
    return [];
  }

  private saveCompactionLogs(): void {
    try {
      // Keep only last 50 logs
      const logsToSave = this.compactionLogs.slice(-50);
      localStorage.setItem(COMPACTION_LOGS_KEY, JSON.stringify(logsToSave));
    } catch (e) {
      console.error('[FluidFlow] Failed to save compaction logs:', e);
    }
  }

  // Get configuration
  getConfig(): FluidFlowConfig {
    return { ...this.config };
  }

  // Get project rules
  getRules(): string {
    return this.config.rules || '';
  }

  // Update rules
  setRules(rules: string): void {
    this.config.rules = rules;
    this.saveConfig();
  }

  // Get agents
  getAgents(): AgentConfig[] {
    return this.config.agents || [];
  }

  // Get enabled agents
  getEnabledAgents(): AgentConfig[] {
    return (this.config.agents || []).filter(a => a.enabled);
  }

  // Update agent
  updateAgent(id: string, updates: Partial<AgentConfig>): void {
    const agents = this.config.agents || [];
    const index = agents.findIndex(a => a.id === id);
    if (index >= 0) {
      agents[index] = { ...agents[index], ...updates };
      this.config.agents = agents;
      this.saveConfig();
    }
  }

  // Add agent
  addAgent(agent: AgentConfig): void {
    this.config.agents = [...(this.config.agents || []), agent];
    this.saveConfig();
  }

  // Get context settings
  getContextSettings(): ContextSettings {
    // Default context settings (guaranteed to exist)
    const defaultSettings: ContextSettings = {
      maxTokensBeforeCompact: 8000,
      compactToTokens: 2000,
      autoCompact: false,
      saveCompactionLogs: true
    };
    return this.config.contextSettings ?? defaultSettings;
  }

  // Update context settings
  updateContextSettings(settings: Partial<ContextSettings>): void {
    this.config.contextSettings = {
      ...this.getContextSettings(),
      ...settings
    };
    this.saveConfig();
  }

  // Get response format
  getResponseFormat(): AIResponseFormat {
    return this.config.responseFormat || 'json';
  }

  // Set response format
  setResponseFormat(format: AIResponseFormat): void {
    this.config.responseFormat = format;
    this.saveConfig();
    console.log('[FluidFlow] Response format set to:', format);
  }

  // Add compaction log
  addCompactionLog(log: Omit<CompactionLog, 'id' | 'timestamp'>): CompactionLog {
    const fullLog: CompactionLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    this.compactionLogs.push(fullLog);
    this.saveCompactionLogs();
    console.log('[FluidFlow] Compaction logged:', fullLog);
    return fullLog;
  }

  // Get compaction logs
  getCompactionLogs(contextId?: string): CompactionLog[] {
    if (contextId) {
      return this.compactionLogs.filter(l => l.contextId === contextId);
    }
    return [...this.compactionLogs];
  }

  // Clear compaction logs
  clearCompactionLogs(): void {
    this.compactionLogs = [];
    this.saveCompactionLogs();
  }

  // Export configuration as .fluidflow folder content
  exportAsFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    // rules.md
    files['.fluidflow/rules.md'] = this.config.rules || '';

    // agents.json
    files['.fluidflow/agents.json'] = JSON.stringify(this.config.agents || [], null, 2);

    // settings.json
    files['.fluidflow/settings.json'] = JSON.stringify({
      contextSettings: this.config.contextSettings
    }, null, 2);

    // compaction-logs.json (if enabled)
    if (this.config.contextSettings?.saveCompactionLogs) {
      files['.fluidflow/logs/compaction-logs.json'] = JSON.stringify(this.compactionLogs, null, 2);
    }

    // .gitignore for the folder
    files['.fluidflow/.gitignore'] = `# FluidFlow local files
logs/
*.local.json
`;

    return files;
  }

  // Import from files
  importFromFiles(files: Record<string, string>): void {
    // Parse rules.md
    if (files['.fluidflow/rules.md']) {
      this.config.rules = files['.fluidflow/rules.md'];
    }

    // Parse agents.json
    if (files['.fluidflow/agents.json']) {
      try {
        this.config.agents = JSON.parse(files['.fluidflow/agents.json']);
      } catch (e) {
        console.error('[FluidFlow] Failed to parse agents.json:', e);
      }
    }

    // Parse settings.json
    if (files['.fluidflow/settings.json']) {
      try {
        const settings = JSON.parse(files['.fluidflow/settings.json']);
        this.config.contextSettings = settings.contextSettings;
      } catch (e) {
        console.error('[FluidFlow] Failed to parse settings.json:', e);
      }
    }

    this.saveConfig();
  }
}

// Singleton instance
let configManagerInstance: FluidFlowConfigManager | null = null;

export function getFluidFlowConfig(): FluidFlowConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new FluidFlowConfigManager();
  }
  return configManagerInstance;
}

export default FluidFlowConfigManager;
