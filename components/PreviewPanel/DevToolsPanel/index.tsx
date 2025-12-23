/**
 * DevToolsPanel - Chrome-like developer tools panel
 *
 * Features:
 * - Console tab: Log messages with error fixing
 * - Network tab: HTTP requests monitoring
 * - Elements tab: React component tree inspection
 * - Resizable panel height
 * - Tab navigation with badges
 */

import React from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { ConsoleTab } from './ConsoleTab';
import { NetworkTab } from './NetworkTab';
import { ElementsTab } from './ElementsTab';
import type { DevToolsPanelProps, DevToolsTab, DevToolsTabConfig } from './types';

const TABS: DevToolsTabConfig[] = [
  { id: 'console', label: 'Console', color: 'blue' },
  { id: 'network', label: 'Network', color: 'emerald' },
  { id: 'elements', label: 'Elements', color: 'purple' },
];

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  logs,
  networkLogs,
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  onClearLogs,
  onClearNetwork,
  onFixError,
  // Elements tab props
  componentTree,
  selectedNodeId,
  expandedNodes = new Set(),
  onSelectNode,
  onToggleExpand,
  onHoverNode,
  onRefreshTree,
  isTreeLoading = false,
}) => {
  const getTabColor = (tabId: DevToolsTab, isActive: boolean) => {
    if (!isActive) return 'text-slate-500 hover:text-slate-300';
    switch (tabId) {
      case 'console':
        return 'bg-blue-600/20 text-blue-300';
      case 'network':
        return 'bg-emerald-600/20 text-emerald-300';
      case 'elements':
        return 'bg-purple-600/20 text-purple-300';
      default:
        return 'bg-slate-600/20 text-slate-300';
    }
  };

  const getBadge = (tabId: DevToolsTab) => {
    switch (tabId) {
      case 'console':
        return logs.length > 0 ? logs.length : undefined;
      case 'network':
        return networkLogs.length > 0 ? networkLogs.length : undefined;
      default:
        return undefined;
    }
  };

  const handleClear = () => {
    if (activeTab === 'console') {
      onClearLogs();
    } else if (activeTab === 'network') {
      onClearNetwork();
    }
  };

  const canClear = activeTab === 'console' || activeTab === 'network';

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 transition-[height] duration-300 ease-out flex flex-col shadow-2xl z-40 ${
        isOpen ? 'h-64' : 'h-8'
      }`}
      style={{ position: 'absolute' }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="h-8 bg-slate-950 hover:bg-slate-900 cursor-pointer flex items-center justify-between px-4 border-b border-white/5 select-none transition-colors"
        role="button"
        aria-expanded={isOpen}
        aria-label="Toggle DevTools panel"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Terminal className="w-3 h-3 text-blue-400" />
            <span className="font-semibold text-slate-300">DevTools</span>
          </div>

          {isOpen && (
            <div
              className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              {TABS.map((tab) => {
                const badge = getBadge(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-3 py-0.5 rounded text-[10px] font-medium transition-colors ${getTabColor(
                      tab.id,
                      activeTab === tab.id
                    )}`}
                  >
                    {tab.label}
                    {badge !== undefined && ` (${badge})`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isOpen && canClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              title="Clear"
              aria-label={`Clear ${activeTab}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <div className="text-slate-500">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* Panel Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar bg-[#0d1117]">
          {activeTab === 'console' && <ConsoleTab logs={logs} onClear={onClearLogs} onFixError={onFixError} />}
          {activeTab === 'network' && <NetworkTab requests={networkLogs} onClear={onClearNetwork} />}
          {activeTab === 'elements' && (
            <ElementsTab
              tree={componentTree ?? null}
              selectedNodeId={selectedNodeId ?? null}
              expandedNodes={expandedNodes}
              onSelectNode={onSelectNode ?? (() => {})}
              onToggleExpand={onToggleExpand ?? (() => {})}
              onHoverNode={onHoverNode ?? (() => {})}
              onRefresh={onRefreshTree ?? (() => {})}
              isLoading={isTreeLoading}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Re-export types
export type { DevToolsTab, DevToolsTabConfig, DevToolsPanelProps } from './types';
