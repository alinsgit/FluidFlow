import React from 'react';
import { FileText, X, Loader2 } from 'lucide-react';
import { DiffModalProps } from './types';
import { DiffViewer } from './DiffViewer';

export const DiffModal: React.FC<DiffModalProps> = ({ diff, isLoading, fileName, commitHash, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[80vh] bg-slate-900 rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {fileName ? fileName : 'All Changes'}
            </span>
            {commitHash && (
              <span className="text-xs text-slate-500 font-mono">@ {commitHash}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400 mt-2">Loading diff...</p>
            </div>
          ) : diff ? (
            <DiffViewer diff={diff} />
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p>No changes to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffModal;
