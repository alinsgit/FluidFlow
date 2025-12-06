import { useState, useCallback, useMemo } from 'react';
import type { DebugLogEntry, DebugState } from '@/types';

const MAX_LOGS = 500;

const initialState: DebugState = {
  enabled: false,
  logs: [],
  maxLogs: MAX_LOGS,
  filter: {
    types: ['request', 'response', 'stream', 'error', 'info'],
    categories: ['generation', 'accessibility', 'quick-edit', 'auto-fix', 'other'],
    searchQuery: '',
  },
};

let globalDebugState: DebugState = initialState;
let globalListeners: Set<() => void> = new Set();

// Global functions for logging from anywhere
export const debugLog = {
  isEnabled: () => globalDebugState.enabled,

  request: (category: DebugLogEntry['category'], data: Partial<DebugLogEntry>) => {
    if (!globalDebugState.enabled) return data.id || crypto.randomUUID();
    const id = data.id || crypto.randomUUID();
    addLog({
      id,
      timestamp: Date.now(),
      type: 'request',
      category,
      ...data,
    });
    return id;
  },

  response: (category: DebugLogEntry['category'], data: Partial<DebugLogEntry>) => {
    if (!globalDebugState.enabled) return;
    addLog({
      id: data.id || crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'response',
      category,
      ...data,
    });
  },

  stream: (category: DebugLogEntry['category'], data: Partial<DebugLogEntry>) => {
    if (!globalDebugState.enabled) return;
    addLog({
      id: data.id || crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'stream',
      category,
      ...data,
    });
  },

  error: (category: DebugLogEntry['category'], error: string, data?: Partial<DebugLogEntry>) => {
    if (!globalDebugState.enabled) return;
    addLog({
      id: data?.id || crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'error',
      category,
      error,
      ...data,
    });
  },

  info: (category: DebugLogEntry['category'], message: string, data?: Partial<DebugLogEntry>) => {
    if (!globalDebugState.enabled) return;
    addLog({
      id: data?.id || crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'info',
      category,
      response: message,
      ...data,
    });
  },
};

function addLog(entry: DebugLogEntry) {
  globalDebugState = {
    ...globalDebugState,
    logs: [entry, ...globalDebugState.logs].slice(0, globalDebugState.maxLogs),
  };
  globalListeners.forEach(listener => listener());
}

export function useDebugStore() {
  const [, forceUpdate] = useState({});

  // Subscribe to global state changes
  useState(() => {
    const listener = () => forceUpdate({});
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  });

  const setEnabled = useCallback((enabled: boolean) => {
    globalDebugState = { ...globalDebugState, enabled };
    globalListeners.forEach(listener => listener());
  }, []);

  const clearLogs = useCallback(() => {
    globalDebugState = { ...globalDebugState, logs: [] };
    globalListeners.forEach(listener => listener());
  }, []);

  const setFilter = useCallback((filter: Partial<DebugState['filter']>) => {
    globalDebugState = {
      ...globalDebugState,
      filter: { ...globalDebugState.filter, ...filter },
    };
    globalListeners.forEach(listener => listener());
  }, []);

  const filteredLogs = useMemo(() => {
    const { types, categories, searchQuery } = globalDebugState.filter;
    return globalDebugState.logs.filter(log => {
      if (!types.includes(log.type)) return false;
      if (!categories.includes(log.category)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          log.prompt,
          log.response,
          log.error,
          log.model,
          JSON.stringify(log.metadata),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) return false;
      }
      return true;
    });
  }, []);

  return {
    enabled: globalDebugState.enabled,
    logs: globalDebugState.logs,
    filteredLogs,
    filter: globalDebugState.filter,
    setEnabled,
    clearLogs,
    setFilter,
    addLog,
  };
}

export default useDebugStore;
