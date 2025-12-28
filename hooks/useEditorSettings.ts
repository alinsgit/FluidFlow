import { useState, useEffect, useCallback } from 'react';
import { EditorSettings, DEFAULT_EDITOR_SETTINGS, STORAGE_KEYS } from '../components/MegaSettingsModal/types';
import { useTheme } from '../contexts/ThemeContext';

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const { currentTheme } = useTheme();

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem(STORAGE_KEYS.EDITOR_SETTINGS);
      if (saved) {
        try {
          const parsedSettings = { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(saved) };
          // Auto-sync Monaco theme with current app theme
          parsedSettings.theme = currentTheme.monacoTheme;
          setSettings(parsedSettings);
        } catch {
          setSettings({ ...DEFAULT_EDITOR_SETTINGS, theme: currentTheme.monacoTheme });
        }
      } else {
        setSettings({ ...DEFAULT_EDITOR_SETTINGS, theme: currentTheme.monacoTheme });
      }
    };

    loadSettings();

    // Listen for storage changes (when settings modal updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.EDITOR_SETTINGS) {
        loadSettings();
      }
    };

    // Also listen for custom event for same-tab updates
    const handleSettingsChange = () => loadSettings();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('editorSettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('editorSettingsChanged', handleSettingsChange);
    };
  }, [currentTheme]);

  const updateSettings = useCallback((updates: Partial<EditorSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.EDITOR_SETTINGS, JSON.stringify(updated));
      // Dispatch custom event for same-tab listeners
      window.dispatchEvent(new CustomEvent('editorSettingsChanged'));
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}

// Get current settings without hook (for one-time reads)
export function getEditorSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EDITOR_SETTINGS);
    if (saved) {
      return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_EDITOR_SETTINGS;
}
