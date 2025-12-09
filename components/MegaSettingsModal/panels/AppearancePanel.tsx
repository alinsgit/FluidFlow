import React, { useState, useEffect } from 'react';
import { Palette, Monitor, Tablet, Smartphone, Layout } from 'lucide-react';
import { SettingsSection, SettingsToggle, SettingsSelect, SettingsSlider } from '../shared';
import { AppearanceSettings, DEFAULT_APPEARANCE_SETTINGS, STORAGE_KEYS } from '../types';

export const AppearancePanel: React.FC = () => {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPEARANCE);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_APPEARANCE_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_APPEARANCE_SETTINGS);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<AppearanceSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.APPEARANCE, JSON.stringify(updated));
  };

  const deviceOptions = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'mobile', label: 'Mobile', icon: Smartphone }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Palette className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
          <p className="text-xs text-slate-400">Customize the look and feel of FluidFlow</p>
        </div>
      </div>

      {/* Animations */}
      <SettingsSection
        title="Motion"
        description="Animation and transition settings"
      >
        <SettingsToggle
          label="Enable Animations"
          description="Show smooth transitions and animations throughout the UI"
          checked={settings.animationsEnabled}
          onChange={(checked) => updateSettings({ animationsEnabled: checked })}
        />
      </SettingsSection>

      {/* Layout */}
      <SettingsSection
        title="Layout"
        description="Configure UI layout preferences"
      >
        <SettingsToggle
          label="Compact Mode"
          description="Reduce spacing for more content on screen"
          checked={settings.compactMode}
          onChange={(checked) => updateSettings({ compactMode: checked })}
        />

        <SettingsSlider
          label="Sidebar Width"
          description="Default width of the left sidebar"
          value={settings.sidebarWidth}
          onChange={(value) => updateSettings({ sidebarWidth: value })}
          min={280}
          max={480}
          step={20}
          suffix="px"
        />

        <SettingsToggle
          label="Auto-Collapse File Explorer"
          description="Collapse file explorer when selecting a file"
          checked={settings.autoCollapseFileExplorer}
          onChange={(checked) => updateSettings({ autoCollapseFileExplorer: checked })}
        />
      </SettingsSection>

      {/* Preview */}
      <SettingsSection
        title="Preview"
        description="Default preview settings"
      >
        <div className="space-y-2">
          <label className="text-sm text-white block">Default Preview Device</label>
          <p className="text-xs text-slate-500 mb-3">Device to show by default when previewing</p>
          <div className="grid grid-cols-3 gap-3">
            {deviceOptions.map(device => {
              const Icon = device.icon;
              const isSelected = settings.defaultPreviewDevice === device.value;

              return (
                <button
                  key={device.value}
                  onClick={() => updateSettings({ defaultPreviewDevice: device.value as 'desktop' | 'tablet' | 'mobile' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    {device.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Welcome */}
      <SettingsSection
        title="Startup"
        description="What to show when FluidFlow starts"
      >
        <SettingsToggle
          label="Show Welcome on Startup"
          description="Display the welcome screen when opening FluidFlow"
          checked={settings.showWelcomeOnStartup}
          onChange={(checked) => updateSettings({ showWelcomeOnStartup: checked })}
        />
      </SettingsSection>

      {/* Theme Preview */}
      <SettingsSection
        title="Theme"
        description="Current theme is always dark with glassmorphism"
      >
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10" />
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10" />
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30" />
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20" />
          </div>
          <div className="text-xs text-slate-500">
            FluidFlow uses a custom glassmorphism dark theme optimized for long coding sessions.
            Additional themes may be added in future updates.
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default AppearancePanel;
