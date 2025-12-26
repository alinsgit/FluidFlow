import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Zap,
  MessageSquare,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  X,
  Loader2,
  BarChart3,
  Layers,
  Scissors,
  Sparkles,
  Palette,
  FolderTree
} from 'lucide-react';
import { getContextManager, ConversationContext } from '@/services/conversationContext';
import { getFluidFlowConfig, CompactionLog } from '@/services/fluidflowConfig';
import { getProviderManager } from '@/services/ai';
import { getProjectContext, deleteProjectContext, type ProjectContext } from '@/services/projectContext';
import { ContextManagerModalProps } from './types';
import { ConfirmModal } from './ConfirmModal';
import { getModelContextSize } from './utils';

export const ContextManagerModal: React.FC<ContextManagerModalProps> = ({
  contextId,
  projectId,
  onClose,
  onCompact
}) => {
  const [isCompacting, setIsCompacting] = useState(false);
  const [allContexts, setAllContexts] = useState<ConversationContext[]>([]);
  const [compactionLogs, setCompactionLogs] = useState<CompactionLog[]>([]);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'project' | 'all' | 'logs'>('current');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
  } | null>(null);

  const contextManager = getContextManager();
  const fluidflowConfig = getFluidFlowConfig();
  const maxTokens = getModelContextSize();

  // Get current context stats
  const stats = contextManager.getStats(contextId);

  useEffect(() => {
    setAllContexts(contextManager.listContexts());
    setCompactionLogs(fluidflowConfig.getCompactionLogs());
    if (projectId) {
      setProjectContext(getProjectContext(projectId));
    }
    // Note: contextManager and fluidflowConfig are singletons that do not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCompact = async () => {
    if (!onCompact) return;
    setIsCompacting(true);
    try {
      await onCompact();
    } finally {
      setIsCompacting(false);
    }
  };

  const handleClearContext = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Messages',
      message: 'This will clear all messages in the current context. This action cannot be undone.',
      confirmText: 'Clear All',
      variant: 'warning',
      onConfirm: () => {
        contextManager.clearContext(contextId);
        onClose();
      }
    });
  };

  const handleDeleteContext = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Context',
      message: 'This will permanently delete this context and all its messages. This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        contextManager.deleteContext(id);
        setAllContexts(contextManager.listContexts());
      }
    });
  };

  const handleClearLogs = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Logs',
      message: 'This will clear all compaction logs. This action cannot be undone.',
      confirmText: 'Clear Logs',
      variant: 'warning',
      onConfirm: () => {
        fluidflowConfig.clearCompactionLogs();
        setCompactionLogs([]);
      }
    });
  };

  const handleDeleteProjectContext = () => {
    if (!projectId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete AI Context',
      message: 'This will delete the generated style guide and project summary. You can regenerate it anytime from the AI Context button.',
      confirmText: 'Delete',
      variant: 'warning',
      onConfirm: () => {
        deleteProjectContext(projectId);
        setProjectContext(null);
      }
    });
  };

  const usagePercent = stats ? Math.min(100, (stats.tokens / maxTokens) * 100) : 0;
  const isWarning = usagePercent > 60;
  const isCritical = usagePercent > 80;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[90vw] max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-medium text-lg">Context Manager</h2>
              <p className="text-xs text-slate-500">Manage conversation context and memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'current', label: 'Conversation', icon: Layers },
            { id: 'project', label: 'AI Context', icon: Sparkles, highlight: !!projectContext },
            { id: 'all', label: 'All Contexts', icon: Database },
            { id: 'logs', label: 'Logs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'current' | 'project' | 'all' | 'logs')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.id === 'project' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' : 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                  : 'highlight' in tab && tab.highlight ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Current Context Tab */}
          {activeTab === 'current' && stats && (
            <div className="space-y-4">
              {/* Usage Gauge */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Context Usage</span>
                  <span className={`text-sm font-mono ${
                    isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {stats.tokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? 'bg-gradient-to-r from-red-600 to-red-400' :
                      isWarning ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                      'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                {/* Markers */}
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>0%</span>
                  <span className="text-amber-500">60%</span>
                  <span className="text-red-500">80%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <MessageSquare className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-xl font-bold">{stats.messages}</div>
                  <div className="text-xs text-slate-500">Messages</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-xl font-bold">~{Math.round(stats.tokens / 1000)}k</div>
                  <div className="text-xs text-slate-500">Tokens</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <BarChart3 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <div className="text-xl font-bold">{Math.round(usagePercent)}%</div>
                  <div className="text-xs text-slate-500">Usage</div>
                </div>
              </div>

              {/* Context Info */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-2">Context ID</div>
                <code className="text-xs text-slate-300 font-mono break-all">{contextId}</code>
              </div>

              {/* Warning/Status */}
              {isCritical && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-200 font-medium">Critical: Context nearly full</p>
                    <p className="text-xs text-red-200/70 mt-1">
                      Compact now to avoid losing context or degraded performance.
                    </p>
                  </div>
                </div>
              )}

              {isWarning && !isCritical && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-200 font-medium">Warning: Context filling up</p>
                    <p className="text-xs text-amber-200/70 mt-1">
                      Consider compacting to summarize old messages.
                    </p>
                  </div>
                </div>
              )}

              {!isWarning && (
                <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-200 font-medium">Healthy context usage</p>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      Plenty of room for more conversation.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {onCompact && (
                  <button
                    onClick={handleCompact}
                    disabled={isCompacting || stats.messages < 4}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isCompacting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Compacting...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4" />
                        Compact Context
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleClearContext}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Messages
                </button>

                <button
                  onClick={() => {
                    contextManager.clearContext(contextId);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Context
                </button>
              </div>
            </div>
          )}

          {/* Project Context Tab */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              {projectContext ? (
                <>
                  {/* Status */}
                  <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-sm text-purple-200 font-medium">AI Context Active</p>
                      <p className="text-xs text-purple-200/70 mt-1">
                        Generated on {new Date(projectContext.generatedAt).toLocaleDateString()} at {new Date(projectContext.generatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Context Size</span>
                      <span className="text-sm font-mono text-purple-400">
                        ~{Math.ceil(projectContext.combinedPrompt.length / 4)} tokens
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      This context is added to every AI prompt for consistent style and understanding.
                    </p>
                  </div>

                  {/* Style Guide Preview */}
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Palette className="w-4 h-4" />
                      <span className="text-sm font-medium">Style Guide</span>
                    </div>
                    <p className="text-xs text-slate-300">{projectContext.styleGuide.summary}</p>

                    {/* Colors */}
                    {Object.values(projectContext.styleGuide.colors).some(v => v) && (
                      <div>
                        <div className="text-[10px] text-slate-500 mb-1">Colors</div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(projectContext.styleGuide.colors)
                            .filter(([_, v]) => v)
                            .slice(0, 6)
                            .map(([name, value]) => (
                              <span
                                key={name}
                                className="flex items-center gap-1 px-1.5 py-0.5 bg-black/30 rounded text-[10px]"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/20"
                                  style={{ backgroundColor: value?.startsWith('#') ? value : undefined }}
                                />
                                <span className="text-slate-400">{name}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Typography & Borders */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {projectContext.styleGuide.typography.fontFamily && (
                        <div>
                          <span className="text-slate-500">Font:</span>
                          <span className="text-slate-300 ml-1">{projectContext.styleGuide.typography.fontFamily}</span>
                        </div>
                      )}
                      {projectContext.styleGuide.borders.radius && (
                        <div>
                          <span className="text-slate-500">Radius:</span>
                          <span className="text-slate-300 ml-1">{projectContext.styleGuide.borders.radius}</span>
                        </div>
                      )}
                      {projectContext.styleGuide.effects.shadow && (
                        <div>
                          <span className="text-slate-500">Shadow:</span>
                          <span className="text-slate-300 ml-1">{projectContext.styleGuide.effects.shadow}</span>
                        </div>
                      )}
                      {projectContext.styleGuide.spacing.elementGap && (
                        <div>
                          <span className="text-slate-500">Gap:</span>
                          <span className="text-slate-300 ml-1">{projectContext.styleGuide.spacing.elementGap}</span>
                        </div>
                      )}
                    </div>

                    {/* Patterns */}
                    {projectContext.styleGuide.patterns.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {projectContext.styleGuide.patterns.slice(0, 3).map((pattern, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Project Summary Preview */}
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <FolderTree className="w-4 h-4" />
                      <span className="text-sm font-medium">Project Summary</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{projectContext.projectSummary.summary}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Purpose:</span>
                        <p className="text-slate-400 truncate">{projectContext.projectSummary.purpose}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Architecture:</span>
                        <p className="text-slate-400 truncate">{projectContext.projectSummary.architecture}</p>
                      </div>
                    </div>
                    {projectContext.projectSummary.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {projectContext.projectSummary.techStack.slice(0, 5).map((tech, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteProjectContext}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Context
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">No AI Context Generated</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Use the "AI Context" button in the control panel to generate a style guide and project summary for consistent AI responses.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* All Contexts Tab */}
          {activeTab === 'all' && (
            <div className="space-y-2">
              {allContexts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No contexts found</p>
              ) : (
                allContexts.map(ctx => {
                  const ctxUsage = (ctx.estimatedTokens / maxTokens) * 100;
                  const isActive = ctx.id === contextId;

                  return (
                    <div
                      key={ctx.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{ctx.name}</span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{ctx.messages.length} messages</span>
                            <span>~{Math.round(ctx.estimatedTokens / 1000)}k tokens</span>
                            <span>{new Date(ctx.lastUpdatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mini usage bar */}
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ctxUsage > 80 ? 'bg-red-500' :
                                ctxUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, ctxUsage)}%` }}
                            />
                          </div>

                          {!isActive && (
                            <button
                              onClick={() => handleDeleteContext(ctx.id)}
                              className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                              title="Delete context"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Compaction Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {compactionLogs.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No compaction logs yet</p>
              ) : (
                compactionLogs.slice().reverse().map(log => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium">Compaction</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900/50 rounded p-2">
                        <span className="text-slate-500">Before:</span>
                        <span className="text-red-400 ml-1">~{Math.round(log.beforeTokens / 1000)}k</span>
                      </div>
                      <div className="bg-slate-900/50 rounded p-2">
                        <span className="text-slate-500">After:</span>
                        <span className="text-green-400 ml-1">~{Math.round(log.afterTokens / 1000)}k</span>
                      </div>
                      <div className="bg-slate-900/50 rounded p-2">
                        <span className="text-slate-500">Saved:</span>
                        <span className="text-blue-400 ml-1">
                          {Math.round((1 - log.afterTokens / log.beforeTokens) * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">{log.summary}</p>
                  </div>
                ))
              )}

              {compactionLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="w-full mt-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Clear All Logs
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Model: {getProviderManager().getActiveConfig()?.defaultModel || 'Unknown'}</span>
            <span>Max Context: {maxTokens.toLocaleString()} tokens</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.variant}
        />
      )}
    </>
  );
};

export default ContextManagerModal;
