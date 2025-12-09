import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw, AlertCircle } from 'lucide-react';
import { SettingsSection, SettingsToggle } from '../shared';
import {
  ShortcutsSettings,
  KeyboardShortcut,
  DEFAULT_SHORTCUTS_SETTINGS,
  DEFAULT_SHORTCUTS,
  STORAGE_KEYS
} from '../types';

const SHORTCUT_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'editor', label: 'Editor' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'ai', label: 'AI Features' }
];

export const ShortcutsPanel: React.FC = () => {
  const [settings, setSettings] = useState<ShortcutsSettings>(DEFAULT_SHORTCUTS_SETTINGS);
  const [selectedCategory, setSelectedCategory] = useState('general');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHORTCUTS);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SHORTCUTS_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_SHORTCUTS_SETTINGS);
      }
    }
  }, []);

  const updateSettings = (updates: Partial<ShortcutsSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SHORTCUTS, JSON.stringify(updated));
  };

  const updateShortcut = (id: string, updates: Partial<KeyboardShortcut>) => {
    const updatedShortcuts = settings.customShortcuts.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateSettings({ customShortcuts: updatedShortcuts });
  };

  const resetShortcut = (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (defaultShortcut) {
      updateShortcut(id, { keys: [...defaultShortcut.defaultKeys] });
    }
  };

  const resetAllShortcuts = () => {
    if (!confirm('Reset all shortcuts to defaults?')) return;
    updateSettings({ customShortcuts: DEFAULT_SHORTCUTS });
  };

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      if (key === 'Ctrl') return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
      if (key === 'Shift') return navigator.platform.includes('Mac') ? '⇧' : 'Shift';
      if (key === 'Alt') return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
      if (key === 'Enter') return '↵';
      return key;
    }).join(' + ');
  };

  const filteredShortcuts = settings.customShortcuts.filter(
    s => s.category === selectedCategory
  );

  return (
    <div className="flex h-full">
      {/* Category List - Left */}
      <div className="w-48 border-r border-white/5 flex flex-col bg-slate-950/30">
        <div className="p-3 border-b border-white/5">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Categories</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {SHORTCUT_CATEGORIES.map(cat => {
            const count = settings.customShortcuts.filter(s => s.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full p-2.5 rounded-lg text-left transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{cat.label}</span>
                  <span className="text-xs text-slate-500">{count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Options */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <SettingsToggle
            label="Vim Bindings"
            checked={settings.useVimBindings}
            onChange={(checked) => updateSettings({ useVimBindings: checked })}
          />
          <SettingsToggle
            label="Emacs Bindings"
            checked={settings.useEmacsBindings}
            onChange={(checked) => updateSettings({ useEmacsBindings: checked })}
          />
        </div>
      </div>

      {/* Shortcuts - Right */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Customize keyboard shortcuts</p>
            </div>
          </div>
          <button
            onClick={resetAllShortcuts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Info */}
          <div className="flex items-start gap-3 p-3 bg-slate-800/50 border border-white/5 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              Shortcuts are displayed for your operating system. Some shortcuts may conflict
              with browser or system shortcuts and may not work as expected.
            </p>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-2">
            {filteredShortcuts.map(shortcut => {
              const isModified = JSON.stringify(shortcut.keys) !== JSON.stringify(shortcut.defaultKeys);

              return (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 border border-white/5 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{shortcut.label}</span>
                      {isModified && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          Modified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{shortcut.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-2 py-1 bg-slate-700 border border-white/10 rounded text-xs text-slate-300 font-mono">
                            {formatKeys([key])}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-slate-600">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {isModified && (
                      <button
                        onClick={() => resetShortcut(shortcut.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Reset to default"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-slate-950/30">
          <div className="text-xs text-slate-500">
            <strong>Tip:</strong> Use <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl + K</kbd> to
            open the command palette and discover available actions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
