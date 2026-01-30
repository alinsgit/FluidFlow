import type { ProviderConfig, ProviderType, ModelOption } from '@/services/ai';

export interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChange?: (providerId: string, modelId: string) => void;
}

export interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

export interface UseAISettingsReturn {
  // State
  providers: ProviderConfig[];
  activeProviderId: string;
  selectedProviderId: string | null;
  setSelectedProviderId: (id: string | null) => void;
  selectedProvider: ProviderConfig | undefined;
  showApiKey: Record<string, boolean>;
  setShowApiKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  testResults: Record<string, TestResult>;
  showAddProvider: boolean;
  setShowAddProvider: (show: boolean) => void;
  newProviderType: ProviderType;
  setNewProviderType: (type: ProviderType) => void;
  editingModels: boolean;
  setEditingModels: (editing: boolean) => void;
  showAddModel: boolean;
  setShowAddModel: (show: boolean) => void;
  newModel: Partial<ModelOption>;
  setNewModel: React.Dispatch<React.SetStateAction<Partial<ModelOption>>>;
  fetchingModels: boolean;
  customModelInput: string;
  setCustomModelInput: (input: string) => void;
  // Handlers
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  testConnection: (id: string) => Promise<void>;
  addProvider: () => void;
  setActiveProvider: (id: string) => void;
  addModel: () => void;
  updateModelInProvider: (modelId: string, updates: Partial<ModelOption>) => void;
  deleteModel: (modelId: string) => void;
  fetchModels: () => Promise<void>;
  addCustomModel: () => void;
}
