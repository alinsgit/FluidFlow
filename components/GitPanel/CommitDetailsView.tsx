import React from 'react';
import { ArrowLeft, Eye, Copy, CheckCheck, RotateCcw, Loader2 } from 'lucide-react';
import { CommitDetailsViewProps } from './types';
import { CommitFileIcon } from './CommitFileIcon';

export const CommitDetailsView: React.FC<CommitDetailsViewProps> = ({
  commit,
  isLoading,
  onBack,
  onViewDiff,
  onViewFullDiff,
  onCopyHash,
  copiedHash,
  onRevert,
  isFirstCommit = false
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-5 h-5 mx-auto text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Header with back button */}
      <div className="flex items-center gap-2.5 mb-3">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{commit.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onCopyHash}
              className="flex items-center gap-1.5 text-xs text-slate-500 font-mono hover:text-blue-400 transition-colors"
            >
              {copiedHash === commit.hash ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {commit.hashShort}
            </button>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{commit.author}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <span className="text-xs text-slate-400">
          {commit.stats.filesChanged} file{commit.stats.filesChanged !== 1 ? 's' : ''}
        </span>
        {commit.stats.insertions > 0 && (
          <span className="text-xs text-emerald-400">+{commit.stats.insertions}</span>
        )}
        {commit.stats.deletions > 0 && (
          <span className="text-xs text-red-400">-{commit.stats.deletions}</span>
        )}
        <button
          onClick={onViewFullDiff}
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          All
        </button>
      </div>

      {/* Changed Files */}
      <div className="space-y-1">
        {commit.files.map((file) => (
          <button
            key={file.path}
            onClick={() => onViewDiff(file.path)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-slate-400 hover:bg-white/5 rounded group transition-colors"
          >
            <CommitFileIcon status={file.status} />
            <span className="truncate flex-1 text-left group-hover:text-white transition-colors">
              {file.newPath ? `${file.path} → ${file.newPath}` : file.path}
            </span>
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Revert Button */}
      {onRevert && !isFirstCommit && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onRevert(commit)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-sm font-medium transition-colors border border-amber-500/30"
          >
            <RotateCcw className="w-4 h-4" />
            Restore to this commit
          </button>
        </div>
      )}
    </div>
  );
};

export default CommitDetailsView;
