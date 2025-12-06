// AI Service - Provider Management
import { AIProvider, ProviderConfig, ProviderType, DEFAULT_PROVIDERS, GenerationRequest, GenerationResponse, StreamChunk } from './types';
import { GeminiProvider, OpenAIProvider, AnthropicProvider, OllamaProvider, LMStudioProvider } from './providers';

export * from './types';
export * from './providers';

// Provider factory
export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'gemini':
      return new GeminiProvider(config);
    case 'openai':
    case 'openrouter':
    case 'custom':
      // OpenAI-compatible API
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    case 'lmstudio':
      return new LMStudioProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

// Storage key for provider configurations
const STORAGE_KEY = 'fluidflow_ai_providers';
const ACTIVE_PROVIDER_KEY = 'fluidflow_active_provider';

// Load saved providers from localStorage
export function loadProviders(): ProviderConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load providers:', e);
  }

  // Return default Gemini config if nothing saved
  const defaultConfig: ProviderConfig = {
    id: 'default-gemini',
    ...DEFAULT_PROVIDERS.gemini,
    apiKey: process.env.API_KEY || '',
  };

  return [defaultConfig];
}

// Save providers to localStorage
export function saveProviders(providers: ProviderConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  } catch (e) {
    console.error('Failed to save providers:', e);
  }
}

// Get active provider ID
export function getActiveProviderId(): string {
  return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'default-gemini';
}

// Set active provider ID
export function setActiveProviderId(id: string): void {
  localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
}

// Provider Manager class for easier state management
export class ProviderManager {
  private providers: Map<string, ProviderConfig> = new Map();
  private instances: Map<string, AIProvider> = new Map();
  private activeProviderId: string = '';

  constructor() {
    this.load();
  }

  private load(): void {
    const configs = loadProviders();
    configs.forEach(c => this.providers.set(c.id, c));
    this.activeProviderId = getActiveProviderId();

    // Ensure active provider exists
    if (!this.providers.has(this.activeProviderId) && this.providers.size > 0) {
      this.activeProviderId = this.providers.keys().next().value || '';
    }
  }

  private save(): void {
    saveProviders(Array.from(this.providers.values()));
    setActiveProviderId(this.activeProviderId);
  }

  getConfigs(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  getConfig(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  getActiveConfig(): ProviderConfig | undefined {
    return this.providers.get(this.activeProviderId);
  }

  getActiveProviderId(): string {
    return this.activeProviderId;
  }

  setActiveProvider(id: string): void {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      this.save();
    }
  }

  addProvider(config: ProviderConfig): void {
    this.providers.set(config.id, config);
    this.instances.delete(config.id); // Clear cached instance
    this.save();
  }

  updateProvider(id: string, updates: Partial<ProviderConfig>): void {
    const existing = this.providers.get(id);
    if (existing) {
      this.providers.set(id, { ...existing, ...updates });
      this.instances.delete(id);
      this.save();
    }
  }

  deleteProvider(id: string): void {
    this.providers.delete(id);
    this.instances.delete(id);

    // Switch to another provider if active was deleted
    if (this.activeProviderId === id) {
      const firstId = this.providers.keys().next().value;
      this.activeProviderId = firstId || '';
    }

    this.save();
  }

  getProvider(id?: string): AIProvider | null {
    const targetId = id || this.activeProviderId;
    const config = this.providers.get(targetId);
    if (!config) return null;

    // Return cached instance or create new one
    let instance = this.instances.get(targetId);
    if (!instance) {
      instance = createProvider(config);
      this.instances.set(targetId, instance);
    }

    return instance;
  }

  async testProvider(id: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.getProvider(id);
    if (!provider) return { success: false, error: 'Provider not found' };
    return provider.testConnection();
  }

  // Convenience method for generation
  async generate(request: GenerationRequest, modelId?: string): Promise<GenerationResponse> {
    const provider = this.getProvider();
    if (!provider) throw new Error('No active provider');

    const config = this.getActiveConfig();
    const model = modelId || config?.defaultModel || '';

    return provider.generate(request, model);
  }

  async generateStream(
    request: GenerationRequest,
    onChunk: (chunk: StreamChunk) => void,
    modelId?: string
  ): Promise<GenerationResponse> {
    const provider = this.getProvider();
    if (!provider) throw new Error('No active provider');

    const config = this.getActiveConfig();
    const model = modelId || config?.defaultModel || '';

    return provider.generateStream(request, model, onChunk);
  }
}

// Singleton instance
let providerManagerInstance: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new ProviderManager();
  }
  return providerManagerInstance;
}
