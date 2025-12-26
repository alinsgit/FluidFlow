/**
 * ThemeContext - Global theme management
 *
 * Handles theme selection, persistence, and CSS variable application.
 * Themes are applied via CSS custom properties on the document root.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  ThemeId,
  Theme,
  THEMES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  SEMANTIC_COLORS,
} from '../types/theme';

// ============ Types ============

export interface ThemeContextValue {
  // Current theme
  currentTheme: Theme;
  themeId: ThemeId;

  // Theme actions
  setTheme: (themeId: ThemeId) => void;
  resetTheme: () => void;

  // All available themes
  themes: typeof THEMES;
  themeList: Theme[];
}

// ============ CSS Variable Application ============

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  const { colors } = theme;

  // Apply theme colors as CSS custom properties
  root.style.setProperty('--theme-background', colors.background);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-hover', colors.surfaceHover);

  root.style.setProperty('--theme-glass-100', colors.glass100);
  root.style.setProperty('--theme-glass-200', colors.glass200);
  root.style.setProperty('--theme-glass-300', colors.glass300);

  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-border-hover', colors.borderHover);

  root.style.setProperty('--theme-text-primary', colors.textPrimary);
  root.style.setProperty('--theme-text-secondary', colors.textSecondary);
  root.style.setProperty('--theme-text-muted', colors.textMuted);

  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-accent-hover', colors.accentHover);
  root.style.setProperty('--theme-accent-subtle', colors.accentSubtle);

  root.style.setProperty('--theme-gradient-from', colors.gradientFrom);
  root.style.setProperty('--theme-gradient-to', colors.gradientTo);

  root.style.setProperty('--theme-scrollbar-track', colors.scrollbarTrack);
  root.style.setProperty('--theme-scrollbar-thumb', colors.scrollbarThumb);
  root.style.setProperty('--theme-scrollbar-thumb-hover', colors.scrollbarThumbHover);

  // Apply semantic colors (theme-independent)
  root.style.setProperty('--color-success', SEMANTIC_COLORS.success);
  root.style.setProperty('--color-success-subtle', SEMANTIC_COLORS.successSubtle);
  root.style.setProperty('--color-warning', SEMANTIC_COLORS.warning);
  root.style.setProperty('--color-warning-subtle', SEMANTIC_COLORS.warningSubtle);
  root.style.setProperty('--color-error', SEMANTIC_COLORS.error);
  root.style.setProperty('--color-error-subtle', SEMANTIC_COLORS.errorSubtle);
  root.style.setProperty('--color-info', SEMANTIC_COLORS.info);
  root.style.setProperty('--color-info-subtle', SEMANTIC_COLORS.infoSubtle);

  // Set data attribute for potential CSS selectors
  root.setAttribute('data-theme', theme.id);
}

// ============ Context ============

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============ Provider ============

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && stored in THEMES) {
        return stored as ThemeId;
      }
    } catch {
      // localStorage might not be available
    }
    return DEFAULT_THEME;
  });

  // Get current theme object
  const currentTheme = THEMES[themeId];

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newThemeId: ThemeId) => {
    setThemeId(newThemeId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newThemeId);
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, [setTheme]);

  // Create list of themes for iteration
  const themeList = useMemo(() => Object.values(THEMES), []);

  // Memoized context value
  const value = useMemo<ThemeContextValue>(() => ({
    currentTheme,
    themeId,
    setTheme,
    resetTheme,
    themes: THEMES,
    themeList,
  }), [currentTheme, themeId, setTheme, resetTheme, themeList]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============ Hooks ============

/**
 * Use the theme context
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Use only theme selection
 * For components that just need to read/set the theme
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useThemeSelection() {
  const { themeId, setTheme, themeList } = useTheme();
  return { themeId, setTheme, themeList };
}
