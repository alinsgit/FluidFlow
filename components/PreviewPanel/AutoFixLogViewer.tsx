/**
 * AutoFixLogViewer - Debug log viewer for AutoFix pipeline
 *
 * Shows detailed logs including:
 * - AI requests and responses with full prompts
 * - Strategy execution timeline
 * - Timing and token information
 * - Validation results
 */

import React, { useState, useEffect, useRef } from 'react';
import { COPY_FEEDBACK_RESET_MS } from '../../constants/timing';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Check,
  FileCode,
  Trash2,
  Download,
  Filter,
  Search,
  ArrowRight,
  Zap,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  autoFixLogger,
  type AutoFixLogEntry,
  type AIRequestLog,
  type AIResponseLog,
  type LogLevel,
  type LogCategory
} from '../../services/errorFix';
import { formatDuration, formatTime } from '../../utils/timeFormat';

interface AutoFixLogViewerProps {
  className?: string;
  maxHeight?: string;
}

// Color and icon mapping for log levels - using CSS variables
const levelConfig: Record<LogLevel, { color: string; bg: string; icon: React.ReactNode }> = {
  debug: { color: 'var(--theme-text-muted)', bg: 'var(--theme-glass-200)', icon: <Code className="w-3.5 h-3.5" /> },
  info: { color: 'var(--color-info)', bg: 'var(--color-info-subtle)', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  warn: { color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  error: { color: 'var(--color-error)', bg: 'var(--color-error-subtle)', icon: <XCircle className="w-3.5 h-3.5" /> },
  success: { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

// Category labels
const categoryLabels: Record<LogCategory, string> = {
  analyze: 'Analysis',
  'local-fix': 'Local Fix',
  'ai-request': 'AI Request',
  'ai-response': 'AI Response',
  strategy: 'Strategy',
  validation: 'Validation',
  apply: 'Apply',
  timing: 'Timing',
};

export const AutoFixLogViewer: React.FC<AutoFixLogViewerProps> = ({
  className = '',
  maxHeight = '600px'
}) => {
  const [logs, setLogs] = useState<AutoFixLogEntry[]>([]);
  const [aiRequests, setAIRequests] = useState<AIRequestLog[]>([]);
  const [aiResponses, setAIResponses] = useState<AIResponseLog[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<LogCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showPrompts, setShowPrompts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to logger updates
  useEffect(() => {
    // Load initial logs
    setLogs(autoFixLogger.getLogs());
    setAIRequests(autoFixLogger.getAIRequests());
    setAIResponses(autoFixLogger.getAIResponses());

    // Subscribe to new logs
    const unsubscribe = autoFixLogger.subscribe((entry) => {
      setLogs(prev => [...prev, entry]);
      // Refresh AI data
      setAIRequests(autoFixLogger.getAIRequests());
      setAIResponses(autoFixLogger.getAIResponses());
    });

    return unsubscribe;
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    autoFixLogger.clear();
    setLogs([]);
    setAIRequests([]);
    setAIResponses([]);
    setExpandedLogs(new Set());
    setExpandedRequests(new Set());
  };

  const handleExport = () => {
    const data = autoFixLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofix-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), COPY_FEEDBACK_RESET_MS);
  };

  const toggleLogExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleRequestExpand = (id: string) => {
    setExpandedRequests(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.category !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.title.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query) ||
        log.code?.toLowerCase().includes(query)
      );
    }
    return true;
  });



  // Get response for request
  const getResponseForRequest = (requestId: string): AIResponseLog | undefined => {
    return aiResponses.find(r => r.requestId === requestId);
  };

  return (
    <div className={`flex flex-col ${className}`} style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-surface)' }}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>AutoFix Debug Logs</span>
          <span className="text-xs" style={{ color: 'var(--theme-text-dim)' }}>({filteredLogs.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="p-1.5 rounded text-xs transition-colors"
            style={{
              color: autoScroll ? 'var(--color-info)' : 'var(--theme-text-dim)',
              backgroundColor: autoScroll ? 'var(--color-info-subtle)' : 'transparent'
            }}
            title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoScroll ? 'animate-spin-slow' : ''}`} />
          </button>

          {/* Show prompts toggle */}
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="p-1.5 rounded text-xs transition-colors"
            style={{
              color: showPrompts ? 'var(--color-feature)' : 'var(--theme-text-dim)',
              backgroundColor: showPrompts ? 'var(--color-feature-subtle)' : 'transparent'
            }}
            title={showPrompts ? 'Hide AI prompts' : 'Show AI prompts'}
          >
            {showPrompts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--theme-text-dim)' }}
            title="Export logs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--theme-text-dim)' }}
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--theme-border-light)', backgroundColor: 'var(--theme-surface-dark)' }}>
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-8 pr-3 py-1.5 rounded text-xs focus:outline-none"
            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border-light)', color: 'var(--theme-text-secondary)' }}
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogCategory | 'all')}
            className="rounded px-2 py-1.5 text-xs"
            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border-light)', color: 'var(--theme-text-secondary)' }}
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32" style={{ color: 'var(--theme-text-dim)' }}>
            <Bot className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No logs yet</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const config = levelConfig[log.level];
            const hasCode = !!log.code;
            const hasDetails = log.details && Object.keys(log.details).length > 0;
            const isExpandable = hasCode || hasDetails || log.message.length > 150;

            // Check if this is an AI request log
            const aiRequest = log.category === 'ai-request'
              ? aiRequests.find(r => r.id === log.details?.requestId)
              : undefined;
            const aiResponse = aiRequest ? getResponseForRequest(aiRequest.id) : undefined;

            return (
              <div
                key={log.id}
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--theme-border-light)', backgroundColor: config.bg }}
              >
                {/* Log header */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 ${isExpandable ? 'cursor-pointer' : ''}`}
                  onClick={() => isExpandable && toggleLogExpand(log.id)}
                >
                  {isExpandable && (
                    isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                      : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                  )}
                  <span style={{ color: config.color }}>{config.icon}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--theme-text-muted)', backgroundColor: 'var(--theme-glass-200)' }}>
                    {categoryLabels[log.category]}
                  </span>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--theme-text-primary)' }}>{log.title}</span>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-dim)' }}>
                    {log.duration && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDuration(log.duration)}
                      </span>
                    )}
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>

                {/* Log content */}
                <div className={`px-3 pb-2 ${!isExpanded && log.message.length > 150 ? 'max-h-20 overflow-hidden' : ''}`}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    {!isExpanded && log.message.length > 150
                      ? log.message.slice(0, 150) + '...'
                      : log.message
                    }
                  </p>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {/* Code preview */}
                      {hasCode && (
                        <div className="relative">
                          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--theme-text-dim)' }}>
                            <span>Code {log.truncated && '(truncated)'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(log.code ?? '', log.id);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--theme-glass-200)' }}
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="text-xs font-mono p-2 rounded overflow-x-auto max-h-64 overflow-y-auto" style={{ backgroundColor: 'var(--theme-surface-dark)', color: 'var(--theme-text-secondary)' }}>
                            {log.code}
                          </pre>
                        </div>
                      )}

                      {/* Details */}
                      {hasDetails && (
                        <div className="text-xs">
                          <span style={{ color: 'var(--theme-text-dim)' }}>Details:</span>
                          <pre className="font-mono p-2 rounded mt-1 overflow-x-auto" style={{ backgroundColor: 'var(--theme-surface-dark)', color: 'var(--theme-text-secondary)' }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Request/Response section */}
                {showPrompts && aiRequest && (
                  <div style={{ borderTop: '1px solid var(--theme-border-light)' }}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      onClick={() => toggleRequestExpand(aiRequest.id)}
                    >
                      {expandedRequests.has(aiRequest.id)
                        ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                        : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                      }
                      <Zap className="w-3.5 h-3.5" style={{ color: 'var(--color-feature)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-feature)' }}>AI Prompt & Response</span>
                      {aiResponse && (
                        <span className="text-xs" style={{ color: aiResponse.success ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {aiResponse.success ? 'Success' : 'Failed'}
                        </span>
                      )}
                      {aiResponse?.duration && (
                        <span className="text-xs ml-auto" style={{ color: 'var(--theme-text-dim)' }}>
                          {formatDuration(aiResponse.duration)}
                        </span>
                      )}
                    </div>

                    {expandedRequests.has(aiRequest.id) && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* System instruction */}
                        {aiRequest.systemInstruction && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--theme-text-dim)' }}>
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                System Instruction
                              </span>
                              <button
                                onClick={() => handleCopyToClipboard(aiRequest.systemInstruction ?? '', `sys-${aiRequest.id}`)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--theme-glass-200)' }}
                              >
                                {copiedId === `sys-${aiRequest.id}` ? (
                                  <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <pre className="text-xs font-mono p-2 rounded overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap" style={{ backgroundColor: 'var(--color-feature-subtle)', border: '1px solid var(--color-feature)', color: 'var(--theme-text-secondary)' }}>
                              {aiRequest.systemInstruction}
                            </pre>
                          </div>
                        )}

                        {/* Prompt */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--theme-text-dim)' }}>
                            <span className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              Prompt ({aiRequest.prompt.length.toLocaleString()} chars)
                            </span>
                            <button
                              onClick={() => handleCopyToClipboard(aiRequest.prompt, `prompt-${aiRequest.id}`)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--theme-glass-200)' }}
                            >
                              {copiedId === `prompt-${aiRequest.id}` ? (
                                <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <pre className="text-xs font-mono p-2 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap" style={{ backgroundColor: 'var(--color-info-subtle)', border: '1px solid var(--color-info)', color: 'var(--theme-text-secondary)' }}>
                            {aiRequest.prompt}
                          </pre>
                        </div>

                        {/* Response */}
                        {aiResponse && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--theme-text-dim)' }}>
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Response
                                {aiResponse.tokenEstimate && (
                                  <span style={{ color: 'var(--theme-text-dim)' }}>(~{aiResponse.tokenEstimate} tokens)</span>
                                )}
                              </span>
                              {aiResponse.response && (
                                <button
                                  onClick={() => handleCopyToClipboard(aiResponse.response ?? '', `resp-${aiRequest.id}`)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded"
                                  style={{ backgroundColor: 'var(--theme-glass-200)' }}
                                >
                                  {copiedId === `resp-${aiRequest.id}` ? (
                                    <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <pre
                              className="text-xs font-mono p-2 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap"
                              style={{
                                backgroundColor: aiResponse.success ? 'var(--color-success-subtle)' : 'var(--color-error-subtle)',
                                border: `1px solid ${aiResponse.success ? 'var(--color-success)' : 'var(--color-error)'}`,
                                color: 'var(--theme-text-secondary)'
                              }}
                            >
                              {aiResponse.success ? aiResponse.response : aiResponse.error}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                          <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                            Model: {aiRequest.model}
                          </span>
                          <span className="px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                            <FileCode className="w-3 h-3" />
                            {aiRequest.targetFile}
                          </span>
                          {aiRequest.contextFiles && aiRequest.contextFiles.length > 0 && (
                            <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
                              +{aiRequest.contextFiles.length} context files
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Stats footer */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ borderTop: '1px solid var(--theme-border-light)', backgroundColor: 'var(--theme-surface-dark)', color: 'var(--theme-text-dim)' }}>
          <div className="flex items-center gap-4">
            <span>{logs.length} total logs</span>
            <span>{aiRequests.length} AI requests</span>
          </div>
          <div className="flex items-center gap-2">
            {aiResponses.filter(r => r.success).length > 0 && (
              <span style={{ color: 'var(--color-success)' }}>
                {aiResponses.filter(r => r.success).length} successful
              </span>
            )}
            {aiResponses.filter(r => !r.success).length > 0 && (
              <span style={{ color: 'var(--color-error)' }}>
                {aiResponses.filter(r => !r.success).length} failed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoFixLogViewer;
