// AI Service - Provider Management
import { AIProvider, ProviderConfig, ProviderType, DEFAULT_PROVIDERS, GenerationRequest, GenerationResponse, StreamChunk } from './types';
import { GeminiProvider, OpenAIProvider, AnthropicProvider, OllamaProvider, LMStudioProvider } from './providers';
import { settingsApi } from '../projectApi';

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

// Storage key for provider configurations (localStorage fallback)
const STORAGE_KEY = 'fluidflow_ai_providers';
const ACTIVE_PROVIDER_KEY = 'fluidflow_active_provider';

// Load saved providers from localStorage (fallback)
export function loadProvidersFromLocalStorage(): ProviderConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load providers from localStorage:', e);
  }

  // Return default Gemini config if nothing saved
  const defaultConfig: ProviderConfig = {
    id: 'default-gemini',
    ...DEFAULT_PROVIDERS.gemini,
    apiKey: process.env.API_KEY || '',
  };

  return [defaultConfig];
}

// Save providers to localStorage (fallback)
export function saveProvidersToLocalStorage(providers: ProviderConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  } catch (e) {
    console.error('Failed to save providers to localStorage:', e);
  }
}

// Get active provider ID from localStorage
export function getActiveProviderIdFromLocalStorage(): string {
  return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'default-gemini';
}

// Set active provider ID in localStorage
export function setActiveProviderIdInLocalStorage(id: string): void {
  localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
}

// Legacy exports for backwards compatibility
export const loadProviders = loadProvidersFromLocalStorage;
export const saveProviders = saveProvidersToLocalStorage;
export const getActiveProviderId = getActiveProviderIdFromLocalStorage;
export const setActiveProviderId = setActiveProviderIdInLocalStorage;

// Provider Manager class for easier state management
export class ProviderManager {
  private providers: Map<string, ProviderConfig> = new Map();
  private instances: Map<string, AIProvider> = new Map();
  private activeProviderId: string = '';
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Load from localStorage immediately for fast startup
    this.loadFromLocalStorage();
    // Then async load from backend to get latest
    this.initPromise = this.loadFromBackend();
  }

  private loadFromLocalStorage(): void {
    const configs = loadProvidersFromLocalStorage();
    configs.forEach(c => this.providers.set(c.id, c));
    this.activeProviderId = getActiveProviderIdFromLocalStorage();

    // Ensure active provider exists
    if (!this.providers.has(this.activeProviderId) && this.providers.size > 0) {
      this.activeProviderId = this.providers.keys().next().value || '';
    }
  }

  private async loadFromBackend(): Promise<void> {
    try {
      const { providers, activeId } = await settingsApi.getAIProviders();
      if (providers && providers.length > 0) {
        this.providers.clear();
        this.instances.clear();
        // Cast from storage type to full ProviderConfig - JSON preserves full structure
        (providers as unknown as ProviderConfig[]).forEach((c) => this.providers.set(c.id, c));
        this.activeProviderId = activeId || this.activeProviderId;

        // Sync to localStorage (also needs cast)
        saveProvidersToLocalStorage(providers as unknown as ProviderConfig[]);
        setActiveProviderIdInLocalStorage(this.activeProviderId);

        console.log('[AI] Loaded providers from backend:', providers.length);
      }
    } catch (e) {
      console.log('[AI] Backend not available, using localStorage');
    }
    this.isInitialized = true;
  }

  // Wait for initialization (useful for ensuring backend data is loaded)
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private save(): void {
    // Save to localStorage immediately
    saveProvidersToLocalStorage(Array.from(this.providers.values()));
    setActiveProviderIdInLocalStorage(this.activeProviderId);

    // Async save to backend
    this.saveToBackend();
  }

  private async saveToBackend(): Promise<void> {
    try {
      // Cast to storage type for API call
      const providers = Array.from(this.providers.values()) as unknown as import('../projectApi').StoredProviderConfig[];
      await settingsApi.saveAIProviders(providers, this.activeProviderId);
      console.log('[AI] Saved providers to backend');
    } catch (e) {
      console.warn('[AI] Failed to save providers to backend:', e);
    }
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
