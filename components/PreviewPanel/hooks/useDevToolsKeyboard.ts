/**
 * useDevToolsKeyboard - Keyboard shortcuts for DevTools
 *
 * Shortcuts:
 * - Cmd/Ctrl+Shift+I: Toggle DevTools panel
 * - Escape: Clear element selection / close inspector
 * - Cmd/Ctrl+Shift+C: Toggle inspect mode
 */

import { useEffect, useCallback } from 'react';

export interface UseDevToolsKeyboardOptions {
  /** Whether DevTools panel is open */
  isDevToolsOpen: boolean;
  /** Toggle DevTools panel */
  onToggleDevTools: () => void;
  /** Whether inspect mode is active */
  isInspectMode: boolean;
  /** Toggle inspect mode */
  onToggleInspectMode: () => void;
  /** Clear current element selection */
  onClearSelection: () => void;
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean;
}

export interface UseDevToolsKeyboardReturn {
  /** Currently pressed modifier keys */
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    meta: boolean;
    alt: boolean;
  };
}

export function useDevToolsKeyboard({
  isDevToolsOpen,
  onToggleDevTools,
  isInspectMode,
  onToggleInspectMode,
  onClearSelection,
  enabled = true,
}: UseDevToolsKeyboardOptions): UseDevToolsKeyboardReturn {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (event.key !== 'Escape') return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Shift + I: Toggle DevTools
      if (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        onToggleDevTools();
        return;
      }

      // Cmd/Ctrl + Shift + C: Toggle Inspect Mode
      if (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        onToggleInspectMode();
        return;
      }

      // Escape: Clear selection or close DevTools
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isInspectMode) {
          onClearSelection();
        } else if (isDevToolsOpen) {
          onToggleDevTools();
        }
        return;
      }
    },
    [
      enabled,
      isDevToolsOpen,
      isInspectMode,
      onToggleDevTools,
      onToggleInspectMode,
      onClearSelection,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    modifiers: {
      ctrl: false,
      shift: false,
      meta: false,
      alt: false,
    },
  };
}
