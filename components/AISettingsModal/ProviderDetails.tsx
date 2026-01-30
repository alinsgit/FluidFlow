import React from 'react';
import {
  Trash2, Check, Loader2, Plus,
  Eye, EyeOff, RefreshCw,
  ExternalLink, AlertCircle, CheckCircle2, Pencil, Download,
  Zap, Key, Link2
} from 'lucide-react';
import type { ProviderConfig, ModelOption } from '@/services/ai';
import { ProviderIcon } from '../shared/ProviderIcon';
import type { TestResult } from './types';

interface Props {
  provider: ProviderConfig;
  providers: ProviderConfig[];
  activeProviderId: string;
  testResult: TestResult | null;
  showApiKey: Record<string, boolean>;
  setShowApiKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
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
  setActiveProvider: (id: string) => void;
  addModel: () => void;
  updateModelInProvider: (modelId: string, updates: Partial<ModelOption>) => void;
  deleteModel: (modelId: string) => void;
  fetchModels: () => Promise<void>;
  addCustomModel: () => void;
}

const API_KEY_LINKS = [
  { name: 'Google AI Studio', url: 'https://aistudio.google.com/apikey' },
  { name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  { name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys' },
  { name: 'Z.AI', url: 'https://z.ai' },
  { name: 'OpenRouter', url: 'https://openrouter.ai/keys' },
];

export const ProviderDetails: React.FC<Props> = ({
  provider, providers, activeProviderId, testResult,
  showApiKey, setShowApiKey,
  editingModels, setEditingModels, showAddModel, setShowAddModel,
  newModel, setNewModel, fetchingModels, customModelInput, setCustomModelInput,
  updateProvider, deleteProvider, testConnection, setActiveProvider,
  addModel, updateModelInProvider, deleteModel, fetchModels, addCustomModel,
}) => (
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Provider Header */}
    <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
      <div className="flex items-center gap-3">
        <ProviderIcon type={provider.type} className="w-8 h-8" />
        <div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--theme-text-primary)' }}>{provider.name}</h3>
          <p className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>
            {provider.isLocal ? 'Local Provider' : 'Cloud Provider'} &bull; {provider.models.length} models
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => testConnection(provider.id)}
          disabled={testResult?.status === 'testing'}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-primary)' }}
        >
          {testResult?.status === 'testing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Test Connection
        </button>
        {activeProviderId !== provider.id && (
          <button
            onClick={() => setActiveProvider(provider.id)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-info)', color: 'var(--theme-text-primary)' }}
          >
            <Check className="w-4 h-4" />
            Set Active
          </button>
        )}
        {providers.length > 1 && (
          <button
            onClick={() => deleteProvider(provider.id)}
            className="p-1.5 rounded-lg transition-colors"
            title="Delete provider"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'var(--color-error)' }} />
          </button>
        )}
      </div>
    </div>

    {/* Test Result */}
    {testResult && testResult.status !== 'idle' && (
      <div
        className="mx-4 mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        style={{
          backgroundColor: testResult.status === 'testing' ? 'var(--color-info-subtle)' :
            testResult.status === 'success' ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
          color: testResult.status === 'testing' ? 'var(--color-info)' :
            testResult.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'
        }}
      >
        {testResult.status === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
        {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
        {testResult.status === 'error' && <AlertCircle className="w-4 h-4" />}
        {testResult.status === 'testing' ? 'Testing connection...' :
         testResult.status === 'success' ? 'Connection successful!' :
         testResult.message || 'Connection failed'}
      </div>
    )}

    {/* Provider Settings */}
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Connection Settings */}
      <div className="grid grid-cols-2 gap-4">
        {!provider.isLocal && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              <Key className="w-4 h-4" />
              API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showApiKey[provider.id] ? 'text' : 'password'}
                value={provider.apiKey || ''}
                onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                placeholder={`Enter your ${provider.name} API key`}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
              />
              <button
                onClick={() => setShowApiKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                className="p-2 rounded-lg transition-colors"
              >
                {showApiKey[provider.id] ? <EyeOff className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            <Link2 className="w-4 h-4" />
            Base URL
          </label>
          <input
            type="text"
            value={provider.baseUrl || ''}
            onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
            placeholder="https://api.example.com"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
            style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
          />
        </div>
      </div>

      {/* Default Model */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            <Zap className="w-4 h-4" />
            Default Model
          </label>
          {(provider.isLocal || provider.type === 'openrouter') && (
            <button
              onClick={fetchModels}
              disabled={fetchingModels}
              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors disabled:opacity-50"
              style={{ color: 'var(--color-info)' }}
            >
              {fetchingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Fetch from Server
            </button>
          )}
        </div>
        <select
          value={provider.defaultModel}
          onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
        >
          {[...provider.models].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
            <option key={m.id} value={m.id}>{m.name} - {m.description}</option>
          ))}
        </select>

        {provider.isLocal && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomModel()}
              placeholder="Enter custom model name..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
            />
            <button
              onClick={addCustomModel}
              disabled={!customModelInput.trim()}
              className="px-4 py-2 disabled:opacity-50 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-success)', color: 'var(--theme-text-primary)' }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Models List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            Available Models ({provider.models.length})
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingModels(!editingModels)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: editingModels ? 'var(--color-info-subtle)' : 'transparent',
                color: editingModels ? 'var(--color-info)' : 'var(--theme-text-muted)'
              }}
            >
              <Pencil className="w-3 h-3" />
              {editingModels ? 'Done Editing' : 'Edit Models'}
            </button>
            {editingModels && (
              <button
                onClick={() => setShowAddModel(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
                style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}
              >
                <Plus className="w-3 h-3" />
                Add Model
              </button>
            )}
          </div>
        </div>

        {/* Add Model Form */}
        {showAddModel && (
          <AddModelForm
            newModel={newModel}
            setNewModel={setNewModel}
            onAdd={addModel}
            onCancel={() => { setShowAddModel(false); setNewModel({ id: '', name: '', description: '' }); }}
          />
        )}

        {/* Models Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {[...provider.models].sort((a, b) => a.name.localeCompare(b.name)).map(model => (
            <ModelCard
              key={model.id}
              model={model}
              isDefault={provider.defaultModel === model.id}
              editing={editingModels}
              canDelete={provider.models.length > 1}
              onUpdate={(updates) => updateModelInProvider(model.id, updates)}
              onDelete={() => deleteModel(model.id)}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Help Links Footer */}
    <div className="p-4" style={{ borderTop: '1px solid var(--theme-border-light)', backgroundColor: 'var(--theme-glass-100)' }}>
      <div className="flex items-center justify-between">
        <div className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>Get API Keys:</div>
        <div className="flex gap-4">
          {API_KEY_LINKS.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--color-info)' }}
            >
              {link.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Sub-components ────────────────────────────────────────────────────

const AddModelForm: React.FC<{
  newModel: Partial<ModelOption>;
  setNewModel: React.Dispatch<React.SetStateAction<Partial<ModelOption>>>;
  onAdd: () => void;
  onCancel: () => void;
}> = ({ newModel, setNewModel, onAdd, onCancel }) => (
  <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border)' }}>
    <div className="grid grid-cols-3 gap-3">
      <input
        type="text"
        value={newModel.id || ''}
        onChange={(e) => setNewModel(prev => ({ ...prev, id: e.target.value }))}
        placeholder="Model ID (e.g., gpt-4o)"
        className="px-3 py-2 rounded-lg text-sm font-mono outline-none"
        style={{ backgroundColor: 'var(--theme-surface-dark)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
      />
      <input
        type="text"
        value={newModel.name || ''}
        onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Display Name"
        className="px-3 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: 'var(--theme-surface-dark)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
      />
      <input
        type="text"
        value={newModel.description || ''}
        onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Description"
        className="px-3 py-2 rounded-lg text-sm outline-none"
        style={{ backgroundColor: 'var(--theme-surface-dark)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
      />
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          <input
            type="checkbox"
            checked={newModel.supportsVision || false}
            onChange={(e) => setNewModel(prev => ({ ...prev, supportsVision: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          Vision Support
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          <input
            type="checkbox"
            checked={newModel.supportsStreaming !== false}
            onChange={(e) => setNewModel(prev => ({ ...prev, supportsStreaming: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          Streaming Support
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
          Cancel
        </button>
        <button
          onClick={onAdd}
          disabled={!newModel.id || !newModel.name}
          className="px-4 py-1.5 disabled:opacity-50 text-sm rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--color-success)', color: 'var(--theme-text-primary)' }}
        >
          Add Model
        </button>
      </div>
    </div>
  </div>
);

const ModelCard: React.FC<{
  model: ModelOption;
  isDefault: boolean;
  editing: boolean;
  canDelete: boolean;
  onUpdate: (updates: Partial<ModelOption>) => void;
  onDelete: () => void;
}> = ({ model, isDefault, editing, canDelete, onUpdate, onDelete }) => (
  <div
    className="p-3 rounded-lg transition-colors"
    style={{
      backgroundColor: isDefault ? 'var(--color-info-subtle)' : 'var(--theme-glass-200)',
      border: isDefault ? '1px solid var(--color-info-border)' : '1px solid var(--theme-border-light)'
    }}
  >
    {editing ? (
      <div className="space-y-2">
        <div className="text-xs font-mono" style={{ color: 'var(--theme-text-dim)' }}>{model.id}</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={model.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="flex-1 px-2 py-1 rounded text-sm outline-none"
            style={{ backgroundColor: 'var(--theme-surface-dark)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
          />
          <input
            type="text"
            value={model.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="flex-1 px-2 py-1 rounded text-sm outline-none"
            style={{ backgroundColor: 'var(--theme-surface-dark)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
              <input type="checkbox" checked={model.supportsVision || false} onChange={(e) => onUpdate({ supportsVision: e.target.checked })} className="w-3 h-3" />
              Vision
            </label>
            <label className="flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
              <input type="checkbox" checked={model.supportsStreaming !== false} onChange={(e) => onUpdate({ supportsStreaming: e.target.checked })} className="w-3 h-3" />
              Stream
            </label>
          </div>
          {canDelete && (
            <button onClick={onDelete} className="p-1 rounded transition-colors">
              <Trash2 className="w-3 h-3" style={{ color: 'var(--color-error)' }} />
            </button>
          )}
        </div>
      </div>
    ) : (
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--theme-text-primary)' }}>{model.name}</div>
          <div className="text-xs font-mono truncate" style={{ color: 'var(--theme-text-dim)' }}>{model.id}</div>
          {model.description && (
            <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{model.description}</div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {model.supportsVision && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-feature-subtle)', color: 'var(--color-feature)' }}>Vision</span>
          )}
          {model.supportsStreaming && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>Stream</span>
          )}
        </div>
      </div>
    )}
  </div>
);
