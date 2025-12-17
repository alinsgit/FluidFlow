import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  ExternalLink,
  Loader2,
  Terminal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  X,
  StopCircle,
  Maximize2,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { runnerApi, RunningProjectInfo } from '@/services/projectApi';

// Valid status values for the runner
type RunnerStatus = 'installing' | 'starting' | 'running' | 'error' | 'stopped';

// Device presets for responsive testing
type DeviceType = 'desktop' | 'tablet' | 'mobile';
const DEVICE_SIZES: Record<DeviceType, { width: number; height: number; label: string }> = {
  desktop: { width: 1280, height: 800, label: 'Desktop' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  mobile: { width: 375, height: 667, label: 'Mobile' }
};

interface RunnerPanelProps {
  projectId: string | null;
  projectName?: string;
  hasCommittedFiles?: boolean; // Optional - if false, will run from VFS files directly
  files?: Record<string, string>; // VFS files to run (used when hasCommittedFiles is false)
}

export const RunnerPanel: React.FC<RunnerPanelProps> = ({
  projectId,
  projectName: _projectName,
  hasCommittedFiles,
  files
}) => {
  const [status, setStatus] = useState<RunningProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine effective project ID (use '_temp' for VFS-only runs)
  const effectiveProjectId = projectId || (files && Object.keys(files).length > 0 ? '_temp' : null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    if (!effectiveProjectId) return;

    try {
      const result = await runnerApi.status(effectiveProjectId);
      setStatus(result);

      // If running, also fetch logs
      if (result.running && showLogs) {
        const logsResult = await runnerApi.logs(effectiveProjectId);
        setLogs(logsResult.logs);
      }
    } catch (_err) {
      // Not running is not an error
      setStatus({ status: 'stopped', running: false } as RunningProjectInfo);
    }
  }, [effectiveProjectId, showLogs]);

  // Poll for status when running
  useEffect(() => {
    fetchStatus();

    // Start polling if potentially running
    pollRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchStatus]);

  // Auto-scroll logs - scroll container, not page
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showLogs && logsContainerRef.current) {
      // Scroll the container to bottom, not the page
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, showLogs]);

  // Lock body scroll when modal is open - preserve scroll position
  useEffect(() => {
    if (showLogs || isFullscreen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [showLogs, isFullscreen]);

  // Start project
  const handleStart = async () => {
    if (!effectiveProjectId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Pass VFS files if not using committed files
      const shouldSyncFiles = !hasCommittedFiles && files && Object.keys(files).length > 0;
      const result = await runnerApi.start(effectiveProjectId, shouldSyncFiles ? files : undefined);
      setStatus({
        projectId: effectiveProjectId,
        port: result.port,
        url: result.url,
        status: result.status as RunnerStatus,
        startedAt: Date.now(),
        running: true
      });

      // Increase poll frequency during startup
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchStatus, 1000);

      // Return to normal after 30s
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(fetchStatus, 3000);
      }, 30000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start project');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop project
  const handleStop = async () => {
    if (!effectiveProjectId) return;

    setIsLoading(true);
    setError(null);

    try {
      await runnerApi.stop(effectiveProjectId);
      setStatus({ status: 'stopped', running: false } as RunningProjectInfo);
      setLogs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop project');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Stop all servers
  const handleStopAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await runnerApi.stopAll();
      setStatus({ status: 'stopped', running: false } as RunningProjectInfo);
      setLogs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop servers');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh iframe
  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  // Status badge
  const getStatusBadge = () => {
    if (!status) return null;

    switch (status.status) {
      case 'installing':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            <Loader2 size={12} className="animate-spin" />
            Installing...
          </span>
        );
      case 'starting':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
            <Loader2 size={12} className="animate-spin" />
            Starting...
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <CheckCircle2 size={12} />
            Running
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
            <XCircle size={12} />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs">
            <Square size={12} />
            Stopped
          </span>
        );
    }
  };

  // Check if we have something to run (either a project or VFS files)
  const hasFilesToRun = files && Object.keys(files).length > 0;

  if (!effectiveProjectId && !hasFilesToRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-500">
        <Terminal size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No project or files to run</p>
        <p className="text-xs text-slate-600 mt-1">Create or open a project to run it in development mode</p>
      </div>
    );
  }

  const isRunning = status?.running || status?.status === 'installing' || status?.status === 'starting';
  const isServerReady = status?.status === 'running' && status?.url;

  // Fullscreen Preview Modal
  const FullscreenPreview = () => (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
      onClick={() => setIsFullscreen(false)}
    >
      {/* Header */}
      <div
        className="flex-none flex items-center justify-between p-3 border-b border-white/10 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-emerald-400">Running App</span>
          {status?.url && (
            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono text-slate-400">
              {status.url}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Device selector */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setDeviceType('desktop')}
              className={`p-1.5 rounded ${deviceType === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Desktop"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setDeviceType('tablet')}
              className={`p-1.5 rounded ${deviceType === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Tablet"
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setDeviceType('mobile')}
              className={`p-1.5 rounded ${deviceType === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Mobile"
            >
              <Smartphone size={14} />
            </button>
          </div>
          <button
            onClick={handleRefreshIframe}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <a
            href={status?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            title="Close fullscreen"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Iframe Container */}
      <div
        className="flex-1 flex items-center justify-center bg-[#1a1a2e] p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            width: deviceType === 'desktop' ? '100%' : DEVICE_SIZES[deviceType].width,
            height: deviceType === 'desktop' ? '100%' : DEVICE_SIZES[deviceType].height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {status?.url && (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={status.url}
              className="w-full h-full border-0"
              title="Running App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header - Compact */}
      <div className="flex-none p-2 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-emerald-400" />
            <span className="font-medium text-xs">Run Mode (Beta)</span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLogs(true)}
              className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
              title="View logs"
            >
              <Terminal size={14} />
            </button>
            <button
              onClick={fetchStatus}
              className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {!isRunning ? (
          /* Not Running - Show Start UI */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Play size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-2">Ready to Run</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              Start the dev server to see your app running with full npm dependencies and hot reload.
            </p>
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Start Dev Server
            </button>
            {error && (
              <div className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}
          </div>
        ) : isServerReady ? (
          /* Server Running - Show Embedded Preview */
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Preview Toolbar */}
            <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b border-white/5 bg-slate-900/30">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">{status.url}</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Device selector */}
                <div className="flex items-center gap-0.5 bg-slate-800/50 rounded p-0.5">
                  <button
                    onClick={() => setDeviceType('desktop')}
                    className={`p-1 rounded ${deviceType === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    title="Desktop"
                  >
                    <Monitor size={12} />
                  </button>
                  <button
                    onClick={() => setDeviceType('tablet')}
                    className={`p-1 rounded ${deviceType === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    title="Tablet"
                  >
                    <Tablet size={12} />
                  </button>
                  <button
                    onClick={() => setDeviceType('mobile')}
                    className={`p-1 rounded ${deviceType === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    title="Mobile"
                  >
                    <Smartphone size={12} />
                  </button>
                </div>
                <button
                  onClick={handleRefreshIframe}
                  className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white"
                  title="Fullscreen"
                >
                  <Maximize2 size={12} />
                </button>
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white"
                  title="Open in new tab"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 min-h-0 bg-[#1a1a2e] flex items-center justify-center p-2 overflow-hidden">
              <div
                className="bg-white rounded shadow-lg overflow-hidden transition-all duration-200"
                style={{
                  width: deviceType === 'desktop' ? '100%' : DEVICE_SIZES[deviceType].width,
                  height: deviceType === 'desktop' ? '100%' : DEVICE_SIZES[deviceType].height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={status.url}
                  className="w-full h-full border-0"
                  title="Running App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </div>
            </div>

            {/* Controls Footer */}
            <div className="flex-none flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-slate-900/30">
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
              >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
                Stop Server
              </button>
              <span className="text-[10px] text-slate-600">Port: {status.port}</span>
            </div>
          </div>
        ) : (
          /* Installing/Starting - Show Progress */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
            <h3 className="text-sm font-medium text-white mb-2">
              {status?.status === 'installing' ? 'Installing Dependencies...' : 'Starting Server...'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {status?.status === 'installing'
                ? 'Running npm install - this may take a moment'
                : 'Starting vite dev server...'}
            </p>
            {status?.url && (
              <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
                {status.url}
              </span>
            )}
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
            >
              <Square size={12} />
              Cancel
            </button>
            {error && (
              <div className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stop All Footer */}
      <div className="flex-none p-1.5 border-t border-white/5 flex items-center justify-end bg-slate-950/50">
        <button
          onClick={handleStopAll}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Stop all running servers"
        >
          <StopCircle size={10} />
          Stop All Servers
        </button>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-hidden"
          onClick={() => setShowLogs(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[80vh] bg-slate-900 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-emerald-400" />
                <span className="font-medium">Dev Server Logs</span>
                {logs.length > 0 && (
                  <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                    {logs.length} entries
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowLogs(false)}
                  className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div
              ref={logsContainerRef}
              className="flex-1 overflow-auto p-4 bg-slate-950/50 font-mono text-xs"
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-8">
                  <Terminal size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No logs yet</p>
                  <p className="text-slate-700 mt-1">Logs will appear here when the dev server runs</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`whitespace-pre-wrap break-all py-0.5 ${
                        log.includes('error') || log.includes('Error')
                          ? 'text-red-400'
                          : log.includes('warn') || log.includes('Warning')
                          ? 'text-yellow-400'
                          : log.includes('ready') || log.includes('Local:')
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {isFullscreen && isServerReady && <FullscreenPreview />}
    </div>
  );
};

export default RunnerPanel;
