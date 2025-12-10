import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { ConfirmModalProps } from './types';

const variantStyles = {
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  warning: 'bg-amber-600 hover:bg-amber-500 text-white',
  default: 'bg-blue-600 hover:bg-blue-500 text-white'
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger'
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden mx-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              confirmVariant === 'danger' ? 'bg-red-500/20' :
              confirmVariant === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                confirmVariant === 'danger' ? 'text-red-400' :
                confirmVariant === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`} />
            </div>
            <h3 className="font-medium text-lg">{title}</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-300">{message}</p>
        </div>
        <div className="flex gap-3 p-4 border-t border-white/10 bg-slate-950/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variantStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;
