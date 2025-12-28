import React, { useState, useEffect } from 'react';
import { Code } from 'lucide-react';
import { SettingsSection, SettingsToggle, SettingsSelect, SettingsSlider } from '../shared';
import { EditorSettings, DEFAULT_EDITOR_SETTINGS, STORAGE_KEYS } from '../types';

// Monaco Editor theme preview colors (official VS Code theme palettes)
const MONACO_THEME_PREVIEWS = [
  { value: 'vs-dark', label: 'Dark', colors: ['#1e1e1e', '#252526', '#3c3c3c'] },
  { value: 'vs', label: 'Light', colors: ['#ffffff', '#f3f3f3', '#e8e8e8'] },
  { value: 'hc-black', label: 'High Contrast', colors: ['#000000', '#0a0a0a', '#1a1a1a'] }
] as const;

export const EditorPanel: React.FC = () => {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EDITOR_SETTINGS);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_EDITOR_SETTINGS);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<EditorSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.EDITOR_SETTINGS, JSON.stringify(updated));
    // Notify CodeEditor about settings change
    window.dispatchEvent(new CustomEvent('editorSettingsChanged'));
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--theme-accent-subtle)' }}>
          <Code className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Editor Settings</h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Configure code editor appearance and behavior</p>
        </div>
      </div>

      {/* Font & Display */}
      <SettingsSection
        title="Font & Display"
        description="Text appearance settings"
      >
        <SettingsSlider
          label="Font Size"
          description="Size of text in the editor"
          value={settings.fontSize}
          onChange={(value) => updateSettings({ fontSize: value })}
          min={10}
          max={24}
          step={1}
          suffix="px"
        />

        <SettingsSelect
          label="Tab Size"
          description="Number of spaces for indentation"
          value={String(settings.tabSize)}
          options={[
            { value: '2', label: '2 spaces' },
            { value: '4', label: '4 spaces' }
          ]}
          onChange={(value) => updateSettings({ tabSize: Number(value) as 2 | 4 })}
        />

        <SettingsSelect
          label="Line Numbers"
          description="How to display line numbers"
          value={settings.lineNumbers}
          options={[
            { value: 'on', label: 'Absolute' },
            { value: 'relative', label: 'Relative' },
            { value: 'off', label: 'Hidden' }
          ]}
          onChange={(value) => updateSettings({ lineNumbers: value as 'on' | 'off' | 'relative' })}
        />
      </SettingsSection>

      {/* Word Wrap & Minimap */}
      <SettingsSection
        title="Layout"
        description="Editor layout options"
      >
        <SettingsSelect
          label="Word Wrap"
          description="How to handle long lines"
          value={settings.wordWrap}
          options={[
            { value: 'on', label: 'Wrap at viewport' },
            { value: 'off', label: 'No wrapping' },
            { value: 'wordWrapColumn', label: 'Wrap at column' }
          ]}
          onChange={(value) => updateSettings({ wordWrap: value as 'on' | 'off' | 'wordWrapColumn' })}
        />

        <SettingsToggle
          label="Minimap"
          description="Show code minimap on the side"
          checked={settings.minimap}
          onChange={(checked) => updateSettings({ minimap: checked })}
        />

        <SettingsToggle
          label="Smooth Scrolling"
          description="Animate scrolling in the editor"
          checked={settings.smoothScrolling}
          onChange={(checked) => updateSettings({ smoothScrolling: checked })}
        />
      </SettingsSection>

      {/* Cursor */}
      <SettingsSection
        title="Cursor"
        description="Cursor appearance settings"
      >
        <SettingsSelect
          label="Cursor Style"
          description="Shape of the cursor"
          value={settings.cursorStyle}
          options={[
            { value: 'line', label: 'Line' },
            { value: 'block', label: 'Block' },
            { value: 'underline', label: 'Underline' }
          ]}
          onChange={(value) => updateSettings({ cursorStyle: value as 'line' | 'block' | 'underline' })}
        />

        <SettingsSelect
          label="Cursor Animation"
          description="How the cursor blinks"
          value={settings.cursorBlinking}
          options={[
            { value: 'blink', label: 'Blink' },
            { value: 'smooth', label: 'Smooth' },
            { value: 'phase', label: 'Phase' },
            { value: 'expand', label: 'Expand' },
            { value: 'solid', label: 'Solid (no blink)' }
          ]}
          onChange={(value) => updateSettings({ cursorBlinking: value as 'blink' | 'smooth' | 'phase' | 'expand' | 'solid' })}
        />
      </SettingsSection>

      {/* Formatting */}
      <SettingsSection
        title="Formatting"
        description="Auto-formatting options"
      >
        <SettingsToggle
          label="Bracket Pair Colorization"
          description="Color matching brackets for easier reading"
          checked={settings.bracketPairColorization}
          onChange={(checked) => updateSettings({ bracketPairColorization: checked })}
        />

        <SettingsToggle
          label="Format on Paste"
          description="Automatically format code when pasting"
          checked={settings.formatOnPaste}
          onChange={(checked) => updateSettings({ formatOnPaste: checked })}
        />

        <SettingsToggle
          label="Format on Save"
          description="Automatically format code when saving"
          checked={settings.formatOnSave}
          onChange={(checked) => updateSettings({ formatOnSave: checked })}
        />
      </SettingsSection>

      {/* Theme */}
      <SettingsSection
        title="Theme"
        description="Editor theme automatically syncs with app theme"
      >
        {/* Info message */}
        <div
          className="px-3 py-2 rounded-lg text-xs mb-3"
          style={{
            backgroundColor: 'var(--color-info-subtle)',
            color: 'var(--color-info-text)',
            border: '1px solid var(--color-info-border)'
          }}
        >
          Editor theme is automatically set based on your selected app theme. Change the app theme in the Appearance panel to update the editor theme.
        </div>

        <div className="grid grid-cols-3 gap-3">
          {MONACO_THEME_PREVIEWS.map(theme => (
            <div
              key={theme.value}
              className="p-3 rounded-lg border text-center opacity-75"
              style={{
                borderColor: settings.theme === theme.value ? 'var(--theme-accent)' : 'var(--theme-border)',
                backgroundColor: settings.theme === theme.value ? 'var(--theme-accent-subtle)' : 'transparent',
                cursor: 'not-allowed'
              }}
              title="Theme syncs automatically with app theme"
            >
              <div className="flex gap-1 justify-center mb-2">
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-sm flex items-center justify-center gap-1.5" style={{ color: 'var(--theme-text-primary)' }}>
                {theme.label}
                {settings.theme === theme.value && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-text-on-accent)' }}>
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
};

export default EditorPanel;
