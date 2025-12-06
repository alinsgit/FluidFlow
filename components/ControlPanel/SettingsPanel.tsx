import React, { useState } from 'react';
import { Settings, ChevronUp, ChevronDown, CheckCircle, AlertCircle, GraduationCap, Bug, Settings2, ChevronRight } from 'lucide-react';
import { useDebugStore } from '../../hooks/useDebugStore';
import { getProviderManager } from '../../services/ai';

interface SettingsPanelProps {
  isEducationMode: boolean;
  onEducationModeChange: (value: boolean) => void;
  hasApiKey: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onProviderChange?: (providerId: string, modelId: string) => void;
  onOpenAISettings?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isEducationMode,
  onEducationModeChange,
  hasApiKey,
  selectedModel,
  onModelChange,
  onProviderChange,
  onOpenAISettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { enabled: debugEnabled, setEnabled: setDebugEnabled, logs } = useDebugStore();
  const [, forceUpdate] = useState({});

  const manager = getProviderManager();
  const activeProvider = manager.getActiveConfig();
  const providers = manager.getConfigs();

  const handleProviderChange = (providerId: string) => {
    manager.setActiveProvider(providerId);
    const config = manager.getConfig(providerId);
    if (config && onProviderChange) {
      onProviderChange(providerId, config.defaultModel);
    }
    forceUpdate({});
  };

  const handleModelChange = (modelId: string) => {
    if (activeProvider) {
      manager.updateProvider(activeProvider.id, { defaultModel: modelId });
      onModelChange(modelId);
      forceUpdate({});
    }
  };

  return (
    <div className="border-t border-white/5 pt-2 flex-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5"
        aria-expanded={isOpen}
        aria-controls="settings-panel"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          id="settings-panel"
          className="absolute bottom-16 left-6 right-6 bg-slate-950/90 backdrop-blur-xl rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-4 space-y-4">
            {/* AI Provider Quick Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  AI Provider
                </label>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAISettings?.();
                  }}
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  Full Settings
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Provider Selector */}
              <select
                value={activeProvider?.id || ''}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {!p.apiKey && !p.isLocal ? '(No API Key)' : ''}
                  </option>
                ))}
              </select>

              {/* Model Selector */}
              {activeProvider && activeProvider.models.length > 0 && (
                <select
                  value={activeProvider.defaultModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500/50"
                >
                  {[...activeProvider.models].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 text-xs">
                {activeProvider?.apiKey || activeProvider?.isLocal ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-green-400">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-400">API key required</span>
                  </>
                )}
              </div>
            </div>

            {/* Education Mode */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
                  Education Mode
                </label>
                <button
                  onClick={() => onEducationModeChange(!isEducationMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isEducationMode ? 'bg-yellow-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isEducationMode}
                  aria-label="Toggle education mode"
                >
                  <span
                    className={`${
                      isEducationMode ? 'translate-x-4' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>

            {/* Debug Mode */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-purple-400" />
                  Debug Mode
                  {debugEnabled && logs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {logs.length}
                    </span>
                  )}
                </label>
                <button
                  onClick={() => setDebugEnabled(!debugEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    debugEnabled ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={debugEnabled}
                  aria-label="Toggle debug mode"
                >
                  <span
                    className={`${
                      debugEnabled ? 'translate-x-4' : 'translate-x-1'
                    } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
              {debugEnabled && (
                <p className="text-[10px] text-slate-500 pl-5">
                  API calls logged in Debug tab
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
