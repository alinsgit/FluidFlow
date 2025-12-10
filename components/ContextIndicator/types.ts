/**
 * Shared types for ContextIndicator components
 */

export interface ContextIndicatorProps {
  contextId: string;
  showLabel?: boolean;
  onCompact?: () => Promise<void>;
  className?: string;
}

export interface ContextManagerModalProps {
  contextId: string;
  onClose: () => void;
  onCompact?: () => Promise<void>;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'default';
}
