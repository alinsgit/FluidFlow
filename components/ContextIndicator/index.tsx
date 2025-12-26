import React, { useState, useEffect } from 'react';
import {
  Zap,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { getContextManager } from '@/services/conversationContext';
import { getProjectContext } from '@/services/projectContext';
import { ContextIndicatorProps, ProjectContextInfo } from './types';
import { getMinRemainingTokens, getModelContextSize, getRemainingContext, needsCompaction } from './utils';
import { ContextManagerModal } from './ContextManagerModal';

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  contextId,
  projectId,
  showLabel: _showLabel = true,
  onCompact,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<{ messages: number; tokens: number } | null>(null);
  const [projectContextInfo, setProjectContextInfo] = useState<ProjectContextInfo | null>(null);

  const contextManager = getContextManager();
  const minRemainingTokens = getMinRemainingTokens();
  const modelContextSize = getModelContextSize();

  useEffect(() => {
    const updateStats = () => {
      // Ensure context exists before getting stats
      contextManager.getContext(contextId);
      const s = contextManager.getStats(contextId);
      if (s) {
        setStats({ messages: s.messages, tokens: s.tokens });
      }

      // Check project context
      if (projectId) {
        const projectCtx = getProjectContext(projectId);
        if (projectCtx) {
          setProjectContextInfo({
            exists: true,
            generatedAt: projectCtx.generatedAt,
            tokens: Math.ceil(projectCtx.combinedPrompt.length / 4)
          });
        } else {
          setProjectContextInfo({ exists: false });
        }
      }
    };

    updateStats();
    // Update every 2 seconds
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
    // Note: contextManager is a singleton that doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextId, projectId]);

  if (!stats) {
    // Initialize with default stats while loading
    const aiContextTokens = projectContextInfo?.tokens || 0;
    const initialPercent = Math.min(100, (aiContextTokens / modelContextSize) * 100);
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${initialPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">{Math.round(initialPercent)}%</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span className="text-slate-400">Msg:</span>
            0
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span className="text-slate-400">Tok:</span>
            {aiContextTokens > 0 ? `${Math.round(aiContextTokens / 1000)}k` : '0k'}
          </span>
        </div>
        <div className="w-4 h-4" /> {/* Spacer for clear button */}
      </div>
    );
  }

  // Calculate total tokens including AI Context
  const aiContextTokens = projectContextInfo?.exists ? (projectContextInfo.tokens || 0) : 0;
  const totalTokens = stats.tokens + aiContextTokens;

  // Calculate usage and remaining context based on TOTAL tokens
  const usagePercent = Math.min(100, (totalTokens / modelContextSize) * 100);
  const remainingTokens = getRemainingContext(totalTokens);
  const needsCompact = needsCompaction(totalTokens);

  // Warning levels based on remaining context (not usage percentage)
  // Warning when remaining is less than 2x minimum
  // Critical when remaining is less than minimum (needs compaction)
  const isWarning = remainingTokens < minRemainingTokens * 2;
  const isCritical = needsCompact;

  const getColor = () => {
    if (isCritical) return 'text-red-400';
    if (isWarning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getBgColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Build tooltip with breakdown
  const tooltipParts = [
    `${totalTokens.toLocaleString()} tokens used`,
    aiContextTokens > 0 ? `(${aiContextTokens.toLocaleString()} AI Context + ${stats.tokens.toLocaleString()} chat)` : '',
    `• ${remainingTokens.toLocaleString()} remaining`,
    `• ${modelContextSize.toLocaleString()} total`
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Compact Indicator */}
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors ${className}`}
        title={tooltipParts}
      >
        {/* Mini progress bar - segmented for AI Context + Chat */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            {/* AI Context segment (purple) */}
            {aiContextTokens > 0 && (
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${(aiContextTokens / modelContextSize) * 100}%` }}
              />
            )}
            {/* Chat segment (color based on status) */}
            <div
              className={`h-full ${getBgColor()} transition-all duration-300`}
              style={{ width: `${(stats.tokens / modelContextSize) * 100}%` }}
            />
          </div>

          <span className={`text-xs font-mono ${getColor()} whitespace-nowrap`}>
            {Math.round(usagePercent)}%
          </span>

          {isCritical && (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
          )}
        </button>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono whitespace-nowrap">
          {/* Project Context Badge */}
          {projectContextInfo && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                projectContextInfo.exists
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-slate-700/50 text-slate-500'
              }`}
              title={projectContextInfo.exists && projectContextInfo.generatedAt
                ? `AI Context active: ~${projectContextInfo.tokens}tok (generated ${new Date(projectContextInfo.generatedAt).toLocaleDateString()})`
                : 'No AI Context generated'
              }
            >
              <Sparkles className="w-3 h-3" />
              {projectContextInfo.exists && (
                <span className="text-[10px]">~{projectContextInfo.tokens}</span>
              )}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span className="text-slate-400">Msg:</span>
            {stats.messages}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span className="text-slate-400">Tok:</span>
            {Math.round(totalTokens / 1000)}k
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Quick Compact Button - show when remaining context is low */}
          {isWarning && onCompact && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompact();
              }}
              className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
              title="Compact context"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {/* Clear Messages Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              contextManager.clearContext(contextId);
            }}
            className="p-1.5 hover:bg-slate-700/50 rounded text-slate-500 hover:text-red-400 transition-colors"
            title="Clear messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <ContextManagerModal
          contextId={contextId}
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onCompact={onCompact}
        />
      )}
    </>
  );
};

export default ContextIndicator;

// Re-export all components for external use
export { ConfirmModal } from './ConfirmModal';
export { ContextManagerModal } from './ContextManagerModal';
// eslint-disable-next-line react-refresh/only-export-components -- Utility re-export for module API
export { getModelContextSize } from './utils';
export type { ContextIndicatorProps, ContextManagerModalProps, ConfirmModalProps } from './types';
