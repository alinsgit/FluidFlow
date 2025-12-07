import React from 'react';
import { AlertTriangle, X, FileWarning, Check } from 'lucide-react';
import { PendingSyncConfirmation } from '@/hooks/useProject';

interface SyncConfirmationDialogProps {
  confirmation: PendingSyncConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SyncConfirmationDialog: React.FC<SyncConfirmationDialogProps> = ({
  confirmation,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { existingFileCount, newFileCount, message } = confirmation;
  const reductionPercent = existingFileCount > 0
    ? Math.round((1 - newFileCount / existingFileCount) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">File Sync Confirmation</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning Message */}
          <p className="text-slate-300 text-sm leading-relaxed">
            {message}
          </p>

          {/* Stats */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Current file count:</span>
              <span className="text-white font-medium">{existingFileCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">New file count:</span>
              <span className="text-amber-400 font-medium">{newFileCount}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Reduction rate:</span>
              <span className="text-red-400 font-bold">{reductionPercent}%</span>
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/10 rounded-lg p-3">
            <FileWarning className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This action cannot be undone. Make sure your files are correct before confirming.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-slate-800/30">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm and Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncConfirmationDialog;
