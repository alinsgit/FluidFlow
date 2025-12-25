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
  Loader2,
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

interface AutoFixLogViewerProps {
  className?: string;
  maxHeight?: string;
}

// Color and icon mapping for log levels
const levelConfig: Record<LogLevel, { color: string; bg: string; icon: React.ReactNode }> = {
  debug: { color: 'text-gray-400', bg: 'bg-gray-800/30', icon: <Code className="w-3.5 h-3.5" /> },
  info: { color: 'text-blue-400', bg: 'bg-blue-900/20', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  warn: { color: 'text-amber-400', bg: 'bg-amber-900/20', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  error: { color: 'text-red-400', bg: 'bg-red-900/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  success: { color: 'text-green-400', bg: 'bg-green-900/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
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
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLogExpand = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRequestExpand = (id: string) => {
    setExpandedRequests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get response for request
  const getResponseForRequest = (requestId: string): AIResponseLog | undefined => {
    return aiResponses.find(r => r.requestId === requestId);
  };

  return (
    <div className={`flex flex-col bg-[#0d1117] text-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">AutoFix Debug Logs</span>
          <span className="text-xs text-gray-500">({filteredLogs.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded text-xs transition-colors ${
              autoScroll ? 'text-blue-400 bg-blue-900/20' : 'text-gray-500 hover:text-gray-300'
            }`}
            title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoScroll ? 'animate-spin-slow' : ''}`} />
          </button>

          {/* Show prompts toggle */}
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showPrompts ? 'text-purple-400 bg-purple-900/20' : 'text-gray-500 hover:text-gray-300'
            }`}
            title={showPrompts ? 'Hide AI prompts' : 'Show AI prompts'}
          >
            {showPrompts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
            title="Export logs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700/30 bg-gray-900/50">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogCategory | 'all')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200"
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
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
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
                className={`rounded border border-gray-700/50 ${config.bg} overflow-hidden`}
              >
                {/* Log header */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 ${isExpandable ? 'cursor-pointer hover:bg-white/5' : ''}`}
                  onClick={() => isExpandable && toggleLogExpand(log.id)}
                >
                  {isExpandable && (
                    isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span className={config.color}>{config.icon}</span>
                  <span className="text-xs font-medium text-gray-400 px-1.5 py-0.5 bg-gray-800/50 rounded">
                    {categoryLabels[log.category]}
                  </span>
                  <span className="text-sm font-medium flex-1">{log.title}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  <p className="text-xs text-gray-300">
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
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Code {log.truncated && '(truncated)'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(log.code!, log.id);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700/50"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto">
                            {log.code}
                          </pre>
                        </div>
                      )}

                      {/* Details */}
                      {hasDetails && (
                        <div className="text-xs">
                          <span className="text-gray-500">Details:</span>
                          <pre className="font-mono bg-black/30 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Request/Response section */}
                {showPrompts && aiRequest && (
                  <div className="border-t border-gray-700/30">
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5"
                      onClick={() => toggleRequestExpand(aiRequest.id)}
                    >
                      {expandedRequests.has(aiRequest.id)
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                      }
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">AI Prompt & Response</span>
                      {aiResponse && (
                        <span className={`text-xs ${aiResponse.success ? 'text-green-400' : 'text-red-400'}`}>
                          {aiResponse.success ? 'Success' : 'Failed'}
                        </span>
                      )}
                      {aiResponse?.duration && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatDuration(aiResponse.duration)}
                        </span>
                      )}
                    </div>

                    {expandedRequests.has(aiRequest.id) && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* System instruction */}
                        {aiRequest.systemInstruction && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                System Instruction
                              </span>
                              <button
                                onClick={() => handleCopyToClipboard(aiRequest.systemInstruction!, `sys-${aiRequest.id}`)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700/50"
                              >
                                {copiedId === `sys-${aiRequest.id}` ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <pre className="text-xs font-mono bg-purple-900/10 border border-purple-800/30 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {aiRequest.systemInstruction}
                            </pre>
                          </div>
                        )}

                        {/* Prompt */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              Prompt ({aiRequest.prompt.length.toLocaleString()} chars)
                            </span>
                            <button
                              onClick={() => handleCopyToClipboard(aiRequest.prompt, `prompt-${aiRequest.id}`)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700/50"
                            >
                              {copiedId === `prompt-${aiRequest.id}` ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <pre className="text-xs font-mono bg-cyan-900/10 border border-cyan-800/30 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {aiRequest.prompt}
                          </pre>
                        </div>

                        {/* Response */}
                        {aiResponse && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Response
                                {aiResponse.tokenEstimate && (
                                  <span className="text-gray-600">(~{aiResponse.tokenEstimate} tokens)</span>
                                )}
                              </span>
                              {aiResponse.response && (
                                <button
                                  onClick={() => handleCopyToClipboard(aiResponse.response!, `resp-${aiRequest.id}`)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700/50"
                                >
                                  {copiedId === `resp-${aiRequest.id}` ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <pre className={`text-xs font-mono p-2 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap ${
                              aiResponse.success
                                ? 'bg-green-900/10 border border-green-800/30'
                                : 'bg-red-900/10 border border-red-800/30'
                            }`}>
                              {aiResponse.success ? aiResponse.response : aiResponse.error}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-gray-800 rounded">
                            Model: {aiRequest.model}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-800 rounded flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            {aiRequest.targetFile}
                          </span>
                          {aiRequest.contextFiles && aiRequest.contextFiles.length > 0 && (
                            <span className="px-2 py-0.5 bg-gray-800 rounded">
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700/30 bg-gray-900/50 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{logs.length} total logs</span>
            <span>{aiRequests.length} AI requests</span>
          </div>
          <div className="flex items-center gap-2">
            {aiResponses.filter(r => r.success).length > 0 && (
              <span className="text-green-400">
                {aiResponses.filter(r => r.success).length} successful
              </span>
            )}
            {aiResponses.filter(r => !r.success).length > 0 && (
              <span className="text-red-400">
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
