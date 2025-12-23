/**
 * usePropsInspector - Hook for fetching component props and state
 *
 * Features:
 * - Fetches props from selected component
 * - Extracts React hooks state
 * - Caches results for performance
 * - Auto-refreshes on element selection change
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { UseSandboxBridgeReturn } from './useSandboxBridge';

export interface NodeDetails {
  name: string | null;
  props: Record<string, unknown> | null;
  state: Array<{ index: number; value: unknown }> | null;
}

export interface UsePropsInspectorOptions {
  bridge: UseSandboxBridgeReturn | null;
  selectedElementRef: string | null;
}

export interface UsePropsInspectorReturn {
  // State
  componentName: string | null;
  componentProps: Record<string, unknown> | null;
  componentState: Array<{ index: number; value: unknown }> | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshProps: () => Promise<void>;
}

export function usePropsInspector({
  bridge,
  selectedElementRef,
}: UsePropsInspectorOptions): UsePropsInspectorReturn {
  const [componentName, setComponentName] = useState<string | null>(null);
  const [componentProps, setComponentProps] = useState<Record<string, unknown> | null>(null);
  const [componentState, setComponentState] = useState<Array<{ index: number; value: unknown }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for props
  const propsCache = useRef<Map<string, NodeDetails>>(new Map());

  // Fetch props for selected element
  const refreshProps = useCallback(async () => {
    if (!bridge || !selectedElementRef) {
      setComponentName(null);
      setComponentProps(null);
      setComponentState(null);
      return;
    }

    // Check cache first
    const cached = propsCache.current.get(selectedElementRef);
    if (cached) {
      setComponentName(cached.name);
      setComponentProps(cached.props);
      setComponentState(cached.state);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await bridge.requestNodeDetails(selectedElementRef);
      const details = response as NodeDetails | null;

      if (details) {
        setComponentName(details.name);
        setComponentProps(details.props);
        setComponentState(details.state);

        // Cache the result
        propsCache.current.set(selectedElementRef, details);

        // Limit cache size
        if (propsCache.current.size > 50) {
          const firstKey = propsCache.current.keys().next().value;
          if (firstKey) propsCache.current.delete(firstKey);
        }
      } else {
        setComponentName(null);
        setComponentProps(null);
        setComponentState(null);
        setError('No component details found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [bridge, selectedElementRef]);

  // Auto-fetch when element changes
  useEffect(() => {
    if (selectedElementRef) {
      refreshProps();
    } else {
      setComponentName(null);
      setComponentProps(null);
      setComponentState(null);
    }
  }, [selectedElementRef, refreshProps]);

  // Clear cache on unmount
  useEffect(() => {
    // Capture ref at effect start for cleanup
    const cache = propsCache;
    return () => {
      cache.current.clear();
    };
  }, []);

  // Memoize return object
  return useMemo(
    () => ({
      componentName,
      componentProps,
      componentState,
      isLoading,
      error,
      refreshProps,
    }),
    [componentName, componentProps, componentState, isLoading, error, refreshProps]
  );
}
