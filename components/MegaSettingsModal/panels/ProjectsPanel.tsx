import React, { useState, useEffect } from 'react';
import { FolderOpen, GitBranch, Save, FileText } from 'lucide-react';
import { SettingsSection, SettingsToggle, SettingsSelect, SettingsInput, SettingsSlider } from '../shared';
import { ProjectDefaultSettings, DEFAULT_PROJECT_SETTINGS, STORAGE_KEYS } from '../types';
import { TECH_STACK_OPTIONS } from '../../../types';

export const ProjectsPanel: React.FC = () => {
  const [settings, setSettings] = useState<ProjectDefaultSettings>(DEFAULT_PROJECT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECT_DEFAULTS);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_PROJECT_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_PROJECT_SETTINGS);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<ProjectDefaultSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.PROJECT_DEFAULTS, JSON.stringify(updated));
  };

  const formatInterval = (ms: number) => {
    if (ms >= 60000) {
      return `${ms / 60000} minute${ms !== 60000 ? 's' : ''}`;
    }
    return `${ms / 1000} seconds`;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FolderOpen className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Project Defaults</h2>
          <p className="text-xs text-slate-400">Configure default settings for new projects</p>
        </div>
      </div>

      {/* Auto-Save */}
      <SettingsSection
        title="Auto-Save"
        description="Configure automatic saving behavior"
      >
        <SettingsSlider
          label="Auto-Save Interval"
          description={`Save changes every ${formatInterval(settings.autoSaveInterval)}`}
          value={settings.autoSaveInterval}
          onChange={(value) => updateSettings({ autoSaveInterval: value })}
          min={10000}
          max={120000}
          step={10000}
          suffix="ms"
          showValue={false}
        />

        <SettingsToggle
          label="WIP Persistence"
          description="Save work-in-progress to survive page refreshes"
          checked={settings.enableWIPPersistence}
          onChange={(checked) => updateSettings({ enableWIPPersistence: checked })}
        />
      </SettingsSection>

      {/* Git Settings */}
      <SettingsSection
        title="Git Settings"
        description="Default git configuration for new projects"
      >
        <SettingsInput
          label="Default Branch"
          description="Default branch name for new repositories"
          value={settings.defaultGitBranch}
          onChange={(value) => updateSettings({ defaultGitBranch: value })}
          placeholder="main"
          monospace
        />

        <SettingsToggle
          label="Auto-Initialize Git"
          description="Automatically initialize git repository for new projects"
          checked={settings.autoInitGit}
          onChange={(checked) => updateSettings({ autoInitGit: checked })}
        />
      </SettingsSection>

      {/* Project Setup */}
      <SettingsSection
        title="Project Setup"
        description="Default files and structure"
      >
        <SettingsToggle
          label="Create README"
          description="Generate a README.md file for new projects"
          checked={settings.createReadme}
          onChange={(checked) => updateSettings({ createReadme: checked })}
        />

        <SettingsSelect
          label="Default Styling"
          description="Default CSS framework for generated code"
          value={settings.defaultStyling}
          options={TECH_STACK_OPTIONS.styling.map(opt => ({
            value: opt.value,
            label: opt.label,
            description: opt.description
          }))}
          onChange={(value) => updateSettings({ defaultStyling: value })}
        />

        <SettingsSelect
          label="Default Icons"
          description="Default icon library for generated code"
          value={settings.defaultIcons}
          options={TECH_STACK_OPTIONS.icons.map(opt => ({
            value: opt.value,
            label: opt.label,
            description: opt.description
          }))}
          onChange={(value) => updateSettings({ defaultIcons: value })}
        />
      </SettingsSection>

      {/* Info */}
      <div className="p-4 bg-slate-800/50 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm text-slate-300 font-medium">Project Storage</div>
            <div className="text-xs text-slate-500 mt-1">
              Projects are stored locally in the <code className="px-1 py-0.5 bg-slate-700 rounded">projects/</code> directory.
              WIP data is stored in IndexedDB for fast access and page refresh resilience.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPanel;
