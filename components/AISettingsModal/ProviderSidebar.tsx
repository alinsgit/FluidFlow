import React from 'react';
import { Plus, Server, Key, AlertCircle } from 'lucide-react';
import { ProviderConfig, ProviderType, DEFAULT_PROVIDERS } from '@/services/ai';
import { ProviderIcon } from '../shared/ProviderIcon';

interface Props {
  providers: ProviderConfig[];
  activeProviderId: string;
  selectedProviderId: string | null;
  setSelectedProviderId: (id: string | null) => void;
  showAddProvider: boolean;
  setShowAddProvider: (show: boolean) => void;
  newProviderType: ProviderType;
  setNewProviderType: (type: ProviderType) => void;
  addProvider: () => void;
}

export const ProviderSidebar: React.FC<Props> = ({
  providers, activeProviderId, selectedProviderId, setSelectedProviderId,
  showAddProvider, setShowAddProvider, newProviderType, setNewProviderType, addProvider,
}) => (
  <div className="w-64 flex flex-col" style={{ borderRight: '1px solid var(--theme-border-light)', backgroundColor: 'var(--theme-glass-100)' }}>
    <div className="p-3" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
      <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Providers</h3>
    </div>
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => setSelectedProviderId(provider.id)}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
          style={{
            backgroundColor: selectedProviderId === provider.id ? 'var(--color-info-subtle)' : 'transparent',
            border: selectedProviderId === provider.id ? '1px solid var(--color-info-border)' : '1px solid transparent'
          }}
        >
          <ProviderIcon type={provider.type} />
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm truncate" style={{ color: 'var(--theme-text-primary)' }}>{provider.name}</div>
            <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-dim)' }}>{provider.defaultModel}</div>
          </div>
          <div className="flex items-center gap-1">
            {activeProviderId === provider.id && (
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>ACTIVE</span>
            )}
            {provider.isLocal ? (
              <Server className="w-3 h-3" style={{ color: 'var(--color-feature)' }} />
            ) : provider.apiKey ? (
              <Key className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertCircle className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
            )}
          </div>
        </button>
      ))}
    </div>

    {/* Add Provider */}
    <div className="p-2" style={{ borderTop: '1px solid var(--theme-border-light)' }}>
      {showAddProvider ? (
        <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
          <div className="grid grid-cols-2 gap-1">
            {(Object.entries(DEFAULT_PROVIDERS) as [ProviderType, typeof DEFAULT_PROVIDERS.gemini][]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setNewProviderType(type)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors"
                style={{
                  border: newProviderType === type ? '1px solid var(--color-info)' : '1px solid var(--theme-border-light)',
                  backgroundColor: newProviderType === type ? 'var(--color-info-subtle)' : 'transparent'
                }}
              >
                <ProviderIcon type={type} className="w-4 h-4" />
                <span className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>{config.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={addProvider}
              className="flex-1 py-1.5 text-xs rounded transition-colors"
              style={{ backgroundColor: 'var(--color-success)', color: 'var(--theme-text-primary)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddProvider(false)}
              className="px-3 py-1.5 text-xs rounded transition-colors"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddProvider(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      )}
    </div>
  </div>
);
