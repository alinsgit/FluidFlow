/**
 * useInspectorPanel - Unified hook for InspectorPanel management
 *
 * Combines:
 * - Inspector panel open/close state
 * - Active tab management
 * - Styles inspector
 * - Props inspector
 * - Quick styles actions
 */

import { useState, useCallback, useMemo } from 'react';
import { useSandboxBridge } from './useSandboxBridge';
import { useStylesInspector } from './useStylesInspector';
import { usePropsInspector } from './usePropsInspector';
import type { InspectorTab, EditScope } from '../InspectorPanel/types';

export interface UseInspectorPanelOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Called when applying AI-powered style changes */
  onApplyAIStyle?: (prompt: string, elementRef: string, scope: EditScope) => Promise<void>;
  /** Whether the inspector is enabled */
  enabled?: boolean;
}

export interface UseInspectorPanelReturn {
  // Panel state
  isOpen: boolean;
  activeTab: InspectorTab;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveTab: (tab: InspectorTab) => void;

  // Selected element
  selectedElementRef: string | null;
  selectElement: (elementRef: string | null) => void;

  // Styles tab data
  computedStyles: ReturnType<typeof useStylesInspector>['computedStyles'];
  tailwindClasses: ReturnType<typeof useStylesInspector>['tailwindClasses'];
  isStylesLoading: boolean;
  boxModel: ReturnType<typeof useStylesInspector>['boxModel'];

  // Props tab data
  componentName: string | null;
  componentProps: Record<string, unknown> | null;
  componentState: Array<{ index: number; value: unknown }> | null;
  isPropsLoading: boolean;

  // Quick styles actions
  applyPreset: (prompt: string, scope: EditScope) => void;
  applyCustomStyle: (prompt: string, scope: EditScope) => void;
  applyTempStyle: (styles: Record<string, string>) => Promise<boolean>;
  clearTempStyles: () => void;
  isQuickStylesProcessing: boolean;

  // Bridge reference (for components that need it)
  bridge: ReturnType<typeof useSandboxBridge>;
}

export function useInspectorPanel({
  iframeRef,
  onApplyAIStyle,
  enabled = true,
}: UseInspectorPanelOptions): UseInspectorPanelReturn {
  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>('styles');
  const [selectedElementRef, setSelectedElementRef] = useState<string | null>(null);
  const [isQuickStylesProcessing, setIsQuickStylesProcessing] = useState(false);

  // Sandbox bridge
  const bridge = useSandboxBridge({
    iframeRef,
  });

  // Styles inspector
  const {
    computedStyles,
    tailwindClasses,
    isLoading: isStylesLoading,
    boxModel,
    applyTempStyles: bridgeApplyTempStyles,
    clearTempStyles: bridgeClearTempStyles,
  } = useStylesInspector({
    bridge: enabled ? bridge : null,
    selectedElementRef,
  });

  // Props inspector
  const {
    componentName,
    componentProps,
    componentState,
    isLoading: isPropsLoading,
  } = usePropsInspector({
    bridge: enabled ? bridge : null,
    selectedElementRef,
  });

  // Panel actions
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

  // Select element (opens panel automatically)
  const selectElement = useCallback((elementRef: string | null) => {
    setSelectedElementRef(elementRef);
    if (elementRef) {
      setIsOpen(true);
    }
  }, []);

  // Quick styles: Apply preset
  const applyPreset = useCallback(
    async (prompt: string, scope: EditScope) => {
      if (!selectedElementRef || !onApplyAIStyle) return;

      setIsQuickStylesProcessing(true);
      try {
        await onApplyAIStyle(prompt, selectedElementRef, scope);
      } finally {
        setIsQuickStylesProcessing(false);
      }
    },
    [selectedElementRef, onApplyAIStyle]
  );

  // Quick styles: Apply custom style
  const applyCustomStyle = useCallback(
    async (prompt: string, scope: EditScope) => {
      if (!selectedElementRef || !onApplyAIStyle) return;

      setIsQuickStylesProcessing(true);
      try {
        await onApplyAIStyle(prompt, selectedElementRef, scope);
      } finally {
        setIsQuickStylesProcessing(false);
      }
    },
    [selectedElementRef, onApplyAIStyle]
  );

  // Temp styles (preview)
  const applyTempStyle = useCallback(
    async (styles: Record<string, string>): Promise<boolean> => {
      return bridgeApplyTempStyles(styles);
    },
    [bridgeApplyTempStyles]
  );

  const clearTempStyles = useCallback(() => {
    bridgeClearTempStyles();
  }, [bridgeClearTempStyles]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Panel state
      isOpen,
      activeTab,
      openPanel,
      closePanel,
      togglePanel,
      setActiveTab,

      // Selected element
      selectedElementRef,
      selectElement,

      // Styles tab data
      computedStyles,
      tailwindClasses,
      isStylesLoading,
      boxModel,

      // Props tab data
      componentName,
      componentProps,
      componentState,
      isPropsLoading,

      // Quick styles actions
      applyPreset,
      applyCustomStyle,
      applyTempStyle,
      clearTempStyles,
      isQuickStylesProcessing,

      // Bridge reference
      bridge,
    }),
    [
      isOpen,
      activeTab,
      openPanel,
      closePanel,
      togglePanel,
      setActiveTab,
      selectedElementRef,
      selectElement,
      computedStyles,
      tailwindClasses,
      isStylesLoading,
      boxModel,
      componentName,
      componentProps,
      componentState,
      isPropsLoading,
      applyPreset,
      applyCustomStyle,
      applyTempStyle,
      clearTempStyles,
      isQuickStylesProcessing,
      bridge,
    ]
  );
}
