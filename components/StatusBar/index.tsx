/**
 * StatusBar - IDE-style status bar at the bottom of the application
 *
 * Displays:
 * - Git branch and status
 * - Server connection status
 * - Error/warning counts from console
 * - Current file info (line/column, encoding)
 * - AI model and generation status
 *
 * Uses StatusBarContext for shared state from PreviewPanel and CodeEditor.
 */
import React, { memo } from 'react';
import {
  GitBranch,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
  Cloud,
  CloudOff,
  Bot,
  FileCode,
  Circle
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useUI } from '../../contexts/UIContext';
import { useStatusBar } from '../../contexts/StatusBarContext';

export const StatusBar = memo(function StatusBar() {
  // Get state from contexts
  const ctx = useAppContext();
  const ui = useUI();
  const statusBar = useStatusBar();

  // Destructure status bar state
  const {
    errorCount,
    warningCount,
    cursorPosition,
    autoFixEnabled,
    isAutoFixing,
    isRunnerActive,
  } = statusBar;

  // Git status
  const gitBranch = ctx.gitStatus?.branch || 'main';
  const hasUncommitted = ctx.hasUncommittedChanges;
  const gitInitialized = ctx.gitStatus?.initialized ?? false;

  // Connection & sync status
  const isOnline = ctx.isServerOnline;
  const isSyncing = ctx.isSyncing;

  // AI status
  const isGenerating = ui.isGenerating;
  const selectedModel = ui.selectedModel;

  // Extract model name from model ID
  const getModelDisplayName = (modelId: string): string => {
    // Handle different model ID formats
    if (modelId.includes('/')) {
      const parts = modelId.split('/');
      const name = parts[parts.length - 1];
      // Shorten common model names
      if (name.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
      if (name.includes('gemini-2.5-pro')) return 'Gemini 2.5 Pro';
      if (name.includes('gemini-3-pro')) return 'Gemini 3 Pro';
      if (name.includes('gemini-3-flash')) return 'Gemini 3 Flash';
      if (name.includes('gpt-4o')) return 'GPT-4o';
      if (name.includes('gpt-4')) return 'GPT-4';
      if (name.includes('claude-3')) return 'Claude 3';
      if (name.includes('claude')) return 'Claude';
      return name;
    }
    return modelId;
  };

  // File info
  const activeFile = ctx.activeFile;
  const fileExtension = activeFile?.split('.').pop()?.toUpperCase() || 'TXT';

  return (
    <footer
      className="h-6 bg-slate-900/80 backdrop-blur-sm border-t border-white/5 text-slate-400 flex items-center justify-between px-2 text-[11px] font-mono select-none shrink-0"
    >
      {/* Left Section */}
      <div className="flex items-center gap-1 h-full">
        {/* Git Branch */}
        {gitInitialized ? (
          <button
            className="flex items-center gap-1.5 hover:bg-white/5 px-2 h-full cursor-pointer transition-colors rounded"
            title={`Branch: ${gitBranch}${hasUncommitted ? ' (uncommitted changes)' : ''}`}
          >
            <GitBranch className="w-3 h-3" />
            <span className="max-w-[100px] truncate">{gitBranch}</span>
            {hasUncommitted && (
              <Circle className="w-1.5 h-1.5 fill-amber-400 text-amber-400" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2 h-full text-slate-500">
            <GitBranch className="w-3 h-3" />
            <span className="italic">no repo</span>
          </div>
        )}

        {/* Sync Status */}
        <div
          className={`flex items-center gap-1.5 px-2 h-full transition-colors rounded ${
            isSyncing ? 'text-blue-400' : 'hover:bg-white/5 cursor-pointer'
          }`}
          title={isSyncing ? 'Syncing...' : isOnline ? 'Connected to server' : 'Server offline'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : isOnline ? (
            <Cloud className="w-3 h-3 text-emerald-400" />
          ) : (
            <CloudOff className="w-3 h-3 text-red-400" />
          )}
        </div>

        {/* Errors & Warnings */}
        <button
          className="flex items-center gap-3 hover:bg-white/5 px-2 h-full cursor-pointer transition-colors rounded"
          title={`${errorCount} error(s), ${warningCount} warning(s)`}
        >
          <div className={`flex items-center gap-1 ${errorCount > 0 ? 'text-red-400' : ''}`}>
            <AlertCircle className="w-3 h-3" />
            <span>{errorCount}</span>
          </div>
          <div className={`flex items-center gap-1 ${warningCount > 0 ? 'text-amber-400' : ''}`}>
            <AlertTriangle className="w-3 h-3" />
            <span>{warningCount}</span>
          </div>
        </button>

        {/* Runner Status */}
        {isRunnerActive && (
          <div
            className="flex items-center gap-1.5 px-2 h-full text-emerald-400"
            title="Dev server running"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Running</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 h-full">
        {/* Cursor Position */}
        {cursorPosition && (
          <div className="hover:bg-white/5 px-2 h-full flex items-center cursor-pointer rounded">
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </div>
        )}

        {/* File Type */}
        <div className="hover:bg-white/5 px-2 h-full flex items-center cursor-pointer rounded gap-1">
          <FileCode className="w-3 h-3" />
          <span>{fileExtension}</span>
        </div>

        {/* Encoding */}
        <div className="hover:bg-white/5 px-2 h-full flex items-center cursor-pointer rounded">
          UTF-8
        </div>

        {/* Auto-fix Status */}
        {autoFixEnabled && (
          <div
            className={`flex items-center gap-1 px-2 h-full rounded ${
              isAutoFixing ? 'text-amber-400' : 'text-emerald-400'
            }`}
            title={isAutoFixing ? 'Auto-fixing error...' : 'Auto-fix enabled'}
          >
            {isAutoFixing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            <span>AutoFix</span>
          </div>
        )}

        {/* AI Model & Status */}
        <div
          className={`flex items-center gap-1.5 px-2 h-full rounded ${
            isGenerating
              ? 'text-blue-400 bg-blue-500/10'
              : 'hover:bg-white/5 cursor-pointer'
          }`}
          title={isGenerating ? 'AI is generating...' : `Model: ${selectedModel}`}
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Bot className="w-3 h-3" />
          )}
          <span className="max-w-[120px] truncate">
            {isGenerating ? 'Generating...' : getModelDisplayName(selectedModel)}
          </span>
        </div>

        {/* Connection Status */}
        <div
          className={`px-2 h-full flex items-center rounded ${
            isOnline ? 'text-emerald-400' : 'text-red-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
        </div>
      </div>
    </footer>
  );
});

export default StatusBar;
