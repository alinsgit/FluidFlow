import React, { useState, useEffect } from 'react';
import { Settings2, Code, Bot, Zap, AlertTriangle, Plus, Trash2, Check } from 'lucide-react';
import { SettingsSection, SettingsToggle, SettingsInput, SettingsSlider } from '../shared';
import { AdvancedSettings, DEFAULT_ADVANCED_SETTINGS, STORAGE_KEYS } from '../types';
import { getFluidFlowConfig, AgentConfig } from '../../../services/fluidflowConfig';

export const AdvancedPanel: React.FC = () => {
  const [settings, setSettings] = useState<AdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);
  const [editingRules, setEditingRules] = useState(false);
  const [rulesInput, setRulesInput] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADVANCED);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_ADVANCED_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_ADVANCED_SETTINGS);
      }
    }

    // Load rules from FluidFlowConfig
    const config = getFluidFlowConfig();
    setRulesInput(config.getRules());
    setSettings(prev => ({
      ...prev,
      fluidflowRules: config.getRules(),
      agents: config.getAgents()
    }));
  }, []);

  const updateSettings = (updates: Partial<AdvancedSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.ADVANCED, JSON.stringify(updated));
  };

  const saveRules = () => {
    const config = getFluidFlowConfig();
    config.setRules(rulesInput);
    updateSettings({ fluidflowRules: rulesInput });
    setEditingRules(false);
  };

  const updateAgent = (id: string, updates: Partial<AgentConfig>) => {
    const config = getFluidFlowConfig();
    config.updateAgent(id, updates);
    setSettings(prev => ({
      ...prev,
      agents: config.getAgents()
    }));
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Settings2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Advanced Settings</h2>
          <p className="text-xs text-slate-400">Configure rules, agents, and advanced options</p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p className="font-medium text-amber-400 mb-1">Advanced Settings</p>
          <p className="text-slate-400">
            These settings affect how AI generates code. Incorrect configuration may result
            in unexpected behavior. Make changes carefully.
          </p>
        </div>
      </div>

      {/* Project Rules */}
      <SettingsSection
        title="Project Rules"
        description="Instructions that guide AI code generation"
      >
        <div className="space-y-3">
          {editingRules ? (
            <>
              <textarea
                value={rulesInput}
                onChange={(e) => setRulesInput(e.target.value)}
                className="w-full h-64 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white font-mono outline-none focus:border-blue-500/50 resize-none"
                placeholder="Enter project rules in markdown format..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRulesInput(settings.fluidflowRules);
                    setEditingRules(false);
                  }}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRules}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Rules
                </button>
              </div>
            </>
          ) : (
            <div
              onClick={() => setEditingRules(true)}
              className="p-4 bg-slate-800/50 border border-white/5 rounded-lg cursor-pointer hover:border-white/20 transition-colors"
            >
              <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-32 overflow-hidden">
                {settings.fluidflowRules || 'No rules defined. Click to edit.'}
              </pre>
              <div className="mt-2 text-xs text-blue-400">Click to edit rules</div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Agents */}
      <SettingsSection
        title="AI Agents"
        description="Specialized AI assistants for different tasks"
      >
        <div className="space-y-2">
          {settings.agents.map(agent => (
            <div
              key={agent.id}
              className="border border-white/5 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center gap-3">
                  <Bot className={`w-4 h-4 ${agent.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-sm text-white">{agent.name}</div>
                    <div className="text-xs text-slate-500">{agent.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.enabled && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
              {expandedAgent === agent.id && (
                <div className="p-3 border-t border-white/5 space-y-3">
                  <SettingsToggle
                    label="Enabled"
                    description="Activate this agent"
                    checked={agent.enabled}
                    onChange={(checked) => updateAgent(agent.id, { enabled: checked })}
                  />
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">System Prompt</label>
                    <textarea
                      value={agent.systemPrompt}
                      onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
                      className="w-full h-24 px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-xs text-white font-mono outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* API Settings */}
      <SettingsSection
        title="API Settings"
        description="Configure API behavior"
      >
        <SettingsSlider
          label="API Timeout"
          description="Maximum time to wait for API response"
          value={settings.apiTimeout}
          onChange={(value) => updateSettings({ apiTimeout: value })}
          min={30000}
          max={300000}
          step={10000}
          suffix="ms"
        />

        <SettingsSlider
          label="Max Retries"
          description="Number of times to retry failed requests"
          value={settings.maxRetries}
          onChange={(value) => updateSettings({ maxRetries: value })}
          min={0}
          max={5}
          step={1}
        />
      </SettingsSection>

      {/* Feature Flags */}
      <SettingsSection
        title="Features"
        description="Enable or disable specific features"
      >
        <SettingsToggle
          label="Auto-Fix"
          description="Automatically fix console errors with AI"
          checked={settings.enableAutoFix}
          onChange={(checked) => updateSettings({ enableAutoFix: checked })}
        />

        <SettingsToggle
          label="Quick Edit"
          description="Enable inline component editing"
          checked={settings.enableQuickEdit}
          onChange={(checked) => updateSettings({ enableQuickEdit: checked })}
        />

        <SettingsToggle
          label="Accessibility Check"
          description="Run accessibility analysis on generated code"
          checked={settings.enableAccessibilityCheck}
          onChange={(checked) => updateSettings({ enableAccessibilityCheck: checked })}
        />

        <SettingsToggle
          label="Experimental Features"
          description="Enable experimental and beta features"
          checked={settings.enableExperimentalFeatures}
          onChange={(checked) => updateSettings({ enableExperimentalFeatures: checked })}
        />
      </SettingsSection>
    </div>
  );
};

export default AdvancedPanel;
