/**
 * StatusBarContext - Shared state for the status bar
 *
 * This context allows different components to update status bar information:
 * - PreviewPanel: error/warning counts, runner status, auto-fix status
 * - CodeEditor: cursor position
 *
 * Separated from other contexts to prevent unnecessary re-renders.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ============ Types ============

export interface CursorPosition {
  line: number;
  column: number;
}

export interface StatusBarContextValue {
  // Console log counts
  errorCount: number;
  warningCount: number;
  setLogCounts: (errors: number, warnings: number) => void;

  // Cursor position
  cursorPosition: CursorPosition | null;
  setCursorPosition: (position: CursorPosition | null) => void;

  // Auto-fix status
  autoFixEnabled: boolean;
  isAutoFixing: boolean;
  setAutoFixStatus: (enabled: boolean, isFixing: boolean) => void;

  // Runner status
  isRunnerActive: boolean;
  setRunnerActive: (active: boolean) => void;
}

// ============ Context ============

const StatusBarContext = createContext<StatusBarContextValue | null>(null);

// ============ Provider ============

interface StatusBarProviderProps {
  children: React.ReactNode;
}

export function StatusBarProvider({ children }: StatusBarProviderProps) {
  // Console log counts
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  // Cursor position
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);

  // Auto-fix status
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  // Runner status
  const [isRunnerActive, setIsRunnerActive] = useState(false);

  // Memoized setters
  const setLogCounts = useCallback((errors: number, warnings: number) => {
    setErrorCount(errors);
    setWarningCount(warnings);
  }, []);

  const setAutoFixStatus = useCallback((enabled: boolean, isFixing: boolean) => {
    setAutoFixEnabled(enabled);
    setIsAutoFixing(isFixing);
  }, []);

  const setRunnerActive = useCallback((active: boolean) => {
    setIsRunnerActive(active);
  }, []);

  // Memoized context value
  const value = useMemo<StatusBarContextValue>(() => ({
    errorCount,
    warningCount,
    setLogCounts,
    cursorPosition,
    setCursorPosition,
    autoFixEnabled,
    isAutoFixing,
    setAutoFixStatus,
    isRunnerActive,
    setRunnerActive,
  }), [
    errorCount,
    warningCount,
    setLogCounts,
    cursorPosition,
    autoFixEnabled,
    isAutoFixing,
    setAutoFixStatus,
    isRunnerActive,
    setRunnerActive,
  ]);

  return (
    <StatusBarContext.Provider value={value}>
      {children}
    </StatusBarContext.Provider>
  );
}

// ============ Hooks ============

/**
 * Use all status bar state
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useStatusBar(): StatusBarContextValue {
  const context = useContext(StatusBarContext);
  if (!context) {
    throw new Error('useStatusBar must be used within a StatusBarProvider');
  }
  return context;
}

/**
 * Use only log counts (for components that update error/warning counts)
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useStatusBarLogs() {
  const { errorCount, warningCount, setLogCounts } = useStatusBar();
  return { errorCount, warningCount, setLogCounts };
}

/**
 * Use only cursor position (for CodeEditor)
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useStatusBarCursor() {
  const { cursorPosition, setCursorPosition } = useStatusBar();
  return { cursorPosition, setCursorPosition };
}

/**
 * Use only auto-fix status
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useStatusBarAutoFix() {
  const { autoFixEnabled, isAutoFixing, setAutoFixStatus } = useStatusBar();
  return { autoFixEnabled, isAutoFixing, setAutoFixStatus };
}

/**
 * Use only runner status
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useStatusBarRunner() {
  const { isRunnerActive, setRunnerActive } = useStatusBar();
  return { isRunnerActive, setRunnerActive };
}
