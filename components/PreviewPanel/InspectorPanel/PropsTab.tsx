/**
 * PropsTab - Component Props and State Inspector
 *
 * Displays React component props and state with:
 * - JSON tree viewer with expand/collapse
 * - Type badges (string, number, function, etc.)
 * - Copy value functionality
 * - Real-time update indicator
 */

import React, { useState, useCallback } from 'react';
import { SAVE_INDICATOR_DURATION_MS } from '../../../constants/timing';
import { ChevronRight, ChevronDown, Copy, Check, Code2, Braces, Hash, Type, ToggleLeft, Zap } from 'lucide-react';
import type { PropsTabProps } from './types';

interface JsonTreeProps {
  data: unknown;
  name?: string;
  depth?: number;
  maxDepth?: number;
  onCopy: (text: string) => void;
}

// Get type badge for a value - using CSS variables
function getTypeBadge(value: unknown): { label: string; color: string; icon: React.ReactNode } {
  if (value === null) return { label: 'null', color: 'var(--theme-text-muted)', icon: null };
  if (value === undefined) return { label: 'undefined', color: 'var(--theme-text-muted)', icon: null };
  if (typeof value === 'string') return { label: 'string', color: 'var(--color-success)', icon: <Type className="w-3 h-3" /> };
  if (typeof value === 'number') return { label: 'number', color: 'var(--color-info)', icon: <Hash className="w-3 h-3" /> };
  if (typeof value === 'boolean') return { label: 'boolean', color: 'var(--color-feature)', icon: <ToggleLeft className="w-3 h-3" /> };
  if (typeof value === 'function') return { label: 'function', color: 'var(--color-warning)', icon: <Zap className="w-3 h-3" /> };
  if (Array.isArray(value)) return { label: `array[${value.length}]`, color: 'var(--color-info)', icon: <Braces className="w-3 h-3" /> };
  if (typeof value === 'object') return { label: 'object', color: 'var(--color-warning)', icon: <Code2 className="w-3 h-3" /> };
  return { label: typeof value, color: 'var(--theme-text-muted)', icon: null };
}

// Format value for display
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value.length > 50 ? value.slice(0, 50) + '...' : value}"`;
  if (typeof value === 'function') return 'ƒ()';
  if (typeof value === 'object') return '';
  return String(value);
}

// JSON Tree Node component
const JsonTreeNode: React.FC<JsonTreeProps> = ({ data, name, depth = 0, maxDepth = 5, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [copied, setCopied] = useState(false);

  const isExpandable = data !== null && typeof data === 'object' && Object.keys(data as object).length > 0;
  const typeBadge = getTypeBadge(data);
  const displayValue = formatValue(data);

  const handleCopy = useCallback(() => {
    try {
      const text = JSON.stringify(data, null, 2);
      onCopy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), SAVE_INDICATOR_DURATION_MS);
    } catch {
      onCopy(String(data));
    }
  }, [data, onCopy]);

  if (depth > maxDepth) {
    return (
      <div className="text-xs italic pl-4" style={{ color: 'var(--theme-text-dim)' }}>
        Max depth reached
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div
        className="flex items-center gap-1 py-0.5 rounded px-1 group cursor-pointer"
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse icon */}
        {isExpandable ? (
          <span className="flex-shrink-0" style={{ color: 'var(--theme-text-dim)' }}>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Property name */}
        {name !== undefined && (
          <span className="flex-shrink-0" style={{ color: 'var(--color-feature)' }}>{name}:</span>
        )}

        {/* Type badge */}
        <span className="flex items-center gap-0.5 flex-shrink-0" style={{ color: typeBadge.color }}>
          {typeBadge.icon}
          <span className="text-[10px] opacity-70">{typeBadge.label}</span>
        </span>

        {/* Value preview */}
        {displayValue && (
          <span className="truncate" style={{ color: 'var(--theme-text-secondary)' }}>{displayValue}</span>
        )}

        {/* Copy button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
          title="Copy value"
        >
          {copied ? (
            <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
          ) : (
            <Copy className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
          )}
        </button>
      </div>

      {/* Children */}
      {isExpanded && isExpandable && (
        <div className="ml-3 pl-2" style={{ borderLeft: '1px solid var(--theme-border-light)' }}>
          {Object.entries(data as object).map(([key, value]) => (
            <JsonTreeNode
              key={key}
              data={value}
              name={key}
              depth={depth + 1}
              maxDepth={maxDepth}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PropsTab: React.FC<PropsTabProps> = ({
  props,
  state,
  componentName,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), SAVE_INDICATOR_DURATION_MS);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--theme-text-dim)' }}>
        <div className="animate-pulse">Loading props...</div>
      </div>
    );
  }

  if (!props && !state) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm gap-2 p-4" style={{ color: 'var(--theme-text-dim)' }}>
        <Code2 className="w-8 h-8 opacity-50" />
        <p className="text-center">Select a React component to inspect its props and state</p>
      </div>
    );
  }

  const hasProps = props && Object.keys(props).length > 0;
  const hasState = state && state.length > 0;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Component Name */}
      {componentName && (
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
          <Code2 className="w-4 h-4" style={{ color: 'var(--color-feature)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-feature)' }}>&lt;{componentName}&gt;</span>
        </div>
      )}

      {/* Props Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Props</h3>
          {hasProps && props && (
            <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
              {Object.keys(props).length} {Object.keys(props).length === 1 ? 'prop' : 'props'}
            </span>
          )}
        </div>
        {hasProps ? (
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <JsonTreeNode data={props} onCopy={handleCopy} />
          </div>
        ) : (
          <div className="text-xs italic" style={{ color: 'var(--theme-text-dim)' }}>No props</div>
        )}
      </div>

      {/* State Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>State (Hooks)</h3>
          {hasState && state && (
            <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
              {state.length} {state.length === 1 ? 'hook' : 'hooks'}
            </span>
          )}
        </div>
        {hasState && state ? (
          <div className="space-y-2">
            {state.map((hookState) => (
              <div key={hookState.index} className="rounded-lg p-2" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                <div className="text-[10px] mb-1" style={{ color: 'var(--theme-text-dim)' }}>
                  useState #{hookState.index}
                </div>
                <JsonTreeNode
                  data={hookState.value}
                  onCopy={handleCopy}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs italic" style={{ color: 'var(--theme-text-dim)' }}>No state hooks</div>
        )}
      </div>

      {/* Copy notification */}
      {copied && (
        <div className="fixed bottom-4 right-4 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
          Copied to clipboard
        </div>
      )}
    </div>
  );
};
