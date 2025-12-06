import React, { useState } from 'react';
import {
  History, X, ChevronRight, Clock, Pin, FileCode, RotateCcw,
  Save, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { HistoryEntry } from '../hooks/useVersionHistory';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  currentIndex: number;
  onGoToIndex: (index: number) => void;
  onSaveSnapshot: (name: string) => void;
  onPreview?: (index: number) => void;
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Get icon for entry type
function getEntryIcon(entry: HistoryEntry) {
  if (entry.type === 'snapshot') return <Pin className="w-3.5 h-3.5 text-amber-400" />;
  if (entry.label.includes('Initial')) return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
  return <Clock className="w-3.5 h-3.5 text-slate-500" />;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  onGoToIndex,
  onSaveSnapshot,
  onPreview
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [isSnapshotInputOpen, setIsSnapshotInputOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSaveSnapshot = () => {
    if (snapshotName.trim()) {
      onSaveSnapshot(snapshotName.trim());
      setSnapshotName('');
      setIsSnapshotInputOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">History Timeline</h2>
          <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
            {history.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save Snapshot */}
      <div className="px-4 py-3 border-b border-white/5">
        {isSnapshotInputOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSnapshot()}
              placeholder="Snapshot name..."
              className="flex-1 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
              autoFocus
            />
            <button
              onClick={handleSaveSnapshot}
              disabled={!snapshotName.trim()}
              className="p-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsSnapshotInputOpen(false); setSnapshotName(''); }}
              className="p-1.5 hover:bg-white/10 text-slate-400 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSnapshotInputOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Pin className="w-4 h-4" />
            Save Checkpoint
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {[...history].reverse().map((entry, reversedIdx) => {
            const idx = history.length - 1 - reversedIdx;
            const isCurrent = idx === currentIndex;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={`${entry.timestamp}-${idx}`}
                className={`relative mb-1 ${reversedIdx < history.length - 1 ? 'pb-1' : ''}`}
              >
                {/* Timeline connector line */}
                {reversedIdx < history.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-700" />
                )}

                <div
                  className={`relative flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => !isCurrent && onGoToIndex(idx)}
                >
                  {/* Timeline dot */}
                  <div className={`flex-none w-7 h-7 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-blue-500 ring-2 ring-blue-500/30'
                      : entry.type === 'snapshot'
                        ? 'bg-amber-500/20 border border-amber-500/50'
                        : 'bg-slate-800 border border-slate-700'
                  }`}>
                    {isCurrent ? (
                      <ChevronRight className="w-4 h-4 text-white" />
                    ) : (
                      getEntryIcon(entry)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-blue-300' : 'text-slate-300'
                      }`}>
                        {entry.label}
                      </span>
                      <span className="text-[10px] text-slate-500 flex-none">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>

                    {/* Changed files summary */}
                    {entry.changedFiles && entry.changedFiles.length > 0 && (
                      <div className="mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedIndex(isExpanded ? null : idx);
                          }}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-400"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>{entry.changedFiles.length} file{entry.changedFiles.length > 1 ? 's' : ''}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                            {entry.changedFiles.map((file) => (
                              <div
                                key={file}
                                className="text-[10px] font-mono text-slate-500 pl-4 truncate"
                              >
                                {file}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons for non-current entries */}
                    {!isCurrent && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToIndex(idx);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                        {onPreview && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(idx);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                        )}
                      </div>
                    )}

                    {isCurrent && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-white/5 bg-slate-950/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Position: {currentIndex + 1} / {history.length}</span>
          <span>Max: 50 entries</span>
        </div>
      </div>
    </div>
  );
};
