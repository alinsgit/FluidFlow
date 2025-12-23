/**
 * useStylesInspector - Hook for fetching and managing element styles
 *
 * Features:
 * - Fetches computed styles from sandbox
 * - Parses Tailwind classes
 * - Manages temporary style application
 * - Caches styles for performance
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ComputedStylesResult } from '@/utils/sandboxHtml/scripts';
import { parseTailwindClasses, type TailwindClassInfo } from '@/utils/tailwindParser';
import type { UseSandboxBridgeReturn } from './useSandboxBridge';

export interface UseStylesInspectorOptions {
  bridge: UseSandboxBridgeReturn | null;
  selectedElementRef: string | null;
}

export interface UseStylesInspectorReturn {
  // State
  computedStyles: ComputedStylesResult | null;
  tailwindClasses: TailwindClassInfo[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshStyles: () => Promise<void>;
  applyTempStyles: (styles: Record<string, string>) => Promise<boolean>;
  clearTempStyles: () => void;

  // Box model convenience
  boxModel: ComputedStylesResult['boxModel'] | null;
}

export function useStylesInspector({
  bridge,
  selectedElementRef,
}: UseStylesInspectorOptions): UseStylesInspectorReturn {
  const [computedStyles, setComputedStyles] = useState<ComputedStylesResult | null>(null);
  const [tailwindClasses, setTailwindClasses] = useState<TailwindClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for styles
  const styleCache = useRef<Map<string, ComputedStylesResult>>(new Map());

  // Fetch styles for selected element
  const refreshStyles = useCallback(async () => {
    if (!bridge || !selectedElementRef) {
      setComputedStyles(null);
      setTailwindClasses([]);
      return;
    }

    // Check cache first
    const cached = styleCache.current.get(selectedElementRef);
    if (cached) {
      setComputedStyles(cached);
      setTailwindClasses(parseTailwindClasses(cached.appliedClasses.join(' ')));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const styles = await bridge.requestComputedStyles(selectedElementRef);

      if (styles) {
        setComputedStyles(styles);
        setTailwindClasses(parseTailwindClasses(styles.appliedClasses.join(' ')));

        // Cache the result
        styleCache.current.set(selectedElementRef, styles);

        // Limit cache size
        if (styleCache.current.size > 50) {
          const firstKey = styleCache.current.keys().next().value;
          if (firstKey) styleCache.current.delete(firstKey);
        }
      } else {
        setError('Failed to fetch styles');
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
      refreshStyles();
    } else {
      setComputedStyles(null);
      setTailwindClasses([]);
    }
  }, [selectedElementRef, refreshStyles]);

  // Apply temporary styles
  const applyTempStyles = useCallback(
    async (styles: Record<string, string>): Promise<boolean> => {
      if (!bridge || !selectedElementRef) return false;

      try {
        return await bridge.applyTempStyles(selectedElementRef, styles);
      } catch {
        return false;
      }
    },
    [bridge, selectedElementRef]
  );

  // Clear temporary styles
  const clearTempStyles = useCallback(() => {
    if (!bridge) return;
    bridge.clearTempStyles(selectedElementRef || undefined);
  }, [bridge, selectedElementRef]);

  // Clear cache when element changes significantly
  useEffect(() => {
    // Capture ref at effect start for cleanup
    const cache = styleCache;
    return () => {
      // Clear cache on unmount
      cache.current.clear();
    };
  }, []);

  // Memoize return object
  return useMemo(
    () => ({
      computedStyles,
      tailwindClasses,
      isLoading,
      error,
      refreshStyles,
      applyTempStyles,
      clearTempStyles,
      boxModel: computedStyles?.boxModel || null,
    }),
    [computedStyles, tailwindClasses, isLoading, error, refreshStyles, applyTempStyles, clearTempStyles]
  );
}
