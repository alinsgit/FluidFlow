/**
 * DevToolsPanel Types
 *
 * Shared types for the DevTools panel components.
 */

import type { LogEntry, NetworkRequest, TerminalTab } from '@/types';
import type { ComponentTreeNode } from '@/utils/sandboxHtml/scripts';

// DevToolsTab is now an alias for TerminalTab for compatibility
export type DevToolsTab = TerminalTab;

export interface DevToolsTabConfig {
  id: DevToolsTab;
  label: string;
  badge?: number;
  color: string;
}

export interface ConsoleTabProps {
  logs: LogEntry[];
  onClear: () => void;
  onFixError: (logId: string, message: string) => void;
}

export interface NetworkTabProps {
  requests: NetworkRequest[];
  onClear: () => void;
}

export interface ElementsTabProps {
  tree: ComponentTreeNode | null;
  selectedNodeId: string | null;
  expandedNodes: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  onHoverNode: (nodeId: string | null) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export interface DevToolsPanelProps {
  logs: LogEntry[];
  networkLogs: NetworkRequest[];
  isOpen: boolean;
  onToggle: () => void;
  activeTab: DevToolsTab;
  onTabChange: (tab: DevToolsTab) => void;
  onClearLogs: () => void;
  onClearNetwork: () => void;
  onFixError: (logId: string, message: string) => void;
  // Elements tab props
  componentTree?: ComponentTreeNode | null;
  selectedNodeId?: string | null;
  expandedNodes?: Set<string>;
  onSelectNode?: (nodeId: string) => void;
  onToggleExpand?: (nodeId: string) => void;
  onHoverNode?: (nodeId: string | null) => void;
  onRefreshTree?: () => void;
  isTreeLoading?: boolean;
}
