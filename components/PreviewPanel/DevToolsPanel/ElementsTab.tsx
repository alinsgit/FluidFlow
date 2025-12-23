/**
 * ElementsTab - Component tree display
 *
 * Displays React component tree with expand/collapse functionality.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, RefreshCw, Loader2, Box, Code2 } from 'lucide-react';
import type { ElementsTabProps } from './types';
import type { ComponentTreeNode } from '@/utils/sandboxHtml/scripts';

interface TreeNodeProps {
  node: ComponentTreeNode;
  selectedNodeId: string | null;
  expandedNodes: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  onHoverNode: (nodeId: string | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  node,
  selectedNodeId,
  expandedNodes,
  onSelectNode,
  onToggleExpand,
  onHoverNode,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const isComponent = node.type === 'component';

  // Scroll into view when selected (only scroll, don't trigger re-renders)
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      // Use requestAnimationFrame to batch with paint
      requestAnimationFrame(() => {
        nodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [isSelected]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectNode(node.id);
    },
    [node.id, onSelectNode]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand(node.id);
    },
    [node.id, onToggleExpand]
  );

  return (
    <div>
      <div
        ref={nodeRef}
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer transition-all ${
          isSelected
            ? 'bg-purple-500/25 text-purple-200 ring-1 ring-purple-500/50 shadow-sm'
            : 'hover:bg-white/5 text-slate-300 hover:text-white'
        }`}
        style={{ paddingLeft: `${node.depth * 12 + 4}px` }}
        onClick={handleClick}
        onMouseEnter={() => onHoverNode(node.id)}
        onMouseLeave={() => onHoverNode(null)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse mr-0.5" />
        )}

        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button onClick={handleToggle} className="p-0.5 hover:bg-white/10 rounded">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {isComponent ? (
          <Box className={`w-3 h-3 shrink-0 ${isSelected ? 'text-purple-300' : 'text-purple-400'}`} />
        ) : (
          <Code2 className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-300' : 'text-blue-400'}`} />
        )}

        {/* Name */}
        <span
          className={`text-[11px] font-mono truncate ${
            isComponent
              ? isSelected ? 'text-purple-200 font-semibold' : 'text-purple-300 font-medium'
              : isSelected ? 'text-blue-200 font-semibold' : 'text-blue-300'
          }`}
        >
          {isComponent ? node.name : `<${node.name}>`}
        </span>

        {/* State indicator */}
        {node.hasState && (
          <span className="ml-1 px-1 py-0.5 text-[8px] bg-amber-500/20 text-amber-400 rounded">
            state
          </span>
        )}

        {/* Props count */}
        {node.props && Object.keys(node.props).length > 0 && (
          <span className="ml-1 text-[9px] text-slate-500">
            {Object.keys(node.props).length} props
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onSelectNode={onSelectNode}
              onToggleExpand={onToggleExpand}
              onHoverNode={onHoverNode}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const ElementsTab: React.FC<ElementsTabProps> = ({
  tree,
  selectedNodeId,
  expandedNodes,
  onSelectNode,
  onToggleExpand,
  onHoverNode,
  onRefresh,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10">
        <Loader2 className="w-5 h-5 mb-2 animate-spin" />
        <span>Loading component tree...</span>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-10">
        <Box className="w-5 h-5 mb-2 opacity-50" />
        <span>No component tree available</span>
        <button
          onClick={onRefresh}
          className="mt-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Components</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          title="Refresh tree"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tree */}
      <div className="overflow-auto max-h-[calc(100%-40px)]">
        <TreeNode
          node={tree}
          selectedNodeId={selectedNodeId}
          expandedNodes={expandedNodes}
          onSelectNode={onSelectNode}
          onToggleExpand={onToggleExpand}
          onHoverNode={onHoverNode}
        />
      </div>
    </div>
  );
};
